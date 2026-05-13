package com.qoex.expense_app.core.middlewares;

import com.qoex.expense_app.core.responses.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.qoex.expense_app.core.exceptions.BusinessException;
import com.qoex.expense_app.core.exceptions.ForbiddenException;
import com.qoex.expense_app.core.exceptions.NotFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // Tüm controller'lardaki hataları merkezi olarak yakalar
@Slf4j
public class GlobalExceptionHandler {

    // 1. İş Kuralları Hataları (BusinessException)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException exception) {
        log.error("İş Kuralı İhlali: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(exception.getMessage(), 400));
    }

    // 2. Kayıt Bulunamadı Hataları (NotFoundException)
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFoundException(NotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(exception.getMessage(), 404));
    }

    // 3. Yetkisiz Erişim (Forbidden/Authorization)
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenException(ForbiddenException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(exception.getMessage(), 403));
    }

    // 4. Validasyon Hataları (@Valid - @NotBlank vb.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException exception) {
        Map<String, String> errors = new HashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.success(errors, "Validasyon hatası oluştu.", 400));
    }

    // 5. Beklenmedik Genel Hatalar
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception exception) {
        log.error("Sistem Hatası: ", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Beklenmedik bir sistem hatası oluştu.", 500));
    }
}