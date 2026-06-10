package com.voiceout.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record QuestionDTO(
        @NotBlank String text,
        @NotBlank String type, // DESCRIPTIVE, NUMBER, SINGLE_CHOICE, MULTIPLE_CHOICE
        List<String> options
) {
}
