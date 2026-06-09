package com.voiceout.dto;

import java.util.UUID;

public record ComplaintSimilarityResponse(
        UUID id,
        String trackingCode,
        String status,
        String aiCategory,
        String aiSummary,
        double similarity) {
}