package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {

    List<Leave> findAllByEmployeeId(Long employeeId);

    // Sınıf adını Leave yaptığın için sorguda da Leave kullanmalısın
    @Query("SELECT l FROM Leave l WHERE l.employee.manager.id = :managerId")
    List<Leave> findSubordinateLeaves(@Param("managerId") Long managerId);
}