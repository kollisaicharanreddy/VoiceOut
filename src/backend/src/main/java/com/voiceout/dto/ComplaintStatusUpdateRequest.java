package com.voiceout.dto;

import com.voiceout.model.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public record ComplaintStatusUpdateRequest(
        @NotNull ComplaintStatus status) {
}