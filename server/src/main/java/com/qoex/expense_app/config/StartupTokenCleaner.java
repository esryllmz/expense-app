package com.qoex.expense_app.config;

import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class StartupTokenCleaner implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        List<User> users = userRepository.findAll();

        users.forEach(user -> {
            user.setRefreshToken(null);
            user.setRefreshTokenExpiration(null);
        });

        userRepository.saveAll(users);

        log.info("Startup security cleanup completed. All refresh tokens cleared.");
    }
}