package com.qoex.expense_app.core.events;

import com.qoex.expense_app.model.Expense;

/**
 * Record yapısı sayesinde 'expense()' metodu
 * otomatik olarak oluşturulur ve doldurulur.
 */
public record ExpenseCreatedEvent(Expense expense) {
}