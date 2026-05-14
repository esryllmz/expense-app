package com.qoex.expense_app.controller;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.core.utils.SecurityUtils;
import com.qoex.expense_app.dto.request.User.UpdateUserRequest;
import com.qoex.expense_app.dto.request.User.AssignManagerRequest;
import com.qoex.expense_app.dto.request.User.ChangePasswordRequest;
import com.qoex.expense_app.dto.response.UserResponseDto;
import com.qoex.expense_app.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UsersController {

    private final IUserService userService;

    @GetMapping
    @PreAuthorize("hasRole('GM')")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> update(@Valid @RequestBody UpdateUserRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.update(request, currentUserId));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.changePassword(request, currentUserId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String role = SecurityUtils.getCurrentUserRole();
        return ResponseEntity.ok(userService.delete(id, currentUserId, role));
    }

    @PatchMapping("/{id}/manager")
    @PreAuthorize("hasRole('GM')")
    public ResponseEntity<ApiResponse<Void>> assignManager(
            @PathVariable Long id,
            @Valid @RequestBody AssignManagerRequest request) {
        return ResponseEntity.ok(userService.assignManager(id, request.managerId()));
    }
}