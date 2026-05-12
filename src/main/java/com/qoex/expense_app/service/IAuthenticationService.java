package com.qoex.expense_app.service;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.LoginRequestDto;
import com.qoex.expense_app.dto.request.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;

public interface IAuthenticationService {
    ApiResponse<TokenResponseDto> login(LoginRequestDto request);

    ApiResponse<TokenResponseDto> refreshToken(String refreshToken);

    ApiResponse<Void> logout();

    ApiResponse<Void> register(RegisterRequestDto request);
}