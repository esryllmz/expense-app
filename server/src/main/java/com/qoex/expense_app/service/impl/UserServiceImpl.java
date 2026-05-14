package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.User.ChangePasswordRequest;
import com.qoex.expense_app.dto.request.User.UpdateUserRequest;
import com.qoex.expense_app.dto.response.UserResponseDto;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IUserService;
import com.qoex.expense_app.service.rules.UserBusinessRules;
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
    @Transactional(readOnly = true)
    public ApiResponse<List<UserResponseDto>> getAll() {
        List<UserResponseDto> users = userRepository.findAll()
                .stream()
                .map(UserResponseDto::fromEntity)
                .toList();

        return ApiResponse.success(users, "Kullanıcı listesi getirildi.", 200);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<UserResponseDto> getById(Long id) {
        User user = businessRules.getUserIfExists(id);

        return ApiResponse.success(
                UserResponseDto.fromEntity(user),
                "Kullanıcı detayları getirildi.",
                200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> update(UpdateUserRequest request, Long currentUserId) {
        User user = businessRules.getUserIfExists(currentUserId);

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());

        userRepository.save(user);

        return ApiResponse.success(null, "Kullanıcı bilgileri güncellendi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> changePassword(ChangePasswordRequest request, Long userId) {
        User user = businessRules.getUserIfExists(userId);

        businessRules.passwordMustMatch(request.currentPassword(), user.getPassword());

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
        businessRules.userMustBeOwnerOrGm(id, currentUserId, role);

        User user = businessRules.getUserIfExists(id);

        userRepository.delete(user);

        return ApiResponse.success(null, "Kullanıcı hesabı silindi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> assignManager(Long userId, Long managerId) {
        User user = businessRules.getUserIfExists(userId);
        User manager = businessRules.getUserIfExists(managerId);

        businessRules.userCannotBeOwnManager(userId, managerId);
        businessRules.managerMustBeManagerRole(manager);

        user.setManager(manager);

        userRepository.save(user);

        log.info(
                "Kullanıcı yöneticisi güncellendi. UserId: {}, ManagerId: {}",
                userId,
                managerId);

        return ApiResponse.success(null, "Kullanıcı yöneticisi başarıyla güncellendi.", 200);
    }
}