package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirebaseLoginRequest {

    @NotBlank(message = "El token de Firebase es obligatorio")
    private String idToken;

    @NotBlank(message = "El token de reCAPTCHA es obligatorio")
    private String recaptchaToken;

    private String provider;
    private String photoUrl;
    private String githubUsername;
    private Boolean requiresAlternativeEmail;

    private String email;
    private String firebaseUid;
    private String name;
}