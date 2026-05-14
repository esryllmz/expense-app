package com.qoex.expense_app.exceptions;

import com.qoex.expense_app.core.exceptions.BaseException;
import org.springframework.http.HttpStatus;

public class ForbiddenException extends BaseException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}