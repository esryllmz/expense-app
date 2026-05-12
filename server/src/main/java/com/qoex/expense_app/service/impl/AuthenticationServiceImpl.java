package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.config.JwtProperties;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.service.rules.UserBusinessRules; // Eklendi
import com.qoex.expense_app.core.security.JwtService;
import com.qoex.expense_app.dto.request.User.LoginRequestDto; // İsimler düzeltildi
import com.qoex.expense_app.dto.request.User.RegisterRequestDto;
import com.qoex.expense_app.dto.response.TokenResponseDto;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IAuthenticationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j // Loglama için eklendi
public class AuthenticationServiceImpl implements IAuthenticationService {

    private final UserRepository userRepository;
    private final UserBusinessRules businessRules; // Enjekte edildi
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public ApiResponse<TokenResponseDto> login(LoginRequestDto request) {
        // 1. Kullanıcıyı bul (Repository)
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Giriş başarısız: E-posta bulunamadı -> {}", request.email());
                    return new BusinessException("E-posta veya şifre hatalı.");
                });

        // 2. İş Kuralı: Şifre doğruluğunu kontrol et (Rules'a devredildi)
        businessRules.passwordMustMatch(request.password(), user.getPassword());

        // 3. Tokenları üret
        String accessToken = jwtService.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = generateAndSetRefreshToken(user);

        log.info("Kullanıcı başarıyla giriş yaptı: {}", user.getEmail());
        return ApiResponse.success(new TokenResponseDto(accessToken, refreshToken), "Giriş başarılı.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> register(RegisterRequestDto request) {
        // 1. İş Kuralı: Email benzersiz mi? (Validation + Business Rule)
        businessRules.emailMustBeUnique(request.email(), null);

        // 2. Mapping & Password Encoding
        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.ROLE_EMPLOYEE); // Varsayılan rol

        // 3. Kaydet
        userRepository.save(user);

        log.info("Yeni kullanıcı kaydedildi: {}", request.email());
        return ApiResponse.success(null, "Kayıt başarıyla tamamlandı.", 201);
    }

    @Override
    @Transactional
    public ApiResponse<TokenResponseDto> refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException("Geçersiz oturum anahtarı."));

        // İş Kuralı: Refresh token süresi dolmuş mu?
        if (user.getRefreshTokenExpiration().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Oturum süresi dolmuş, lütfen tekrar giriş yapın.");
        }

        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        String newRefreshToken = generateAndSetRefreshToken(user);

        return ApiResponse.success(new TokenResponseDto(newAccessToken, newRefreshToken), "Token yenilendi.", 200);
    }

    @Override
    public ApiResponse<Void> logout() {
        // İsteğe bağlı: Burada refresh token'ı DB'den silebilirsin (Revoke)
        return ApiResponse.success(null, "Çıkış yapıldı.", 200);
    }

    // --- Helper Methods ---

    private String generateAndSetRefreshToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setRefreshToken(token);
        user.setRefreshTokenExpiration(LocalDateTime.now().plusDays(jwtProperties.getRefreshTokenExpiration()));
        userRepository.save(user);

        setRefreshTokenCookie(token);
        return token;
    }

    private void setRefreshTokenCookie(String token) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                .currentRequestAttributes();
        HttpServletResponse response = attributes.getResponse();

        if (response != null) {
            Cookie cookie = new Cookie("refreshToken", token);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(jwtProperties.getRefreshTokenExpiration() * 24 * 60 * 60);
            response.addCookie(cookie);
        }
    }

}