package com.qoex.expense_app.service.rules;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.ForbiddenException;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.model.Leave;
import com.qoex.expense_app.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class LeaveBusinessRules {

    private final LeaveRepository leaveRequestRepository;

    public void validateDates(LocalDate start, LocalDate end) {
        // KURAL: Bitiş tarihi başlangıçtan önce olamaz
        if (end.isBefore(start)) {
            throw new BusinessException("Bitiş tarihi başlangıç tarihinden önce olamaz.");
        }
        // KURAL: Geçmiş tarihe izin alınamaz (Opsiyonel)
        if (start.isBefore(LocalDate.now())) {
            throw new BusinessException("Geçmiş bir tarih için izin talebi oluşturulamaz.");
        }
    }

    public void validateManagerAction(Leave leaveRequest, Long managerId) {
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
            throw new BusinessException("Sadece beklemedeki (PENDING) izin talepleri üzerinde işlem yapılabilir.");
        }
    }
}