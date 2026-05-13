package com.qoex.expense_app.dto.request.Leave;

import com.qoex.expense_app.core.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateLeaveStatusRequest(
                @NotNull(message = "Durum belirtilmelidir.") RequestStatus status) {
}