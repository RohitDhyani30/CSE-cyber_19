package com.example.demo.controller;

import com.example.demo.dto.BudgetRequest;
import com.example.demo.entity.Budget;
import com.example.demo.entity.Category;
import com.example.demo.entity.User;
import com.example.demo.services.BudgetService;
import com.example.demo.services.CategoryService;
import com.example.demo.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/budget")
public class budgetController {

    private final BudgetService budgetService;
    private final UserService userService;
    private final CategoryService categoryService;
    public budgetController(BudgetService budgetService, UserService userService, CategoryService categoryService) {
        this.budgetService = budgetService;
        this.userService = userService;
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<Budget> createBudget(@RequestBody BudgetRequest request){
        Optional<User> user = userService.getUserById(request.getUserId());
        Optional<Category> category = categoryService.getCategoryById(request.getCategoryId());

        if (user.isEmpty() || category.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Budget budget = new Budget();
        budget.setUser(user.get());
        budget.setCategory(category.get());
        budget.setBudgetAmount(request.getBudgetAmount());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());

        return ResponseEntity.ok(budgetService.createBudget(budget));
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getAllBudgets(){
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Budget> getBudgetById(@PathVariable Integer id){
        Optional<Budget> budget = budgetService.getBudgetById(id);
        if(budget.isPresent())
        {
            return ResponseEntity.ok(budget.get());
        }
        else
        {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Integer id,
            @RequestBody BudgetRequest request){
        Optional<User> user = userService.getUserById(request.getUserId());
        Optional<Category> category = categoryService.getCategoryById(request.getCategoryId());

        if (user.isEmpty() || category.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Budget budgetDetails = new Budget();
        budgetDetails.setUser(user.get());
        budgetDetails.setCategory(category.get());
        budgetDetails.setBudgetAmount(request.getBudgetAmount());
        budgetDetails.setStartDate(request.getStartDate());
        budgetDetails.setEndDate(request.getEndDate());

        return ResponseEntity.ok(budgetService.updateBudget(id,budgetDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable Integer id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Budget>> getBudgetsByUserId(@PathVariable Integer userId) {
        // We will create this new method in the service
        List<Budget> budgets = budgetService.findBudgetsByUserId(userId);
        if(budgets.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(budgets);
    }
}
