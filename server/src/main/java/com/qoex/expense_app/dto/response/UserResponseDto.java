package com.qoex.expense_app.dto.response;

import com.qoex.expense_app.model.User;

public record UserResponseDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String role,
        Long managerId,
        String managerName
) {
    public static UserResponseDto fromEntity(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getManager() != null ? user.getManager().getId() : null,
                user.getManager() != null
                        ? user.getManager().getFirstName() + " " + user.getManager().getLastName()
                        : null
        );
    }
}