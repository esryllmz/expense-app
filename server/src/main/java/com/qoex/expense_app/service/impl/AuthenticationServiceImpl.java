package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.config.JwtProperties;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.core.security.JwtService;
import com.qoex.expense_app.dto.request.User.LoginRequestDto;
import com.qoex.expense_app.dto.request.User.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;
import com.qoex.expense_app.dto.response.UserResponseDto;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IAuthenticationService;
import com.qoex.expense_app.service.rules.UserBusinessRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements IAuthenticationService {

    private final UserRepository userRepository;
    private final UserBusinessRules businessRules;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public ApiResponse<TokenResponseDto> login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Giriş başarısız. E-posta bulunamadı: {}", request.email());
                    return new BusinessException("E-posta veya şifre hatalı.");
                });

        businessRules.passwordMustMatch(request.password(), user.getPassword());

        String accessToken = jwtService.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name());

        String refreshToken = createAndSaveRefreshToken(user);

        TokenResponseDto tokenResponse = new TokenResponseDto(
                accessToken,
                refreshToken,
                UserResponseDto.fromEntity(user));

        log.info("Kullanıcı giriş yaptı: {}", user.getEmail());

        return ApiResponse.success(tokenResponse, "Giriş başarılı.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> register(RegisterRequestDto request) {
        businessRules.emailMustBeUnique(request.email(), null);

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));

        // Case için self-register olan kullanıcı varsayılan çalışan olur.
        // Organizasyon hiyerarşisi seed data veya GM yönetim akışı ile kurulmalıdır.
        user.setRole(UserRole.ROLE_EMPLOYEE);
        user.setManager(null);

        userRepository.save(user);

        log.info("Yeni kullanıcı kaydedildi: {}", request.email());

        return ApiResponse.success(null, "Kayıt başarıyla tamamlandı.", 201);
    }

    @Override
    @Transactional
    public ApiResponse<TokenResponseDto> refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException("Geçersiz refresh token."));

        if (user.getRefreshTokenExpiration() == null ||
                user.getRefreshTokenExpiration().isBefore(LocalDateTime.now())) {

            clearRefreshToken(user);

            throw new BusinessException("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        }

        String newAccessToken = jwtService.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name());

        String newRefreshToken = createAndSaveRefreshToken(user);

        TokenResponseDto tokenResponse = new TokenResponseDto(
                newAccessToken,
                newRefreshToken,
                UserResponseDto.fromEntity(user));

        return ApiResponse.success(tokenResponse, "Token başarıyla yenilendi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> logout(Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        clearRefreshToken(user);

        log.info("Kullanıcı çıkış yaptı: {}", user.getEmail());

        return ApiResponse.success(null, "Çıkış yapıldı.", 200);
    }

    private String createAndSaveRefreshToken(User user) {
        String refreshToken = UUID.randomUUID().toString();

        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiration(
                LocalDateTime.now().plusDays(jwtProperties.getRefreshTokenExpiration()));

        userRepository.save(user);

        return refreshToken;
    }

    private void clearRefreshToken(User user) {
        user.setRefreshToken(null);
        user.setRefreshTokenExpiration(null);
        userRepository.save(user);
    }
}