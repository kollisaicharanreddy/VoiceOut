package com.voiceout.dto;

public record ComplaintCreateResponse(
        String trackingCode,
        String status,
        String message) {
}