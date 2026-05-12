package com.qoex.expense_app.dto.request;

import jakarta.validation.constraints.*;

public record UpdateUserRequest(
                @NotBlank(message = "Ad boş olamaz.") @Size(min = 2, message = "Ad en az 2 karakter olmalıdır.") String firstName,

                @NotBlank(message = "Soyad boş olamaz.") @Size(min = 2, message = "Soyad en az 2 karakter olmalıdır.") String lastName,

                @NotBlank(message = "E-posta adresi boş olamaz.") @Email(message = "Geçerli bir e-posta adresi giriniz.") String email,

                @Size(max = 1000, message = "Bio en fazla 1000 karakter olabilir.") String bio) {
}