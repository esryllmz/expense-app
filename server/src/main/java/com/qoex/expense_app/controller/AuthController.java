package com.qoex.expense_app.controller;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.User.LoginRequestDto;
import com.qoex.expense_app.dto.request.User.RefreshTokenRequestDto;
import com.qoex.expense_app.dto.request.User.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;
import com.qoex.expense_app.dto.response.UserResponseDto;
import com.qoex.expense_app.service.IAuthenticationService;
import com.qoex.expense_app.utils.SecurityUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthenticationService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(201).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenResponseDto>> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDto request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(authService.logout(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponseDto>> me() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(authService.me(currentUserId));
    }
}