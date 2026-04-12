package com.adm.ms_security.Exceptions;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.adm.ms_security.Dtos.ApiErrorDto;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorDto> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(buildError(exception.getCode(), exception.getMessage(), exception.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDto> handleValidationException(MethodArgumentNotValidException exception) {
        Map<String, Object> details = new HashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            details.put(error.getField(), error.getDefaultMessage());
        }

        return ResponseEntity.badRequest()
                .body(buildError("VALIDATION_ERROR", "La solicitud contiene datos invalidos", details));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDto> handleUnexpectedException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError("INTERNAL_ERROR", "Se produjo un error interno", Map.of()));
    }

    private ApiErrorDto buildError(String code, String message, Map<String, Object> details) {
        return ApiErrorDto.builder()
                .code(code)
                .message(message)
                .details(details)
                .timestamp(Instant.now())
                .traceId(resolveTraceId())
                .build();
    }

    private String resolveTraceId() {
        String traceId = MDC.get("traceId");
        return traceId == null ? "N/A" : traceId;
    }
}
