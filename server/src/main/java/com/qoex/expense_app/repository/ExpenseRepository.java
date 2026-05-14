package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.Expense;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByEmployeeId(Long employeeId);

    @Query("SELECT e FROM Expense e WHERE e.employee.manager.id = :managerId")
    List<Expense> findSubordinateExpenses(@Param("managerId") Long managerId);

    // GM için: kendi talepleri hariç sistemdeki tüm masraf taleplerini görür.
    @Query("SELECT e FROM Expense e WHERE e.employee.id <> :userId")
    List<Expense> findAllCompanyExpensesExceptCurrentUser(@Param("userId") Long userId);
}