package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.exceptions.NotFoundException;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.ExpenseRepository;
import com.qoex.expense_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ExpenseBusinessRules {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final RequestApprovalRules approvalRules;

    public Expense getExpenseIfExist(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Masraf talebi bulunamadı. ID: " + id));
    }

    public void validateManagerOwnership(Expense expense, Long currentManagerId) {
        User currentUser = userRepository.findById(currentManagerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        approvalRules.managerMustBeAllowedToManageEmployee(currentUser, expense.getEmployee());
    }

    public void expenseMustBePending(Expense expense) {
        approvalRules.requestMustBePending(expense.getStatus());
    }

    public void statusMustBeFinalDecision(com.qoex.expense_app.core.enums.RequestStatus status) {
        approvalRules.statusMustBeFinalDecision(status);
    }
}