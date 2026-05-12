package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.core.events.ExpenseCreatedEvent;
import com.qoex.expense_app.dto.request.Expense.CreateExpenseRequest;
import com.qoex.expense_app.dto.request.Expense.UpdateExpenseStatusRequest;
import com.qoex.expense_app.dto.response.ExpenseResponseDto;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.repository.ExpenseRepository;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.IExpenseService;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.core.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.qoex.expense_app.service.rules.ExpenseBusinessRules;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements IExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseBusinessRules businessRules;
    private final ApplicationEventPublisher eventPublisher; // Event fırlatmak için
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ApiResponse<ExpenseResponseDto> create(CreateExpenseRequest request, Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        Expense expense = new Expense();
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setStatus(RequestStatus.PENDING);
        expense.setEmployee(employee);

        Expense savedExpense = expenseRepository.save(expense);

        // ASYNC EVENT: Bildirim akışını tetikle
        eventPublisher.publishEvent(new ExpenseCreatedEvent(savedExpense));

        return ApiResponse.success(ExpenseResponseDto.fromEntity(savedExpense), "Masraf talebi oluşturuldu.", 201);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ExpenseResponseDto>> getMyExpenses(Long employeeId) {
        // KURAL: Çalışan sadece kendi taleplerini görür
        List<ExpenseResponseDto> expenses = expenseRepository.findAllByEmployeeId(employeeId)
                .stream().map(ExpenseResponseDto::fromEntity).toList();
        return ApiResponse.success(expenses, "Masraflarınız listelendi.", 200);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ExpenseResponseDto>> getSubordinateExpenses(Long managerId) {
        // KURAL: Yönetici sadece kendine bağlı çalışanları görür
        List<ExpenseResponseDto> expenses = expenseRepository.findSubordinateExpenses(managerId)
                .stream().map(ExpenseResponseDto::fromEntity).toList();
        return ApiResponse.success(expenses, "Bağlı personel masrafları getirildi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> updateStatus(Long expenseId, UpdateExpenseStatusRequest request, Long managerId) {
        Expense expense = businessRules.getExpenseIfExist(expenseId);

        businessRules.expenseMustBePending(expense);
        businessRules.validateManagerOwnership(expense, managerId);

        expense.setStatus(request.status());
        expenseRepository.save(expense);

        return ApiResponse.success(null, "Masraf durumu güncellendi: " + request.status(), 200);
    }
}