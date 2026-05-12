package com.qoex.expense_app.dto.request.Expense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateExpenseRequest(
        @NotBlank(message = "Açıklama boş olamaz.") String description,

        @Positive(message = "Tutar 0'dan büyük olmalıdır.") BigDecimal amount) {
}