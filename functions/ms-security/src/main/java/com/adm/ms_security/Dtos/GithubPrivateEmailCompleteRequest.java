package com.adm.ms_security.Dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GithubPrivateEmailCompleteRequest {

    @NotBlank(message = "El token de Firebase es obligatorio")
    private String idToken;

    @NotBlank(message = "El token de reCAPTCHA es obligatorio")
    private String recaptchaToken;

    @NotBlank(message = "El email alternativo es obligatorio")
    @Email(message = "El formato del email no es valido")
    private String email;

    private String name;
    private String photoUrl;
    private String githubUsername;
    private boolean alternateEmailFlow;
}