package com.voiceout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminNoteRequest(
        @NotBlank @Size(min = 1, max = 5000) String note) {
}