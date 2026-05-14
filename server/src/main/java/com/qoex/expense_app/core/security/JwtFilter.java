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

    /**
     * Auth endpointleri public olduğu için JWT filtresinden geçirme.
     * Böylece eski/bozuk token localStorage'da kalsa bile login/register 403'e
     * düşmez.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return path.startsWith("/api/v1/auth/login")
                || path.startsWith("/api/v1/auth/register")
                || path.startsWith("/api/v1/auth/refresh-token");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = authHeader.substring(7);
            String userEmail = jwtService.extractEmail(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    Long userId = jwtService.extractClaim(jwt, claims -> claims.get("userId", Long.class));
                    String role = jwtService.extractClaim(jwt, claims -> claims.get("role", String.class));

                    List<SimpleGrantedAuthority> authorities = Collections
                            .singletonList(new SimpleGrantedAuthority(role));

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userId,
                            null, authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Token bozuk/expire ise request'i authentication'sız devam ettiriyoruz.
            // Protected endpointlerde zaten Spring Security 401/403 dönecek.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}