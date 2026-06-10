package com.voiceout.dto;

import java.util.UUID;

public record SurveyTokenResponse(
        UUID id,
        String email,
        String token,
        boolean used,
        String invitationLink
) {
}
