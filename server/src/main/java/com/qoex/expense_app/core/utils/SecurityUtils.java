package com.qoex.expense_app.core.utils;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();

            if (principal instanceof Long userId) {
                return userId;
            }
        }

        throw new AccessDeniedException("Kimlik doğrulama bilgisi bulunamadı.");
    }

    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getAuthorities().isEmpty()) {
            return authentication.getAuthorities().iterator().next().getAuthority();
        }

        throw new AccessDeniedException("Kullanıcı rol bilgisi bulunamadı.");
    }
}