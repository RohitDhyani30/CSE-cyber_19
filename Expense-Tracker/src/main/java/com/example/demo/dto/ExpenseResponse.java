package com.example.demo.dto;

import com.example.demo.entity.Expense; // Import your entity
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    // Fields we want to show
    private Integer expenseId;
    private BigDecimal expenseAmount;
    private LocalDate expenseDate;
    private String note;
    private String categoryName;

    /**
     * A helper constructor to easily convert an Expense Entity into an ExpenseResponse DTO.
     */
    public ExpenseResponse(Expense expense) {
        this.expenseId = expense.getExpenseId();
        this.expenseAmount = expense.getExpenseAmount();
        this.expenseDate = expense.getExpenseDate();
        this.note = expense.getNote();
        this.categoryName = expense.getCategory().getCategoryName();
    }
}