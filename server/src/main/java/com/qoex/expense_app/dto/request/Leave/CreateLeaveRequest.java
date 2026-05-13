package com.qoex.expense_app.dto.request.Leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateLeaveRequest(
                @NotBlank(message = "Açıklama boş olamaz.") String description,

                @NotNull(message = "Başlangıç tarihi gereklidir.") LocalDate startDate,

                @NotNull(message = "Bitiş tarihi gereklidir.") LocalDate endDate) {
}
