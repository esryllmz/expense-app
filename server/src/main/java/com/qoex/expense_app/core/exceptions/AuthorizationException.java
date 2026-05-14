package com.qoex.expense_app.core.exceptions;

import org.springframework.http.HttpStatus;

public class AuthorizationException extends BaseException {
    public AuthorizationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED); // 401
    }
}