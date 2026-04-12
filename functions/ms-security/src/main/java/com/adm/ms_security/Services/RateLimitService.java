package com.adm.ms_security.Services;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {
        Instant now = Instant.now();
        RateLimitBucket bucket = buckets.computeIfAbsent(key, ignored -> new RateLimitBucket(now, 0));

        synchronized (bucket) {
            if (now.isAfter(bucket.windowStart.plusSeconds(windowSeconds))) {
                bucket.windowStart = now;
                bucket.count = 0;
            }

            if (bucket.count >= maxRequests) {
                return false;
            }

            bucket.count++;
            return true;
        }
    }

    private static class RateLimitBucket {
        private Instant windowStart;
        private int count;

        private RateLimitBucket(Instant windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
