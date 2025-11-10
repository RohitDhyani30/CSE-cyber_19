package com.example.demo.dto;

import com.example.demo.entity.Expense; // You may need to create an ExpenseResponse DTO for this
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder // We use @Builder for easy construction in the service
public class ReportResponse {
    private BigDecimal totalBudget;
    private BigDecimal remainingBudget;
    private BigDecimal totalSpending;
    private Integer totalTransactions;
    private List<CategorySpending> spendingByCategory;
    private List<SpendingOverTime> spendingByDay;
    private List<ExpenseResponse> topExpenses;
}