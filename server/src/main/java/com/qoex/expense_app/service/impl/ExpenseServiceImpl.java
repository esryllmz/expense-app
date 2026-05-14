package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.dto.request.Expense.CreateExpenseRequest;
import com.qoex.expense_app.dto.request.Expense.UpdateExpenseStatusRequest;
import com.qoex.expense_app.dto.response.ExpenseResponseDto;
import com.qoex.expense_app.events.ExpenseCreatedEvent;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.repository.ExpenseRepository;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IExpenseService;
import com.qoex.expense_app.exceptions.NotFoundException;
import com.qoex.expense_app.core.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.qoex.expense_app.service.rules.ExpenseBusinessRules;
import com.qoex.expense_app.service.rules.RequestApprovalRules;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements IExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseBusinessRules businessRules;
    private final RequestApprovalRules approvalRules;
    private final ApplicationEventPublisher eventPublisher; // Event fırlatmak için
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ApiResponse<ExpenseResponseDto> create(CreateExpenseRequest request, Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        approvalRules.employeeMustHaveManager(employee);

        Expense expense = new Expense();
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setStatus(RequestStatus.PENDING);
        expense.setEmployee(employee);

        Expense savedExpense = expenseRepository.save(expense);

        User manager = employee.getManager();

        eventPublisher.publishEvent(new ExpenseCreatedEvent(
                savedExpense.getId(),
                employee.getId(),
                employee.getFirstName() + " " + employee.getLastName(),
                manager != null ? manager.getId() : null,
                manager != null ? manager.getFirstName() + " " + manager.getLastName() : null,
                savedExpense.getAmount()));

        return ApiResponse.success(
                ExpenseResponseDto.fromEntity(savedExpense),
                "Masraf talebi oluşturuldu.",
                201);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ExpenseResponseDto>> getMyExpenses(Long employeeId) {
        List<ExpenseResponseDto> expenses = expenseRepository.findAllByEmployeeId(employeeId)
                .stream()
                .map(ExpenseResponseDto::fromEntity)
                .toList();

        return ApiResponse.success(expenses, "Masraflarınız listelendi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> updateStatus(Long expenseId, UpdateExpenseStatusRequest request, Long managerId) {
        Expense expense = businessRules.getExpenseIfExist(expenseId);

        businessRules.statusMustBeFinalDecision(request.status());
        businessRules.expenseMustBePending(expense);
        businessRules.validateManagerOwnership(expense, managerId);

        expense.setStatus(request.status());
        expenseRepository.save(expense);

        return ApiResponse.success(null, "Masraf durumu güncellendi: " + request.status(), 200);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ExpenseResponseDto>> getSubordinateExpenses(Long managerId) {
        User currentUser = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        List<Expense> expenses;

        if (currentUser.getRole() == UserRole.ROLE_GM) {
            // GM tüm şirket taleplerini görür.
            expenses = expenseRepository.findAllCompanyExpensesExceptCurrentUser(managerId);
        } else {
            // Team Lead sadece direkt bağlı çalışanlarının taleplerini görür.
            expenses = expenseRepository.findSubordinateExpenses(managerId);
        }

        List<ExpenseResponseDto> response = expenses
                .stream()
                .map(ExpenseResponseDto::fromEntity)
                .toList();

        return ApiResponse.success(response, "Bağlı personel masrafları getirildi.", 200);
    }
}