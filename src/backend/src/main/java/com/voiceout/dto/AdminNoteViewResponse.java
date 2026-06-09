package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminNoteViewResponse(
        UUID id,
        String note,
        LocalDateTime createdAt) {
}