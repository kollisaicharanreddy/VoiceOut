package com.voiceout.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SubmissionRateLimiter {

    private final Map<String, Deque<Instant>> requestTimes = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final Duration window;

    public SubmissionRateLimiter(
            @Value("${voiceout.submission-limit.max-per-window:5}") int maxRequests,
            @Value("${voiceout.submission-limit.window-minutes:10}") long windowMinutes) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    public boolean allow(String key) {
        Instant now = Instant.now();
        Deque<Instant> timestamps = requestTimes.computeIfAbsent(key, ignored -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(now.minus(window))) {
                timestamps.removeFirst();
            }

            if (timestamps.size() >= maxRequests) {
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }
}