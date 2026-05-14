package com.qoex.expense_app.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class ExpenseEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleExpenseCreatedEvent(ExpenseCreatedEvent event) {
        if (event.managerId() == null) {
            log.info(
                    "Bildirim gönderilmedi. Çalışanın yöneticisi bulunamadı. EmployeeId: {}, ExpenseId: {}",
                    event.employeeId(),
                    event.expenseId());
            return;
        }

        log.info(
                "BİLDİRİM GÖNDERİLDİ: Sayın {}, personeliniz {} yeni bir masraf talebi oluşturdu. Tutar: {} TL",
                event.managerName(),
                event.employeeName(),
                event.amount());
    }
}