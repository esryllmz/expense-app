package com.qoex.expense_app.dto.request.Expense;

import com.qoex.expense_app.core.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateExpenseStatusRequest(
        @NotNull(message = "Durum belirtilmelidir.") RequestStatus status) {
}