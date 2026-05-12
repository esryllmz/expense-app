package com.qoex.expense_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
                @NotBlank(message = "Mevcut şifrenizi giriniz.") String currentPassword,

                @NotBlank(message = "Yeni şifre boş olamaz.") @Size(min = 8, message = "Yeni şifre en az 8 karakter olmalıdır.") @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.") String newPassword,

                @NotBlank(message = "Şifre tekrarı gereklidir.") String confirmNewPassword) {
}