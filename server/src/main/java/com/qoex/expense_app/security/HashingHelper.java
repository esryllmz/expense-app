package com.qoex.expense_app.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashingHelper {
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public static String createPasswordHash(String password) {
        return encoder.encode(password);
    }

    public static boolean verifyPasswordHash(String password, String hashedPassword) {
        return encoder.matches(password, hashedPassword);
    }
}