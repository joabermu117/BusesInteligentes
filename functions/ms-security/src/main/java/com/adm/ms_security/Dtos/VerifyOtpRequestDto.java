package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequestDto {
    @NotBlank(message = "El challengeId es obligatorio")
    private String challengeId;

    @NotBlank(message = "El codigo OTP es obligatorio")
    @Pattern(regexp = "\\d{6}", message = "El codigo OTP debe tener 6 digitos numericos")
    private String code;
}
