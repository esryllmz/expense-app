package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.model.LeaveRequest;
import java.time.LocalDate;

public record LeaveResponseDto(
        Long id,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        RequestStatus status,
        String employeeName) {
    public static LeaveResponseDto fromEntity(LeaveRequest leaveRequest) {
        return new LeaveResponseDto(
                leaveRequest.getId(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate(),
                leaveRequest.getReason(),
                leaveRequest.getStatus(),
                leaveRequest.getEmployee().getFirstName() + " " + leaveRequest.getEmployee().getLastName());
    }
}