package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseResponseDto(
        Long id,
        String description,
        BigDecimal amount,
        String status,
        String employeeFullName,
        Long employeeId,
        LocalDateTime createdDate) {
    public static ExpenseResponseDto fromEntity(Expense expense) {
        return new ExpenseResponseDto(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getStatus().name(),
                expense.getEmployee().getFirstName() + " " + expense.getEmployee().getLastName(),
                expense.getEmployee().getId(),
                expense.getCreatedDate());
    }
}