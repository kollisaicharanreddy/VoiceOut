package com.voiceout.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SurveyDetailsResponse(
        UUID id,
        String title,
        String description,
        List<QuestionDTO> questions,
        LocalDateTime createdAt,
        List<SurveyTokenResponse> tokens,
        List<SurveyResponseView> responses
) {
}
