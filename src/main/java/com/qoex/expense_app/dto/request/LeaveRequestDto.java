package com.qoex.expense_app.dto.request;

import java.time.LocalDate;

public record LeaveRequestDto(
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        Long employeeId) {
}