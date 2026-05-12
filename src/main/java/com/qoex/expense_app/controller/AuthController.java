package com.qoex.expense_app.controller;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.LoginRequestDto;
import com.qoex.expense_app.dto.request.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;
import com.qoex.expense_app.service.IAuthenticationService;
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
        // Not: IAuthenticationService içinde register metodunun olduğunu varsayıyoruz
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenResponseDto>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        // Eğer cookie yoksa veya boşsa direkt hata fırlatabilir veya servise
        // bırakabilirsin
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(authService.logout());
    }
}