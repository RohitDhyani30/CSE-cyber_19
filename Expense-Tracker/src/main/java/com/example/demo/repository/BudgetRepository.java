package com.example.demo.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.example.demo.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget,Integer> {
    List<Budget> findByUser_UserId(Integer userId);

    @Query("SELECT b FROM Budget b WHERE b.user.userId = :userId " +
            "AND b.startDate <= :endDate " +
            "AND b.endDate >= :startDate")
    List<Budget> findOverlappingBudgets(
            @Param("userId") Integer userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM Budget b WHERE b.user.userId = :userId " +
            "AND b.startDate <= :endDate " +
            "AND b.endDate >= :startDate " +
            "AND b.category.categoryId IN :categoryIds")
    List<Budget> findOverlappingBudgetsWithCategories(
            @Param("userId") Integer userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryIds") List<Integer> categoryIds);
    @Query("SELECT SUM(b.budgetAmount) FROM Budget b WHERE b.user.userId = :userId")
    BigDecimal sumBudgetsByUserId(@Param("userId") Integer userId);
}
