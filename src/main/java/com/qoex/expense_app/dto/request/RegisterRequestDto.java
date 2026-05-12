package com.qoex.expense_app.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequestDto(
        @NotBlank(message = "Ad boş olamaz.") @Size(min = 2, max = 50, message = "Ad 2 ile 50 karakter arasında olmalıdır.") String firstName,

        @NotBlank(message = "Soyad boş olamaz.") @Size(min = 2, max = 50, message = "Soyad 2 ile 50 karakter arasında olmalıdır.") String lastName,

        @NotBlank(message = "E-posta adresi gereklidir.") @Email(message = "Geçerli bir e-posta formatı giriniz.") String email,

        @NotBlank(message = "Şifre boş olamaz.") @Size(min = 8, message = "Şifre en az 8 karakter olmalıdır.") @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.") String password) {
}