package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.ForbiddenException;
import com.qoex.expense_app.core.exceptions.NotFoundException;
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

    private final LeaveRepository leaveRequestRepository;
    private final UserRepository userRepository;

    public void validateDates(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw new BusinessException("Bitiş tarihi başlangıç tarihinden önce olamaz.");
        }

        if (start.isBefore(LocalDate.now())) {
            throw new BusinessException("Geçmiş bir tarih için izin talebi oluşturulamaz.");
        }
    }

    public void validateManagerAction(Leave leaveRequest, Long managerId) {
        User currentUser = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        // GM tüm şirket personelinin izinlerini yönetebilir ama kendi talebini bu
        // endpointten yönetemez.
        if (currentUser.getRole() == UserRole.ROLE_GM) {
            if (leaveRequest.getEmployee().getId().equals(managerId)) {
                throw new ForbiddenException("Kendi talebinizi yönetici onayı ile güncelleyemezsiniz.");
            }

            return;
        }

        if (leaveRequest.getEmployee().getManager() == null ||
                !leaveRequest.getEmployee().getManager().getId().equals(managerId)) {

            throw new ForbiddenException("Sadece kendi personelinizin izinlerini yönetebilirsiniz.");
        }
    }

    public Leave getIfExist(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("İzin talebi bulunamadı."));
    }

    public void leaveMustBePending(Leave leaveRequest) {
        if (leaveRequest.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Sadece beklemedeki izin talepleri üzerinde işlem yapılabilir.");
        }
    }

    public void statusMustBeFinalDecision(RequestStatus status) {
        if (status == RequestStatus.PENDING) {
            throw new BusinessException("Talep tekrar bekleme durumuna alınamaz.");
        }
    }
}