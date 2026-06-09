package com.voiceout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComplaintCreateRequest(
        @NotBlank @Size(min = 10, max = 4000) String content) {
}