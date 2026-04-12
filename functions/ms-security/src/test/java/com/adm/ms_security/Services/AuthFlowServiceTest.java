package com.adm.ms_security.Services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.adm.ms_security.Dtos.LoginChallengeResponseDto;
import com.adm.ms_security.Dtos.LoginRequestDto;
import com.adm.ms_security.Models.AuthChallenge;
import com.adm.ms_security.Models.User;

@ExtendWith(MockitoExtension.class)
class AuthFlowServiceTest {

    @Mock
    private SecurityService securityService;

    @Mock
    private AntiBotService antiBotService;

    @Mock
    private EmailOtpService emailOtpService;

    private AuthFlowService authFlowService;

    @BeforeEach
    void setUp() {
        authFlowService = new AuthFlowService(securityService, antiBotService, emailOtpService);
    }

    @Test
    void shouldStartChallengeAfterValidCredentialsAndRecaptcha() {
        LoginRequestDto request = new LoginRequestDto();
        request.setEmail("user@example.com");
        request.setPassword("StrongPass123");
        request.setRecaptchaToken("recaptcha-token");

        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");

        AuthChallenge challenge = new AuthChallenge();
        challenge.setId("challenge-1");
        challenge.setEmail("user@example.com");
        challenge.setExpiresAt(Instant.now().plusSeconds(300));

        doNothing().when(antiBotService).validate("recaptcha-token", "login");
        when(securityService.authenticateLocalUser("user@example.com", "StrongPass123")).thenReturn(user);
        when(emailOtpService.startChallenge(any(User.class))).thenReturn(challenge);

        LoginChallengeResponseDto response = authFlowService.startEmailLogin(request);

        assertNotNull(response);
        assertEquals("challenge-1", response.getChallengeId());
        assertEquals("us***@***.com", response.getMaskedEmail());
    }
}
