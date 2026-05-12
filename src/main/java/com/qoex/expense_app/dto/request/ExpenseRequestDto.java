package com.qoex.expense_app.dto.request;

import java.math.BigDecimal;

public record ExpenseRequestDto(
        String description,
        BigDecimal amount,
        Long employeeId) {
}