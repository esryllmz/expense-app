package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.service.rules.UserBusinessRules; // Paketin doğru olduğundan emin ol
import com.qoex.expense_app.dto.request.User.UpdateUserRequest;
import com.qoex.expense_app.dto.request.User.ChangePasswordRequest;
import com.qoex.expense_app.dto.response.UserResponseDto;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements IUserService {
    private final UserRepository userRepository;
    private final UserBusinessRules businessRules;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ApiResponse<List<UserResponseDto>> getAll() {
        List<UserResponseDto> users = userRepository.findAll().stream()
                .map(UserResponseDto::fromEntity)
                .toList();
        return ApiResponse.success(users, "Kullanıcı listesi getirildi.", 200);
    }

    @Override
    public ApiResponse<UserResponseDto> getById(Long id) {
        User user = businessRules.getUserIfExists(id);
        return ApiResponse.success(UserResponseDto.fromEntity(user), "Kullanıcı detayları getirildi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> update(UpdateUserRequest request, Long currentUserId) {
        User user = businessRules.getUserIfExists(currentUserId);

        // Email değişikliği varsa benzersizlik kontrolü yap
        if (!user.getEmail().equals(request.email())) {
            businessRules.emailMustBeUnique(request.email(), currentUserId);
        }

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());

        userRepository.save(user);
        return ApiResponse.success(null, "Kullanıcı bilgileri güncellendi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> changePassword(ChangePasswordRequest request, Long userId) {
        User user = businessRules.getUserIfExists(userId);

        // Mevcut şifre kontrolü
        businessRules.passwordMustMatch(request.currentPassword(), user.getPassword());

        // Yeni şifre onay kontrolü
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new BusinessException("Yeni şifreler birbiriyle eşleşmiyor.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return ApiResponse.success(null, "Şifre başarıyla değiştirildi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> delete(Long id, Long currentUserId, String role) {
        businessRules.userMustBeOwnerOrAdmin(id, currentUserId, role);
        User user = businessRules.getUserIfExists(id);

        userRepository.delete(user);
        return ApiResponse.success(null, "Kullanıcı hesabı silindi.", 200);
    }
}