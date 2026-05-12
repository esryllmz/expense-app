package com.qoex.expense_app.repository;

import com.qoex.expense_app.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findAllByEmployeeId(Long employeeId);

    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.manager.id = :managerId")
    List<LeaveRequest> findSubordinateLeaves(@Param("managerId") Long managerId);
}