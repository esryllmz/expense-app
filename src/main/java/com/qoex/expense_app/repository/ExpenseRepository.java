package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // .NET'teki tüm async metodlar (Add, Get, Find) burada hazır geliyor.
}