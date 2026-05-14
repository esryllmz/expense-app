package com.qoex.expense_app.exceptions;

import com.qoex.expense_app.core.exceptions.BaseException;
import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {

    public BusinessException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}