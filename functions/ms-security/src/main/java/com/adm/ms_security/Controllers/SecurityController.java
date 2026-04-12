package com.adm.ms_security.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Dtos.AuthTokenResponse;
import com.adm.ms_security.Dtos.ChallengeActionRequestDto;
import com.adm.ms_security.Dtos.FirebaseLoginRequest;
import com.adm.ms_security.Dtos.GenericMessageResponseDto;
import com.adm.ms_security.Dtos.LoginChallengeResponseDto;
import com.adm.ms_security.Dtos.LoginRequestDto;
import com.adm.ms_security.Dtos.PasswordRecoveryConfirmRequestDto;
import com.adm.ms_security.Dtos.RecoveryRequestDto;
import com.adm.ms_security.Dtos.RegisterRequest;
import com.adm.ms_security.Dtos.VerifyOtpRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpResponseDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.AuthFlowService;
import com.adm.ms_security.Services.PasswordRecoveryService;
import com.adm.ms_security.Services.SecurityService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class SecurityController {

    private final SecurityService securityService;
    private final AuthFlowService authFlowService;
    private final PasswordRecoveryService passwordRecoveryService;

    public SecurityController(
            SecurityService securityService,
            AuthFlowService authFlowService,
            PasswordRecoveryService passwordRecoveryService) {
        this.securityService = securityService;
        this.authFlowService = authFlowService;
        this.passwordRecoveryService = passwordRecoveryService;
    }

    @Operation(summary = "Inicia login y genera challenge OTP por correo")
    @PostMapping("login")
    public ResponseEntity<LoginChallengeResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authFlowService.startEmailLogin(request));
    }

    @Operation(summary = "Verifica OTP de 6 digitos y emite JWT")
    @PostMapping("2fa/verify")
    public ResponseEntity<VerifyOtpResponseDto> verifyOtp(@Valid @RequestBody VerifyOtpRequestDto request) {
        return ResponseEntity.ok(authFlowService.verifyOtp(request));
    }

    @Operation(summary = "Reenvia OTP y rota el codigo")
    @PostMapping("2fa/resend")
    public ResponseEntity<LoginChallengeResponseDto> resendOtp(@Valid @RequestBody ChallengeActionRequestDto request) {
        return ResponseEntity.ok(authFlowService.resendOtp(request.getChallengeId()));
    }

    @Operation(summary = "Cancela la sesion parcial de 2FA")
    @PostMapping("2fa/cancel")
    public ResponseEntity<GenericMessageResponseDto> cancelOtp(@Valid @RequestBody ChallengeActionRequestDto request) {
        authFlowService.cancelChallenge(request.getChallengeId());
        return ResponseEntity.ok(new GenericMessageResponseDto("Sesion de verificacion cancelada"));
    }

    @Operation(summary = "Solicita recuperacion de contraseña con respuesta generica")
    @PostMapping("password-recovery/request")
    public ResponseEntity<GenericMessageResponseDto> requestRecovery(@Valid @RequestBody RecoveryRequestDto request) {
        return ResponseEntity.ok(passwordRecoveryService.requestRecovery(request));
    }

    @Operation(summary = "Confirma recuperacion de contraseña con token")
    @PostMapping("password-recovery/confirm")
    public ResponseEntity<GenericMessageResponseDto> confirmRecovery(
            @Valid @RequestBody PasswordRecoveryConfirmRequestDto request) {
        return ResponseEntity.ok(passwordRecoveryService.confirmRecovery(request));
    }

    @Operation(summary = "Registro con email y contraseña")
    @PostMapping("register")
    public ResponseEntity<AuthTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = securityService.registerWithEmailPassword(
                request.getName(),
                request.getEmail(),
                request.getPassword());

        if (user == null) {
            throw new ApiException(HttpStatus.CONFLICT, "REGISTER_EMAIL_EXISTS", "Ese correo ya esta registrado");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthTokenResponse(securityService.generateToken(user)));
    }

    @Operation(summary = "Login social con Firebase e inicio de challenge OTP")
    @PostMapping("firebase-login")
    public ResponseEntity<LoginChallengeResponseDto> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        FirebaseToken decodedToken = verifyFirebaseIdToken(request.getIdToken());
        User user = securityService.findOrCreateFromFirebase(decodedToken);
        return ResponseEntity.ok(authFlowService.startSocialLogin(user, request.getRecaptchaToken()));
    }

    @Operation(summary = "Login con GitHub via Firebase e inicio de challenge OTP")
    @PostMapping("github-login")
    public ResponseEntity<LoginChallengeResponseDto> githubLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        FirebaseToken decodedToken = verifyFirebaseIdToken(request.getIdToken());
        User user = securityService.findOrCreateFromGithub(decodedToken);
        return ResponseEntity.ok(authFlowService.startSocialLogin(user, request.getRecaptchaToken()));
    }

    private FirebaseToken verifyFirebaseIdToken(String idToken) {
        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken.trim());
        } catch (FirebaseAuthException | IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_FIREBASE", "No fue posible validar la cuenta");
        }
    }
}
