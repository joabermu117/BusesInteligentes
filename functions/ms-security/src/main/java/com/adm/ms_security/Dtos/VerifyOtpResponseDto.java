package com.adm.ms_security.Dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyOtpResponseDto {
    private String token;
    private List<String> roles;

    public VerifyOtpResponseDto(String token) {
        this.token = token;
        this.roles = List.of();
    }
}
