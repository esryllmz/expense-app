package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.exceptions.BusinessException;
import com.qoex.expense_app.exceptions.NotFoundException;
import com.qoex.expense_app.model.Leave;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.LeaveRepository;
import com.qoex.expense_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class LeaveBusinessRules {

    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;
    private final RequestApprovalRules approvalRules;

    public void validateDates(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw new BusinessException("Bitiş tarihi başlangıç tarihinden önce olamaz.");
        }

        if (start.isBefore(LocalDate.now())) {
            throw new BusinessException("Geçmiş bir tarih için izin talebi oluşturulamaz.");
        }
    }

    public Leave getIfExist(Long id) {
        return leaveRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("İzin talebi bulunamadı."));
    }

    public void validateManagerAction(Leave leave, Long managerId) {
        User currentUser = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        approvalRules.managerMustBeAllowedToManageEmployee(currentUser, leave.getEmployee());
    }

    public void leaveMustBePending(Leave leave) {
        approvalRules.requestMustBePending(leave.getStatus());
    }

    public void statusMustBeFinalDecision(RequestStatus status) {
        approvalRules.statusMustBeFinalDecision(status);
    }
}