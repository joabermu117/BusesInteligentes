package com.adm.ms_security.Services;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.adm.ms_security.Configurations.RecaptchaProperties;
import com.adm.ms_security.Exceptions.ApiException;

@Service
public class AntiBotService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AntiBotService.class);

    private final RestClient restClient;
    private final RecaptchaProperties recaptchaProperties;

    public AntiBotService(RecaptchaProperties recaptchaProperties) {
        this.recaptchaProperties = recaptchaProperties;
        this.restClient = RestClient.builder().build();
    }

    public void validate(String recaptchaToken, String expectedAction) {
        if (!recaptchaProperties.isEnabled()) {
            return;
        }

        if (recaptchaToken == null || recaptchaToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RECAPTCHA_MISSING", "El token de reCAPTCHA es obligatorio");
        }

        if (recaptchaProperties.getSecretKey() == null || recaptchaProperties.getSecretKey().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "RECAPTCHA_NOT_CONFIGURED",
                    "reCAPTCHA no esta configurado");
        }

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("secret", recaptchaProperties.getSecretKey());
        formData.add("response", recaptchaToken);

        RecaptchaResponse response = restClient.post()
                .uri(URI.create(recaptchaProperties.getVerifyUrl()))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(RecaptchaResponse.class);

        if (response == null || !response.success()) {
            LOGGER.warn("reCAPTCHA rejected. action={}, errors={}", expectedAction,
                    response == null ? List.of("empty-response") : response.errorCodes());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "RECAPTCHA_INVALID", "No fue posible validar reCAPTCHA");
        }

        boolean actionMatches = expectedAction.equalsIgnoreCase(response.action());
        boolean scoreValid = response.score() != null && response.score() >= recaptchaProperties.getScoreThreshold();
        if (!actionMatches || !scoreValid) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "RECAPTCHA_INVALID", "No fue posible validar reCAPTCHA",
                    Map.of("score", response.score(), "action", response.action()));
        }
    }

    private record RecaptchaResponse(
            boolean success,
            Double score,
            String action,
            String hostname,
            String challenge_ts,
            List<String> errorCodes) {
    }
}
