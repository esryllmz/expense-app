package com.qoex.expense_app.events;

/**
 * Record yapısı sayesinde 'expense()' metodu
 * otomatik olarak oluşturulur ve doldurulur.
 */
public record ExpenseCreatedEvent(
                Long expenseId,
                Long employeeId,
                String employeeName,
                Long managerId,
                String managerName,
                java.math.BigDecimal amount) {
}