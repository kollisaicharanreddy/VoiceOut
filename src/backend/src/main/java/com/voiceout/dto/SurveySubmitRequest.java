package com.voiceout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SurveySubmitRequest(
        @NotBlank String token,
        @NotEmpty List<String> answers
) {
}
