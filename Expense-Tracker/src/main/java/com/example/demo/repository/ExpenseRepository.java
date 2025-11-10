package com.example.demo.repository;

import com.example.demo.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense,Integer> {

    @Query(value = "SELECT expenses.* FROM expenses " +
            "JOIN category ON " +
            "expenses.category_id = category.category_id " +
            "WHERE category.category_name = :categoryName",nativeQuery = true)
    List<Expense> findByCategoryName(@Param("categoryName") String categoryName);
    // Spring Data JPA will automatically create the query for this method
    List<Expense> findByUser_UserId(Integer userId);

    List<Expense> findAllByUser_UserIdAndExpenseDateBetween(Integer userId, LocalDate startDate, LocalDate endDate);

    List<Expense> findAllByUser_UserIdAndExpenseDateBetweenAndCategory_CategoryIdIn(Integer userId, LocalDate startDate, LocalDate endDate, List<Integer> categoryIds);

}
