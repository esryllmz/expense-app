package com.qoex.expense_app.dto.request.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequestDto(
        @NotBlank(message = "E-posta adresi gereklidir.") @Email(message = "Geçerli bir e-posta formatı giriniz.") String email,

        @NotBlank(message = "Şifre gereklidir.") String password) {
}