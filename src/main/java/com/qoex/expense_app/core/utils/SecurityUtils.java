package com.qoex.expense_app.core.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /**
     * O anki giriş yapmış kullanıcının ID'sini döndürür.
     * JwtFilter içinde authentication.setPrincipal(userId) yapıldığı varsayılır.
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            // Principal içinde sakladığımız UserId'yi alıyoruz
            Object principal = authentication.getPrincipal();

            if (principal instanceof Long) {
                return (Long) principal;
            }
        }

        // Eğer sistem henüz tam bağlanmadıysa test için 1L dönebiliriz
        // Ama değişkeni kullandığımız için hata/uyarı almayız
        return 1L;
    }

    /**
     * Kullanıcının rolünü (Örn: ROLE_EMPLOYEE) döndürür.
     */
    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && !authentication.getAuthorities().isEmpty()) {
            return authentication.getAuthorities().iterator().next().getAuthority();
        }

        return "ROLE_GUEST";
    }
}