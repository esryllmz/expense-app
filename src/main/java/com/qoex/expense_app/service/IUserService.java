package com.qoex.expense_app.service;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.UpdateUserRequest;
import com.qoex.expense_app.dto.request.ChangePasswordRequest;
import com.qoex.expense_app.dto.response.UserResponseDto;
import java.util.List;

public interface IUserService {
    ApiResponse<List<UserResponseDto>> getAll();

    ApiResponse<UserResponseDto> getById(Long id);

    ApiResponse<Void> update(UpdateUserRequest request, Long currentUserId);

    ApiResponse<Void> changePassword(ChangePasswordRequest request, Long userId);

    ApiResponse<Void> delete(Long id, Long currentUserId, String role);
}