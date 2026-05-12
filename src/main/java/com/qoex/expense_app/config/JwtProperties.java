package com.qoex.expense_app.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt") // application.properties'deki jwt.* alanlarını okur
@Getter
@Setter
public class JwtProperties {
    private String issuer;
    private String audience;
    private String securityKey;
    private int accessTokenExpiration; // Dakika
    private int refreshTokenExpiration; // Gün
}