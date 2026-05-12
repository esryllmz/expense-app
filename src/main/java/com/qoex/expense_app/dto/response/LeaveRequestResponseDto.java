package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.model.LeaveRequest;
import java.time.LocalDate;

public record LeaveRequestResponseDto(
        Long id,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        String employeeFullName,
        Long employeeId) {
    public static LeaveRequestResponseDto fromEntity(LeaveRequest leave) {
        return new LeaveRequestResponseDto(
                leave.getId(),
                leave.getDescription(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getStatus().name(),
                leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName(),
                leave.getEmployee().getId());
    }
}
