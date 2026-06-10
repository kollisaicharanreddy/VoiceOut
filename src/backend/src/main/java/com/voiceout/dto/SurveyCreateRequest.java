package com.voiceout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SurveyCreateRequest(
        @NotBlank String title,
        String description,
        @NotEmpty List<QuestionDTO> questions,
        @NotEmpty List<String> emails
) {
}
