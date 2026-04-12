package com.adm.ms_security.Dtos;

import java.time.Instant;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiErrorDto {
    private String code;
    private String message;
    private Map<String, Object> details;
    private Instant timestamp;
    private String traceId;
}
