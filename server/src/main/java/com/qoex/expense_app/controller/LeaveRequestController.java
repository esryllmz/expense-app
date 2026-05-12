package com.qoex.expense_app.controller;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.core.utils.SecurityUtils;
import com.qoex.expense_app.dto.request.LeaveRequest.CreateLeaveRequest;
import com.qoex.expense_app.dto.request.LeaveRequest.UpdateLeaveStatusRequest;
import com.qoex.expense_app.dto.response.LeaveRequestResponseDto;
import com.qoex.expense_app.service.ILeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final ILeaveRequestService leaveRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody CreateLeaveRequest request) {
        // Token'dan ID çekme
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(201).body(leaveRequestService.create(request, currentUserId));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponseDto>>> getMyLeaves() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(leaveRequestService.getMyLeaves(currentUserId));
    }

    @GetMapping("/subordinates")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponseDto>>> getSubordinateLeaves() {
        Long currentManagerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(leaveRequestService.getSubordinateLeaves(currentManagerId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLeaveStatusRequest request) {

        Long currentManagerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(leaveRequestService.updateStatus(id, request, currentManagerId));
    }
}