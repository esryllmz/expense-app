package com.qoex.expense_app.config;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Getter
public class ApplicationSession {

    private final String runtimeTokenVersion = UUID.randomUUID().toString();
}