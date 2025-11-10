package com.example.demo.controller;

import com.example.demo.dto.ExpenseRequest;
import com.example.demo.entity.Category;
import com.example.demo.entity.Expense;
import com.example.demo.entity.User;
import com.example.demo.repository.ExpenseRepository;
import com.example.demo.services.CategoryService;
import com.example.demo.services.ExpenseService;
import com.example.demo.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/expenses")
public class expenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final CategoryService categoryService;
    public expenseController(ExpenseService expenseService, UserService userService, CategoryService categoryService) {
        this.expenseService = expenseService;
        this.userService = userService;
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody ExpenseRequest request){
        Optional<User> user = userService.getUserById(request.getUserId());
        Optional<Category> category = categoryService.getCategoryById(request.getCategoryId());

        if (user.isEmpty() || category.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Expense expense = new Expense();
        expense.setUser(user.get());
        expense.setCategory(category.get());
        expense.setExpenseAmount(request.getExpenseAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setNote(request.getNote());

        return ResponseEntity.ok(expenseService.createExpense(expense));
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Integer id) {
        Optional<Expense> Expense = expenseService.getExpenseById(id);
        if (Expense.isPresent())
        {
            return ResponseEntity.ok(Expense.get());
        }
        else
        {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Integer id,
            @RequestBody ExpenseRequest request) {
        Optional<User> user = userService.getUserById(request.getUserId());
        Optional<Category> category = categoryService.getCategoryById(request.getCategoryId());

        if (user.isEmpty() || category.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Expense expenseDetails = new Expense();
        expenseDetails.setUser(user.get());
        expenseDetails.setCategory(category.get());
        expenseDetails.setExpenseAmount(request.getExpenseAmount());
        expenseDetails.setExpenseDate(request.getExpenseDate());
        expenseDetails.setNote(request.getNote());
        return ResponseEntity.ok(expenseService.updateExpense(id, expenseDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Integer id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category/{categoryName}")
    public ResponseEntity<List<Expense>> getExpensesByCategory(@PathVariable String categoryName) {
        List<Expense> expenses = expenseService.findByCategoryName(categoryName);
        if(expenses.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(expenses);
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Expense>> getExpensesByUserId(@PathVariable Integer userId) {
        // We will create this new method in the service
        List<Expense> expenses = expenseService.findExpensesByUserId(userId);
        if(expenses.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(expenses);
    }

    public List<Expense> findByCategoryNameRaw(String categoryName) {
        // This tells the repository to find by the 'category' object's 'categoryName' property
        return expenseService.findByCategoryName(categoryName);
    }
}
