package com.qoex.expense_app.core.exceptions;

import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {
    public BusinessException(String message) {
        super(message, HttpStatus.BAD_REQUEST); // 400
    }
}