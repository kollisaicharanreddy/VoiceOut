package com.voiceout.dto;

import java.time.LocalDateTime;

public record ComplaintPublicResponse(
        String trackingCode,
        String status,
        String content,
        String enrichmentStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}