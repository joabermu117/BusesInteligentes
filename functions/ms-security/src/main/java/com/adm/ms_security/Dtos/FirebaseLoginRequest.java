package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirebaseLoginRequest {

    @NotBlank(message = "El token de Firebase es obligatorio")
    private String idToken;
}