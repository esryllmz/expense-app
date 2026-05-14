package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.ForbiddenException;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.ExpenseRepository;
import com.qoex.expense_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExpenseBusinessRules {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public Expense getExpenseIfExist(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Masraf talebi bulunamadı. ID: " + id));
    }

    public void validateManagerOwnership(Expense expense, Long currentManagerId) {
        User currentUser = userRepository.findById(currentManagerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        // GM tüm şirket personelinin taleplerini yönetebilir ama kendi talebini bu
        // endpointten yönetemez.
        if (currentUser.getRole() == UserRole.ROLE_GM) {
            if (expense.getEmployee().getId().equals(currentManagerId)) {
                throw new ForbiddenException("Kendi talebinizi yönetici onayı ile güncelleyemezsiniz.");
            }

            return;
        }

        User employee = expense.getEmployee();

        if (employee.getManager() == null ||
                !employee.getManager().getId().equals(currentManagerId)) {

            log.warn("Yetkisiz masraf onay denemesi. ManagerId: {}, EmployeeId: {}",
                    currentManagerId,
                    employee.getId());

            throw new ForbiddenException("Sadece size bağlı çalışanların taleplerini yönetebilirsiniz.");
        }
    }

    public void expenseMustBePending(Expense expense) {
        if (expense.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Sadece beklemedeki talepler üzerinde işlem yapılabilir.");
        }
    }

    public void statusMustBeFinalDecision(RequestStatus status) {
        if (status == RequestStatus.PENDING) {
            throw new BusinessException("Talep tekrar bekleme durumuna alınamaz.");
        }
    }
}