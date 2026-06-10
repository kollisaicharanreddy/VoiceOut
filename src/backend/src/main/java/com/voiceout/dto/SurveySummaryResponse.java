package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SurveySummaryResponse(
        UUID id,
        String title,
        String description,
        int responseCount,
        int invitationCount,
        LocalDateTime createdAt
) {
}
