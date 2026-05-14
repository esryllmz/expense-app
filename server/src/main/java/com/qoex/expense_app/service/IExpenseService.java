package com.qoex.expense_app.service;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.Expense.CreateExpenseRequest;
import com.qoex.expense_app.dto.request.Expense.UpdateExpenseStatusRequest;
import com.qoex.expense_app.dto.response.ExpenseResponseDto;
import java.util.List;

public interface IExpenseService {
    ApiResponse<ExpenseResponseDto> create(CreateExpenseRequest request, Long employeeId);

    ApiResponse<List<ExpenseResponseDto>> getMyExpenses(Long employeeId);

    ApiResponse<List<ExpenseResponseDto>> getSubordinateExpenses(Long managerId);

    ApiResponse<Void> updateStatus(Long expenseId, UpdateExpenseStatusRequest request, Long managerId);

}