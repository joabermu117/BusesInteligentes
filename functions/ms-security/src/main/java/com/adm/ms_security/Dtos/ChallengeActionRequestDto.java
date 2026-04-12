package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChallengeActionRequestDto {
    @NotBlank(message = "El challengeId es obligatorio")
    private String challengeId;
}
