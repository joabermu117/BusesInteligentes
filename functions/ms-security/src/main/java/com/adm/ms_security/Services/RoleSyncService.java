package com.adm.ms_security.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;

import java.util.Map;

/**
 * Service responsible for notifying the Business microservice (NestJS)
 * whenever a citizen or driver role is assigned or removed from a user
 * in the Security microservice (MongoDB source of truth).
 *
 * Uses RestTemplate for HTTP calls to the NestJS endpoints.
 */
@Service
public class RoleSyncService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RoleSyncService.class);

    private static final String ROLE_CITIZEN = "ROLE_CITIZEN";
    private static final String ROLE_CITIZEN_LEGACY = "Ciudadano";
    private static final String ROLE_DRIVER = "ROLE_DRIVER";
    private static final String ROLE_DRIVER_LEGACY = "Conductor";

    private final RestTemplate restTemplate;

    @Value("${business.ms-base-url:http://localhost:3000}")
    private String businessBaseUrl;

    public RoleSyncService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Called when a role is assigned to a user.
     * If the role is Ciudadano or Conductor, it notifies the business microservice
     * to activate the corresponding profile.
     */
    /**
     * Called when a role is assigned to a user.
     * If the role is ROLE_CITIZEN or ROLE_DRIVER (or legacy names),
     * it notifies the business microservice to activate the corresponding profile.
     */
    public void notifyRoleAssigned(User user, Role role) {
        if (user == null || role == null || role.getName() == null) {
            return;
        }

        String roleName = role.getName().trim();
        String personId = user.getId();

        if (isCitizenRole(roleName)) {
            notifyBusiness(personId, "/api/citizens/activate", "role-assigned", roleName);
        } else if (isDriverRole(roleName)) {
            notifyBusiness(personId, "/api/drivers/activate", "role-assigned", roleName);
        }
    }

    /**
     * Called when a role is removed from a user.
     * If the role is ROLE_CITIZEN or ROLE_DRIVER (or legacy names),
     * it notifies the business microservice to deactivate the corresponding
     * profile (soft delete, keeps history).
     */
    public void notifyRoleRemoved(User user, Role role) {
        if (user == null || role == null || role.getName() == null) {
            return;
        }

        String roleName = role.getName().trim();
        String personId = user.getId();

        if (isCitizenRole(roleName)) {
            notifyBusinessDeactivate(personId, "/api/citizens/" + personId + "/deactivate", roleName);
        } else if (isDriverRole(roleName)) {
            notifyBusinessDeactivate(personId, "/api/drivers/" + personId + "/deactivate", roleName);
        }
    }

    private boolean isCitizenRole(String roleName) {
        return ROLE_CITIZEN.equalsIgnoreCase(roleName)
                || ROLE_CITIZEN_LEGACY.equalsIgnoreCase(roleName);
    }

    private boolean isDriverRole(String roleName) {
        return ROLE_DRIVER.equalsIgnoreCase(roleName)
                || ROLE_DRIVER_LEGACY.equalsIgnoreCase(roleName);
    }

    /**
     * Sends a POST request to the business microservice to activate a profile.
     */
    private void notifyBusiness(String personId, String endpoint, String action, String roleName) {
        String url = businessBaseUrl + endpoint;
        HttpHeaders headers = buildHeaders();
        Map<String, String> body = Map.of("person_id", personId);

        try {
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                LOGGER.info("RoleSync: {} '{}' activated for personId={} -> {} {}",
                        roleName, action, personId, response.getStatusCode(), endpoint);
            } else {
                LOGGER.warn("RoleSync: {} '{}' returned non-2xx for personId={}: {}",
                        roleName, action, personId, response.getStatusCode());
            }
        } catch (RestClientException e) {
            LOGGER.error("RoleSync: Failed to notify business for {} '{}' personId={}: {}",
                    roleName, action, personId, e.getMessage());
        }
    }

    /**
     * Sends a PATCH request to the business microservice to deactivate a profile.
     */
    private void notifyBusinessDeactivate(String personId, String endpoint, String roleName) {
        String url = businessBaseUrl + endpoint;
        HttpHeaders headers = buildHeaders();

        try {
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                LOGGER.info("RoleSync: {} deactivated for personId={} -> {} {}",
                        roleName, personId, response.getStatusCode(), endpoint);
            } else {
                LOGGER.warn("RoleSync: {} deactivation returned non-2xx for personId={}: {}",
                        roleName, personId, response.getStatusCode());
            }
        } catch (RestClientException e) {
            LOGGER.error("RoleSync: Failed to deactivate {} for personId={}: {}",
                    roleName, personId, e.getMessage());
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
