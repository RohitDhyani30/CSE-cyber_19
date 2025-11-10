package com.example.demo.services;

import com.example.demo.entity.Expense;
import com.example.demo.entity.User;
import com.example.demo.repository.ExpenseRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import this

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    // Use constructor injection for required repositories
    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @Transactional // Ensures this is an all-or-nothing operation
    public Expense createExpense(Expense expense) {
        User user = expense.getUser();
        BigDecimal expenseAmount = expense.getExpenseAmount();

        if (user == null) {
            // This can happen if the user ID sent from frontend is wrong
            throw new RuntimeException("User not found for this expense.");
        }

        // 1. Check wallet balance
        BigDecimal currentWallet = user.getWalletBalance();
        if (currentWallet == null) {
            currentWallet = BigDecimal.ZERO; // Treat null wallet as 0
        }

        if (currentWallet.compareTo(expenseAmount) < 0) {
            throw new RuntimeException("Insufficient wallet balance. You only have " + currentWallet + ".");
        }

        // 2. Deduct from wallet
        user.setWalletBalance(currentWallet.subtract(expenseAmount));
        userRepository.save(user); // Save the updated user wallet

        // 3. Save the new expense
        return expenseRepository.save(expense);
    }

    /**
     * Gets all expenses for all users (Admin function).
     */
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Integer id) {
        return expenseRepository.findById(id);
    }

    public List<Expense> findExpensesByUserId(Integer userId) {
        return expenseRepository.findByUser_UserId(userId);
    }

    @Transactional
    public Expense updateExpense(Integer id, Expense expenseDetails) {
        // 1. Find the original expense
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        User user = existingExpense.getUser();
        BigDecimal oldAmount = existingExpense.getExpenseAmount();
        BigDecimal newAmount = expenseDetails.getExpenseAmount();

        BigDecimal amountDifference = newAmount.subtract(oldAmount);

        BigDecimal currentWallet = user.getWalletBalance();
        if (currentWallet == null) {
            currentWallet = BigDecimal.ZERO;
        }

        if (currentWallet.compareTo(amountDifference) < 0) {
            throw new RuntimeException("User's wallet balance is too low to make this adjustment.");
        }

        user.setWalletBalance(currentWallet.subtract(amountDifference));
        userRepository.save(user); // Save updated wallet

        existingExpense.setUser(expenseDetails.getUser());
        existingExpense.setCategory(expenseDetails.getCategory());
        existingExpense.setExpenseAmount(newAmount);
        existingExpense.setExpenseDate(expenseDetails.getExpenseDate());
        existingExpense.setNote(expenseDetails.getNote());

        return expenseRepository.save(existingExpense);
    }


    @Transactional
    public void deleteExpense(Integer id) {
        // 1. Find the expense *before* deleting it
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        User user = expense.getUser();
        BigDecimal refundAmount = expense.getExpenseAmount();

        BigDecimal currentWallet = user.getWalletBalance();
        if (currentWallet == null) {
            currentWallet = BigDecimal.ZERO;
        }
        user.setWalletBalance(currentWallet.add(refundAmount));
        userRepository.save(user); // Save the refunded user

        expenseRepository.delete(expense);
    }

    public List<Expense> findByCategoryName(String categoryName) {
        // This now correctly calls the native query in your ExpenseRepository
        return expenseRepository.findByCategoryName(categoryName);
    }
}