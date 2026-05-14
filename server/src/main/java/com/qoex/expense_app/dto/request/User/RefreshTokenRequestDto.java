package com.qoex.expense_app.dto.request.User;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequestDto(
                @NotBlank(message = "Refresh token gereklidir.") String refreshToken) {
}