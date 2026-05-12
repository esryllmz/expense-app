package com.qoex.expense_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import com.qoex.expense_app.core.security.JwtProperties;

@SpringBootApplication
@EnableJpaAuditing
@EnableConfigurationProperties(JwtProperties.class)
public class ExpenseAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(ExpenseAppApplication.class, args);
	}

}
