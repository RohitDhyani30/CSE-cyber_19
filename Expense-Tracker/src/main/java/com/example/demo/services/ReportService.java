package com.example.demo.services;

import com.example.demo.dto.CategorySpending;
import com.example.demo.dto.ExpenseResponse;
import com.example.demo.dto.ReportResponse;
import com.example.demo.dto.SpendingOverTime;
import com.example.demo.entity.Budget;
import com.example.demo.entity.Expense;
import com.example.demo.repository.BudgetRepository;
import com.example.demo.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Automatically injects the repositories
public class ReportService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository; // Injected
    private static final int TOP_EXPENSES_LIMIT = 5;

    public ReportResponse generateReport(Integer userId, LocalDate startDate, LocalDate endDate, List<Integer> categoryIds) {

        // 1. Fetch Expenses
        List<Expense> expenses;
        if (categoryIds == null || categoryIds.isEmpty()) {
            expenses = expenseRepository.findAllByUser_UserIdAndExpenseDateBetween(userId, startDate, endDate);
        } else {
            expenses = expenseRepository.findAllByUser_UserIdAndExpenseDateBetweenAndCategory_CategoryIdIn(
                    userId, startDate, endDate, categoryIds);
        }

        // 2. Fetch matching Budgets
        List<Budget> budgets;
        if (categoryIds == null || categoryIds.isEmpty()) {
            budgets = budgetRepository.findOverlappingBudgets(userId, startDate, endDate);
        } else {
            budgets = budgetRepository.findOverlappingBudgetsWithCategories(
                    userId, startDate, endDate, categoryIds);
        }

        // 3. Calculate Total Spending
        BigDecimal totalSpending = expenses.stream()
                .map(Expense::getExpenseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Calculate Total Budget
        BigDecimal totalBudget = budgets.stream()
                .map(Budget::getBudgetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Calculate Remaining Budget
        BigDecimal remainingBudget = totalBudget.subtract(totalSpending);

        // 6. Calculate Spending by Category (This now passes budgets)
        List<CategorySpending> spendingByCategory = calculateSpendingByCategory(expenses, totalSpending, budgets);

        // 7. Calculate Spending by Day
        List<SpendingOverTime> spendingByDay = calculateSpendingByDay(expenses);

        // 8. Get Top 5 Expenses (and convert to DTOs)
        List<ExpenseResponse> topExpensesDTOs = expenses.stream()
                .sorted(Comparator.comparing(Expense::getExpenseAmount).reversed())
                .limit(TOP_EXPENSES_LIMIT)
                .map(ExpenseResponse::new) // Uses the DTO constructor
                .collect(Collectors.toList());

        return ReportResponse.builder()
                .totalBudget(totalBudget)
                .remainingBudget(remainingBudget)
                .totalSpending(totalSpending)
                .totalTransactions(expenses.size())
                .spendingByCategory(spendingByCategory)
                .spendingByDay(spendingByDay)
                .topExpenses(topExpensesDTOs)
                .build();
    }

    private List<CategorySpending> calculateSpendingByCategory(List<Expense> expenses, BigDecimal totalSpending, List<Budget> budgets) {

        // 1. Group expenses by category name, summing their amounts
        Map<String, BigDecimal> categorySpendingMap = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory().getCategoryName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getExpenseAmount, BigDecimal::add)
                ));

        // 2. Group budgets by category name, summing their amounts
        Map<String, BigDecimal> categoryBudgetMap = budgets.stream()
                .collect(Collectors.groupingBy(
                        budget -> budget.getCategory().getCategoryName(),
                        Collectors.reducing(BigDecimal.ZERO, Budget::getBudgetAmount, BigDecimal::add)
                ));

        // 3. Combine all unique category names from both lists
        Set<String> allCategoryNames = new HashSet<>();
        allCategoryNames.addAll(categorySpendingMap.keySet());
        allCategoryNames.addAll(categoryBudgetMap.keySet());

        // 4. Convert to List<CategorySpending> and calculate all percentages
        return allCategoryNames.stream()
                .map(categoryName -> {
                    BigDecimal totalSpent = categorySpendingMap.getOrDefault(categoryName, BigDecimal.ZERO);
                    BigDecimal totalBudgeted = categoryBudgetMap.getOrDefault(categoryName, BigDecimal.ZERO);

                    // % of total spending (the old metric)
                    double percentageOfTotalSpending = 0;
                    if (totalSpending.compareTo(BigDecimal.ZERO) > 0) {
                        percentageOfTotalSpending = totalSpent.divide(totalSpending, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .doubleValue();
                    }

                    // % of budget used (the new metric you want)
                    double percentageOfBudgetUsed = 0;
                    if (totalBudgeted.compareTo(BigDecimal.ZERO) > 0) {
                        percentageOfBudgetUsed = totalSpent.divide(totalBudgeted, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .doubleValue();
                    } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
                        percentageOfBudgetUsed = 100.0; // Spent money on an unbudgeted category
                    }

                    // This constructor matches your 'CategorySpending' DTO
                    return new CategorySpending(
                            categoryName,
                            totalSpent,
                            percentageOfTotalSpending,
                            totalBudgeted,
                            percentageOfBudgetUsed
                    );
                })
                .sorted(Comparator.comparing(CategorySpending::getTotalSpent).reversed())
                .collect(Collectors.toList());
    }

    private List<SpendingOverTime> calculateSpendingByDay(List<Expense> expenses) {
        // Group expenses by date, summing their amounts
        Map<LocalDate, BigDecimal> dayMap = expenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getExpenseDate,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getExpenseAmount, BigDecimal::add)
                ));

        // Convert map to List<SpendingOverTime> and sort by date
        return dayMap.entrySet().stream()
                .map(entry -> new SpendingOverTime(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(SpendingOverTime::getDate))
                .collect(Collectors.toList());
    }
}

