package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SurveyResponseView(
        UUID id,
        List<String> answers,
        LocalDateTime submittedAt
) {
}
