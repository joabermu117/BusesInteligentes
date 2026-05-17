package com.adm.ms_security.Controllers;

import java.util.Locale;
import java.util.Map;

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
import com.adm.ms_security.Dtos.GithubPrivateEmailCompleteRequest;
import com.adm.ms_security.Dtos.LoginChallengeResponseDto;
import com.adm.ms_security.Dtos.LoginRequestDto;
import com.adm.ms_security.Dtos.PasswordRecoveryConfirmRequestDto;
import com.adm.ms_security.Dtos.RecoveryRequestDto;
import com.adm.ms_security.Dtos.RegisterRequest;
import com.adm.ms_security.Dtos.VerifyOtpRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpResponseDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.AuthFlowService;
import com.adm.ms_security.Services.PasswordRecoveryService;
import com.adm.ms_security.Services.SecurityService;
import com.adm.ms_security.Services.UserRoleService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
/**
 * Public authentication controller.
 *
 * This controller groups endpoints that do not require a previous JWT:
 * login start, 2FA operations, registration and password recovery.
 */
public class SecurityController {

    private final SecurityService securityService;
    private final AuthFlowService authFlowService;
    private final PasswordRecoveryService passwordRecoveryService;
    private final UserRoleService userRoleService;

    public SecurityController(
            SecurityService securityService,
            AuthFlowService authFlowService,
            PasswordRecoveryService passwordRecoveryService,
            UserRoleService userRoleService) {
        this.securityService = securityService;
        this.authFlowService = authFlowService;
        this.passwordRecoveryService = passwordRecoveryService;
        this.userRoleService = userRoleService;
    }

    @Operation(summary = "Inicia login y genera challenge OTP por correo")
    @PostMapping("login")
    /**
     * Starts local login flow and returns an OTP challenge id.
     */
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        Object result = authFlowService.startEmailLogin(request);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Validates JWT + permission for URL+method (called by NestJS guard)")
    @PostMapping("permissions-validation")
    /**
     * Called by the NestJS SecurityGuard to verify if a user's role
     * grants access to a specific URL+method combination.
     *
     * Expects: Bearer JWT in Authorization header,
     * Permission body with url and method fields.
     *
     * Returns strict boolean true on success, throws ApiException on failure.
     */
    public boolean permissionsValidation(final HttpServletRequest request, @RequestBody Permission thePermission) {
        boolean granted = this.securityService.permissionsValidation(request, thePermission);
        if (!granted) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PERMISSION_DENIED",
                    "No tienes permiso para acceder a este recurso");
        }
        return true;
    }

    @Operation(summary = "Verifica OTP de 6 digitos y emite JWT")
    @PostMapping("2fa/verify")
    /**
     * Verifies OTP challenge and issues final JWT on success.
     */
    public ResponseEntity<VerifyOtpResponseDto> verifyOtp(@Valid @RequestBody VerifyOtpRequestDto request) {
        return ResponseEntity.ok(authFlowService.verifyOtp(request));
    }

    @Operation(summary = "Reenvia OTP y rota el codigo")
    @PostMapping("2fa/resend")
    /**
     * Regenerates OTP and applies resend cooldown policy.
     */
    public ResponseEntity<LoginChallengeResponseDto> resendOtp(@Valid @RequestBody ChallengeActionRequestDto request) {
        return ResponseEntity.ok(authFlowService.resendOtp(request.getChallengeId()));
    }

    @Operation(summary = "Cancela la sesion parcial de 2FA")
    @PostMapping("2fa/cancel")
    /**
     * Cancels partial 2FA session when user aborts flow.
     */
    public ResponseEntity<GenericMessageResponseDto> cancelOtp(@Valid @RequestBody ChallengeActionRequestDto request) {
        authFlowService.cancelChallenge(request.getChallengeId());
        return ResponseEntity.ok(new GenericMessageResponseDto("Sesion de verificacion cancelada"));
    }

    @Operation(summary = "Solicita recuperacion de contraseña con respuesta generica")
    @PostMapping("password-recovery/request")
    /**
     * Requests password recovery link. Response is generic to avoid user
     * enumeration.
     */
    public ResponseEntity<GenericMessageResponseDto> requestRecovery(@Valid @RequestBody RecoveryRequestDto request) {
        return ResponseEntity.ok(passwordRecoveryService.requestRecovery(request));
    }

    @Operation(summary = "Confirma recuperacion de contraseña con token")
    @PostMapping("password-recovery/confirm")
    /**
     * Consumes recovery token and updates user password.
     */
    public ResponseEntity<GenericMessageResponseDto> confirmRecovery(
            @Valid @RequestBody PasswordRecoveryConfirmRequestDto request) {
        return ResponseEntity.ok(passwordRecoveryService.confirmRecovery(request));
    }

    @Operation(summary = "Registro con email y contraseña")
    @PostMapping("register")
    /**
     * Registers local user and returns JWT if account is created.
     * Response includes access_token and user roles for frontend module routing.
     */
    public ResponseEntity<AuthTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = securityService.registerWithEmailPassword(
                request.getName(),
                request.getEmail(),
                request.getPassword());

        if (user == null) {
            throw new ApiException(HttpStatus.CONFLICT, "REGISTER_EMAIL_EXISTS", "Ese correo ya esta registrado");
        }

        String token = securityService.generateToken(user);
        java.util.List<String> roles = userRoleService.getRoleNamesByUser(user.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthTokenResponse(token, roles));
    }

    @Operation(summary = "Login social con Firebase e inicio de challenge OTP")
    @PostMapping("firebase-login")
    /**
     * Validates Firebase token and starts 2FA flow for social login.
     */
    public ResponseEntity<?> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        FirebaseToken decodedToken = verifyFirebaseIdToken(request.getIdToken());
        String signInProvider = getSignInProvider(decodedToken);
        String firebaseEmail = normalizeEmail(decodedToken.getEmail());

        if (isGithubProvider(signInProvider)) {
            if (isGithubPrivateEmail(firebaseEmail)) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of(
                                "requiresEmail", true,
                                "name", decodedToken.getName() != null ? decodedToken.getName() : "",
                                "photoUrl", request.getPhotoUrl() != null ? request.getPhotoUrl() : "",
                                "githubUsername",
                                request.getGithubUsername() != null ? request.getGithubUsername() : ""));
            }

            User githubUser = securityService.findOrCreateFromGithub(
                    decodedToken,
                    request.getPhotoUrl(),
                    request.getGithubUsername());
            return ResponseEntity.ok(authFlowService.startSocialLogin(githubUser, request.getRecaptchaToken()));
        }

        User user = securityService.findOrCreateFromFirebase(
                decodedToken,
                mapProviderForProfile(signInProvider),
                request.getPhotoUrl(),
                request.getGithubUsername());
        return ResponseEntity.ok(authFlowService.startSocialLogin(user, request.getRecaptchaToken()));
    }

    @Operation(summary = "Login con GitHub via Firebase e inicio de challenge OTP")
    @PostMapping("github-login")
    /**
     * Uses Firebase-issued GitHub token and starts unified 2FA flow.
     */
    public ResponseEntity<?> githubLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        FirebaseToken decodedToken = verifyFirebaseIdToken(request.getIdToken());
        validateGithubProvider(decodedToken);
        String firebaseEmail = normalizeEmail(decodedToken.getEmail());
        boolean requiresAlternativeByClient = Boolean.TRUE.equals(request.getRequiresAlternativeEmail());
        boolean hasUsableGithubIdentity = securityService.hasUsableGithubIdentity(
                decodedToken.getUid(),
                request.getGithubUsername());

        // Email privado en GitHub — pedir email alternativo al frontend
        if (isGithubPrivateEmail(firebaseEmail)
                || (requiresAlternativeByClient && !hasUsableGithubIdentity)) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of(
                            "requiresEmail", true,
                            "name", decodedToken.getName() != null ? decodedToken.getName() : "",
                            "photoUrl", request.getPhotoUrl() != null ? request.getPhotoUrl() : "",
                            "githubUsername", request.getGithubUsername() != null ? request.getGithubUsername() : ""));
        }

        User user = securityService.findOrCreateFromGithub(
                decodedToken,
                request.getPhotoUrl(),
                request.getGithubUsername());
        return ResponseEntity.ok(authFlowService.startSocialLogin(user, request.getRecaptchaToken()));
    }

    @Operation(summary = "Completa login GitHub cuando el email era privado")
    @PostMapping("github-login/complete")
    public ResponseEntity<?> githubLoginComplete(
            @Valid @RequestBody GithubPrivateEmailCompleteRequest request) {

        FirebaseToken decodedToken = verifyFirebaseIdToken(request.getIdToken());
        validateGithubProvider(decodedToken);
        boolean githubEmailPrivate = isGithubPrivateEmail(normalizeEmail(decodedToken.getEmail()));
        if (!githubEmailPrivate && !request.isAlternateEmailFlow()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "GITHUB_EMAIL_NOT_PRIVATE",
                    "El flujo de email alternativo solo aplica cuando GitHub no entrega un email usable");
        }

        // En este caso el email viene del frontend (el alternativo que ingresó el
        // usuario)
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMAIL_REQUIRED", "El email es requerido");
        }

        User user = securityService.findOrCreateFromGithubWithEmail(
                decodedToken.getUid(),
                email,
                request.getName(),
                request.getPhotoUrl(),
                request.getGithubUsername());

        if (user == null) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS",
                    "Ese correo ya esta registrado con otro metodo de acceso");
        }

        Object result = authFlowService.startSocialLogin(user, request.getRecaptchaToken());
        return ResponseEntity.ok(result);
    }

    private FirebaseToken verifyFirebaseIdToken(String idToken) {
        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken.trim());
        } catch (FirebaseAuthException | IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_FIREBASE",
                    "No fue posible validar la cuenta");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email.trim().toLowerCase();
    }

    private boolean isGithubPrivateEmail(String email) {
        if (email == null) {
            return true;
        }

        return email.endsWith("@users.noreply.github.com");
    }

    private String getSignInProvider(FirebaseToken token) {
        if (token == null || token.getClaims() == null) {
            return "";
        }

        Object firebaseClaim = token.getClaims().get("firebase");
        if (!(firebaseClaim instanceof Map<?, ?> firebaseData)) {
            return "";
        }

        Object provider = firebaseData.get("sign_in_provider");
        if (!(provider instanceof String providerValue)) {
            return "";
        }

        return providerValue.trim().toLowerCase(Locale.ROOT);
    }

    private String mapProviderForProfile(String signInProvider) {
        if (signInProvider == null || signInProvider.isBlank()) {
            return "";
        }

        return switch (signInProvider) {
            case "google.com" -> "google";
            case "github.com" -> "github";
            case "microsoft.com" -> "microsoft";
            default -> signInProvider;
        };
    }

    private void validateGithubProvider(FirebaseToken token) {
        String signInProvider = getSignInProvider(token);
        if (!isGithubProvider(signInProvider)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_PROVIDER_MISMATCH",
                    "El token no corresponde a un inicio de sesion con GitHub");
        }
    }

    private boolean isGithubProvider(String signInProvider) {
        return "github.com".equals(signInProvider) || "github".equals(signInProvider);
    }
}
