package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.ForbiddenException;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExpenseBusinessRules {

    private final ExpenseRepository expenseRepository;

    // .NET: GetPermissionIfExistAsync karşılığı
    public Expense getExpenseIfExist(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Masraf talebi bulunamadı. ID: " + id));
    }

    // KURAL: Yönetici sadece KENDİ personelinin masrafını onaylayabilir
    public void validateManagerOwnership(Expense expense, Long currentManagerId) {
        User employee = expense.getEmployee();
        if (employee.getManager() == null || !employee.getManager().getId().equals(currentManagerId)) {
            log.warn("Yetkisiz onay denemesi! Manager ID: {}, Masraf Sahibi Manager ID: {}",
                    currentManagerId, employee.getManager() != null ? employee.getManager().getId() : "Yok");
            throw new ForbiddenException("Sadece size bağlı çalışanların taleplerini yönetebilirsiniz.");
        }
    }

    // KURAL: Masraf sadece PENDING (Beklemede) ise işlem yapılabilir
    public void expenseMustBePending(Expense expense) {
        if (expense.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Sadece beklemedeki talepler üzerinde işlem yapılabilir.");
        }
    }
}