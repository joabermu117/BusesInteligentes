package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompleteProfileRequestDto {

    @NotBlank(message = "El userId es obligatorio")
    private String userId;

    @NotBlank(message = "El teléfono es obligatorio")
    private String phone;

    @NotBlank(message = "La dirección es obligatoria")
    private String address;

    private String birthDate;
}