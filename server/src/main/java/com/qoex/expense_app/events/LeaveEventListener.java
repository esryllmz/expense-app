package com.qoex.expense_app.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class LeaveEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleLeaveCreatedEvent(LeaveCreatedEvent event) {
        if (event.managerId() == null) {
            log.info(
                    "Bildirim gönderilmedi. Çalışanın yöneticisi bulunamadı. EmployeeId: {}, LeaveId: {}",
                    event.employeeId(),
                    event.leaveId());
            return;
        }

        log.info(
                "BİLDİRİM GÖNDERİLDİ: Sayın {}, personeliniz {} yeni bir izin talebi oluşturdu. Tarih: {} - {}",
                event.managerName(),
                event.employeeName(),
                event.startDate(),
                event.endDate());
    }
}