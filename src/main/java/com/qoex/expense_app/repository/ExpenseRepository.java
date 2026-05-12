package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.Expense;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // .NET'teki tüm async metodlar (Add, Get, Find) burada hazır geliyor.

    // KURAL: Çalışan sadece kendi taleplerini görür
    // Spring Data JPA, metodun isminden (ByEmployeeId) otomatik sorgu üretir
    List<Expense> findAllByEmployeeId(Long employeeId);

    // KURAL: Yönetici sadece kendine bağlı çalışanların taleplerini görür
    // Burada özel bir JPQL sorgusu yazıyoruz (Hiyerarşiyi kontrol etmek için)
    @Query("SELECT e FROM Expense e WHERE e.employee.manager.id = :managerId")
    List<Expense> findSubordinateExpenses(@Param("managerId") Long managerId);
}