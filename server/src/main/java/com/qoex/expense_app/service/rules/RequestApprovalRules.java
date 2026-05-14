package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.exceptions.BusinessException;
import com.qoex.expense_app.exceptions.ForbiddenException;
import com.qoex.expense_app.model.User;
import org.springframework.stereotype.Component;

@Component
public class RequestApprovalRules {

    public void requestMustBePending(RequestStatus status) {
        if (status != RequestStatus.PENDING) {
            throw new BusinessException("Sadece beklemedeki talepler üzerinde işlem yapılabilir.");
        }
    }

    public void statusMustBeFinalDecision(RequestStatus status) {
        if (status == RequestStatus.PENDING) {
            throw new BusinessException("Talep tekrar bekleme durumuna alınamaz.");
        }
    }

    public void managerMustBeAllowedToManageEmployee(User currentUser, User employee) {
        if (employee.getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Kendi talebinizi yönetici onayı ile güncelleyemezsiniz.");
        }

        if (currentUser.getRole() == UserRole.ROLE_GM) {
            return;
        }

        if (employee.getManager() == null ||
                !employee.getManager().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Sadece size bağlı çalışanların taleplerini yönetebilirsiniz.");
        }
    }

    public void employeeMustHaveManager(User employee) {
        if (employee.getManager() == null) {
            throw new BusinessException("Talep oluşturabilmek için önce bir yönetici atanmalıdır.");
        }
    }
}