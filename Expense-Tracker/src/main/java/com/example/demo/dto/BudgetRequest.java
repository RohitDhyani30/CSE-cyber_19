package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class BudgetRequest {
    private Integer userId;
    private Integer categoryId;
    private BigDecimal budgetAmount;
    private LocalDate startDate;
    private LocalDate endDate;
}
