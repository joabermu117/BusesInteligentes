package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UnlinkProviderRequestDto {

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener minimo 8 caracteres")
    private String password;

    @NotBlank(message = "Debes confirmar la contraseña")
    @Size(min = 8, message = "La confirmacion debe tener minimo 8 caracteres")
    private String confirmPassword;
}
