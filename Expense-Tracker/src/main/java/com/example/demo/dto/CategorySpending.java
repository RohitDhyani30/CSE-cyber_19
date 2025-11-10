package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class CategorySpending {
    private String categoryName;
    private BigDecimal totalSpent; // This field matches 'getTotalSpent'
    private double percentageOfTotalSpending;
    private BigDecimal budgetedAmount;
    private double percentageOfBudgetUsed; // What % of total spending this is
}