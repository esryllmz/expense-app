package com.qoex.expense_app.service;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.User.LoginRequestDto;
import com.qoex.expense_app.dto.request.User.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;
import com.qoex.expense_app.dto.response.UserResponseDto;

public interface IAuthenticationService {
    ApiResponse<TokenResponseDto> login(LoginRequestDto request);

    ApiResponse<TokenResponseDto> refreshToken(String refreshToken);

    ApiResponse<Void> logout(Long currentUserId);

    ApiResponse<Void> register(RegisterRequestDto request);

    ApiResponse<UserResponseDto> me(Long currentUserId);
}