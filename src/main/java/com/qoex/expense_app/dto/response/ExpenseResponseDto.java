package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseResponseDto(
        Long id,
        String description,
        BigDecimal amount,
        RequestStatus status,
        String employeeName,
        LocalDateTime createdDate) {
    public static ExpenseResponseDto fromEntity(Expense expense) {
        return new ExpenseResponseDto(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getStatus(),
                expense.getEmployee().getFirstName() + " " + expense.getEmployee().getLastName(),
                expense.getCreatedDate());
    }
}