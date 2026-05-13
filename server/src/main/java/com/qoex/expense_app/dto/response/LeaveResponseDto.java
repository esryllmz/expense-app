package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.model.Leave;
import java.time.LocalDate;

public record LeaveResponseDto(
        Long id,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        String employeeFullName,
        Long employeeId) {
    public static LeaveResponseDto fromEntity(Leave leave) {
        return new LeaveResponseDto(
                leave.getId(),
                leave.getDescription(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getStatus().name(),
                leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName(),
                leave.getEmployee().getId());
    }
}
