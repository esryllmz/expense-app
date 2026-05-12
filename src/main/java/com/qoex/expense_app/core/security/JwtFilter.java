package com.qoex.expense_app.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        String userEmail = jwtService.extractEmail(jwt);

        // SecurityContext boşsa ve email varsa işleme başla
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            if (jwtService.isTokenValid(jwt)) {
                // 1. Token içinden UserId ve Role bilgilerini çekiyoruz
                Long userId = jwtService.extractClaim(jwt, claims -> claims.get("userId", Long.class));
                String role = jwtService.extractClaim(jwt, claims -> claims.get("role", String.class));

                // 2. Rol bilgisini Spring Security'nin anlayacağı 'SimpleGrantedAuthority'
                // formatına çeviriyoruz
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

                // 3. Token'ı oluştururken Principal olarak e-posta yerine UserId veriyoruz
                // (SecurityUtils için)
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        authorities);

                // 4. Request detaylarını ekleyelim (IP, Session bilgisi vb.)
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 5. Ve artık sistem bu kullanıcıyı tanıyor!
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}