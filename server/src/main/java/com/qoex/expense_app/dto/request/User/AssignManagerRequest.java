package com.qoex.expense_app.dto.request.User;

import jakarta.validation.constraints.NotNull;

public record AssignManagerRequest(
        @NotNull(message = "Manager ID gereklidir.") Long managerId) {
}