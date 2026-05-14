package com.qoex.expense_app.dto.request.User;

import jakarta.validation.constraints.*;

public record UpdateUserRequest(
        @NotBlank(message = "Ad boş olamaz.") @Size(min = 2, message = "Ad en az 2 karakter olmalıdır.") String firstName,

        @NotBlank(message = "Soyad boş olamaz.") @Size(min = 2, message = "Soyad en az 2 karakter olmalıdır.") String lastName) {
}