package com.qoex.expense_app.service.rules;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.exceptions.BusinessException;
import com.qoex.expense_app.exceptions.ForbiddenException;
import com.qoex.expense_app.exceptions.NotFoundException;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserBusinessRules {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getUserIfExists(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(id + " numaralı kullanıcı bulunamadı."));
    }

    public void emailMustBeUnique(String email, Long currentUserId) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (currentUserId == null || !user.getId().equals(currentUserId)) {
                log.warn("E-posta zaten kullanımda: {}", email);
                throw new BusinessException("Bu e-posta adresi zaten kullanımda.");
            }
        });
    }

    public void userMustBeOwnerOrGm(Long targetId, Long currentUserId, String role) {
        if (!targetId.equals(currentUserId) && !role.equals("ROLE_GM")) {
            throw new ForbiddenException("Bu işlem için yetkiniz bulunmamaktadır.");
        }
    }

    public void passwordMustMatch(String rawPassword, String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new BusinessException("E-posta veya şifre hatalı.");
        }
    }

    public void employeeMustHaveManager(User employee) {
        if (employee.getManager() == null) {
            throw new BusinessException("Talep oluşturabilmek için önce bir yönetici atanmalıdır.");
        }
    }

    public void userCannotBeOwnManager(Long userId, Long managerId) {
        if (userId.equals(managerId)) {
            throw new BusinessException("Kullanıcı kendi yöneticisi olarak atanamaz.");
        }
    }

    public void managerMustBeManagerRole(User manager) {
        if (manager.getRole() != UserRole.ROLE_GM &&
                manager.getRole() != UserRole.ROLE_TEAM_LEADER) {
            throw new BusinessException("Yönetici olarak sadece GM veya Team Lead atanabilir.");
        }
    }

}