package com.qoex.expense_app.core.events;

import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ExpenseEventListener {

    @Async // .NET'teki arka plan görevleri/Task.Run benzeri asenkron çalışma
    @EventListener
    public void handleExpenseCreatedEvent(ExpenseCreatedEvent event) {
        Expense expense = event.expense();
        User manager = expense.getEmployee().getManager();

        if (manager != null) {
            // Gerçek senaryoda burada Push Notification veya Email servisi çağrılır
            log.info("BİLDİRİM GÖNDERİLDİ: Sayın {}, personeliniz {} yeni bir masraf talebi oluşturdu ({} TL).",
                    manager.getFirstName(), expense.getEmployee().getFirstName(), expense.getAmount());
        }
    }
}