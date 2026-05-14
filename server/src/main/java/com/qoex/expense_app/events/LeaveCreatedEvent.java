package com.qoex.expense_app.events;

import java.time.LocalDate;

public record LeaveCreatedEvent(
        Long leaveId,
        Long employeeId,
        String employeeName,
        Long managerId,
        String managerName,
        LocalDate startDate,
        LocalDate endDate) {
}