package com.qoex.expense_app.core.responses;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private int statusCode;
    private List<String> errors;

    // --- Başarılı İşlemler İçin ---
    public static <T> ApiResponse<T> success(T data, String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .statusCode(statusCode)
                .build();
    }

    // --- Hata İşlemleri İçin (Overloaded Metotlar) ---

    // 1. Liste halinde detaylı hata mesajı dönmek için (.NET'teki detaylı
    // validasyon hataları gibi)
    public static <T> ApiResponse<T> error(String message, int statusCode, List<String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .errors(errors)
                .build();
    }

    // 2. Sadece genel bir mesaj ve status kodu dönmek için
    // (GlobalExceptionHandler'daki hatayı çözen metot)
    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .errors(null)
                .build();
    }
}