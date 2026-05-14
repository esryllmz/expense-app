package com.qoex.expense_app.controller;

import com.qoex.expense_app.core.utils.SecurityUtils;
import com.qoex.expense_app.dto.request.Expense.CreateExpenseRequest;
import com.qoex.expense_app.dto.request.Expense.UpdateExpenseStatusRequest;
import com.qoex.expense_app.dto.response.ExpenseResponseDto;
import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.service.IExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpensesController {

    private final IExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponseDto>> create(@Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.status(201).body(expenseService.create(request, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ExpenseResponseDto>>> getMyExpenses() {
        return ResponseEntity.ok(expenseService.getMyExpenses(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/subordinates")
    @PreAuthorize("hasAnyRole('GM', 'TEAM_LEADER')")
    public ResponseEntity<ApiResponse<List<ExpenseResponseDto>>> getSubordinates() {
        return ResponseEntity.ok(expenseService.getSubordinateExpenses(SecurityUtils.getCurrentUserId()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('GM', 'TEAM_LEADER')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateExpenseStatusRequest request) {
        return ResponseEntity.ok(expenseService.updateStatus(id, request, SecurityUtils.getCurrentUserId()));
    }
}