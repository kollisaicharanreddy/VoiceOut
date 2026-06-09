package com.voiceout.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ComplaintVectorService {

    private static final String[] KEYWORDS = {
            "harassment",
            "safety",
            "billing",
            "privacy",
            "abuse",
            "fraud",
            "workplace",
            "service",
            "access",
            "support"
    };

    public double[] embed(String content) {
        double[] vector = new double[KEYWORDS.length];
        String normalized = content == null ? "" : content.toLowerCase(Locale.ROOT);

        for (int index = 0; index < KEYWORDS.length; index++) {
            String keyword = KEYWORDS[index];
            if (normalized.contains(keyword)) {
                vector[index] += 1.0;
            }
        }

        byte[] digest = digest(normalized);
        for (int index = 0; index < vector.length; index++) {
            vector[index] += (digest[index] & 0xFF) / 255.0;
        }

        return vector;
    }

    public double cosineSimilarity(double[] left, double[] right) {
        if (left == null || right == null || left.length == 0 || right.length == 0) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double leftMagnitude = 0.0;
        double rightMagnitude = 0.0;
        int length = Math.min(left.length, right.length);

        for (int index = 0; index < length; index++) {
            dotProduct += left[index] * right[index];
            leftMagnitude += left[index] * left[index];
            rightMagnitude += right[index] * right[index];
        }

        if (leftMagnitude == 0.0 || rightMagnitude == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
    }

    private byte[] digest(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            return messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            return new byte[KEYWORDS.length];
        }
    }
}