package com.adm.ms_security.Services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RateLimitServiceTest {

    @Test
    void shouldBlockWhenRequestLimitIsExceededWithinWindow() {
        RateLimitService service = new RateLimitService();

        assertTrue(service.isAllowed("recovery:test@example.com", 2, 60));
        assertTrue(service.isAllowed("recovery:test@example.com", 2, 60));
        assertFalse(service.isAllowed("recovery:test@example.com", 2, 60));
    }
}
