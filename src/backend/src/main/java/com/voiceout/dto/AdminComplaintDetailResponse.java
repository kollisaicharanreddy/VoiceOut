package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminComplaintDetailResponse(
        UUID id,
        String trackingCode,
        String content,
        String status,
        String enrichmentStatus,
        String aiCategory,
        String aiSummary,
        Double aiConfidence,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<AdminNoteViewResponse> notes) {
}