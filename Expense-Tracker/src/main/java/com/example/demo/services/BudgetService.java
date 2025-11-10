package com.example.demo.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.example.demo.entity.Budget;
import com.example.demo.entity.User;
import com.example.demo.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    public Budget createBudget(Budget budget) {

        User user = budget.getUser();
        BigDecimal walletBalance = user.getWalletBalance();

        if (walletBalance == null || walletBalance.compareTo(BigDecimal.ZERO) == 0) {
            throw new RuntimeException("Please set your wallet balance before creating a budget.");
        }

        // Get sum of user's existing budgets
        BigDecimal existingBudgetsSum = budgetRepository.sumBudgetsByUserId(user.getUserId());
        if (existingBudgetsSum == null) {
            existingBudgetsSum = BigDecimal.ZERO;
        }

        // Check if new total exceeds wallet
        BigDecimal newTotalBudgets = existingBudgetsSum.add(budget.getBudgetAmount());
        if (newTotalBudgets.compareTo(walletBalance) > 0) {
            BigDecimal available = walletBalance.subtract(existingBudgetsSum);
            throw new RuntimeException("Total budgets (" + newTotalBudgets + ") cannot exceed wallet balance (" + walletBalance + "). You only have " + available + " left to budget.");
        }

        return budgetRepository.save(budget);
    }

    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public Optional<Budget> getBudgetById(Integer id) {
        return budgetRepository.findById(id);
    }

    public Budget updateBudget(Integer id,Budget budget) {
        Optional<Budget> optionalBudget = budgetRepository.findById(id);
        if (!optionalBudget.isPresent()) {
            throw new RuntimeException("Budget not found with id " + id);
        }
        Budget existingBudget = optionalBudget.get();
        existingBudget.setUser(budget.getUser());
        existingBudget.setCategory(budget.getCategory());
        existingBudget.setBudgetAmount(budget.getBudgetAmount());
        existingBudget.setStartDate(budget.getStartDate());
        existingBudget.setEndDate(budget.getEndDate());
        return budgetRepository.save(existingBudget);
    }

    public void deleteBudget(Integer id) {
        budgetRepository.deleteById(id);
    }
    public List<Budget> findBudgetsByUserId(Integer userId) {
        // You'll need to add the findByUser_Id method to your repository
        return budgetRepository.findByUser_UserId(userId);
    }
}
