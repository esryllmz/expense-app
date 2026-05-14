package com.qoex.expense_app.core.middlewares;

import com.qoex.expense_app.core.constants.Messages;
import com.qoex.expense_app.core.exceptions.BaseException;
import com.qoex.expense_app.core.responses.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        // 1. Tüm Custom Exceptionlarımızı (BaseException'dan türeyenler) tek yerden
        // yakalar
        @ExceptionHandler(BaseException.class)
        public ResponseEntity<ApiResponse<Void>> handleBaseException(BaseException ex) {
                log.error("Uygulama Hatası: {} | Durum: {}", ex.getMessage(), ex.getStatus());
                return ResponseEntity
                                .status(ex.getStatus())
                                .body(ApiResponse.error(ex.getMessage(), ex.getStatus().value()));
        }

        // 2. Validasyon Hataları (Daha şık bir Map yapısıyla)
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
                        MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

                log.warn("Validasyon Hatası: {}", errors);
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.errorData(errors, Messages.VALIDATION_ERROR, 400));
        }

        // 3. Runtime/Sistem Hataları (En genel hata)
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
                log.error("KRİTİK SİSTEM HATASI: ", ex);
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.error(Messages.SYSTEM_ERROR, 500));
        }
}