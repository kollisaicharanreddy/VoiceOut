package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminComplaintListItemResponse(
        UUID id,
        String trackingCode,
        String status,
        String enrichmentStatus,
        String aiCategory,
        String aiSummary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}