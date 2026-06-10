package com.voiceout.dto;

import java.util.List;
import java.util.UUID;

public record SurveyVerificationResponse(
        boolean valid,
        UUID surveyId,
        String surveyTitle,
        String surveyDescription,
        List<QuestionDTO> questions
) {
}
