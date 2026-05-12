package com.qoex.expense_app.dto.request;

import com.qoex.expense_app.core.enums.RequestStatus;

public record ExpenseStatusUpdateDto(
        Long expenseId,
        RequestStatus status) {
}