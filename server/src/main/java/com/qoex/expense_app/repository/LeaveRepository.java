package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {

    List<Leave> findAllByEmployeeId(Long employeeId);

    @Query("SELECT l FROM Leave l WHERE l.employee.manager.id = :managerId")
    List<Leave> findSubordinateLeaves(@Param("managerId") Long managerId);

    // GM için: kendi talepleri hariç sistemdeki tüm izin taleplerini görür.
    @Query("SELECT l FROM Leave l WHERE l.employee.id <> :userId")
    List<Leave> findAllCompanyLeavesExceptCurrentUser(@Param("userId") Long userId);
}