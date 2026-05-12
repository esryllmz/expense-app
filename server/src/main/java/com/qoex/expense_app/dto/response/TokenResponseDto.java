package com.qoex.expense_app.dto.response;

public record TokenResponseDto(
        String accessToken,
        String refreshToken) {
}