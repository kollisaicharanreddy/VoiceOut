package com.voiceout.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AddInvitationsRequest(
        @NotEmpty List<String> emails
) {
}
