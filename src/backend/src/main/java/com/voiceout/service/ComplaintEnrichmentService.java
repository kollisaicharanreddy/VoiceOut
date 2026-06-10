package com.voiceout.service;

import com.voiceout.model.Complaint;
import com.voiceout.model.EnrichmentStatus;
import com.voiceout.repository.ComplaintRepository;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplaintEnrichmentService {

    private final ComplaintRepository complaintRepository;

    public ComplaintEnrichmentService(
            ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Async
    @Transactional
    public CompletableFuture<Void> enrichComplaint(UUID complaintId) {
        try {
            Optional<Complaint> complaintOptional = complaintRepository.findById(complaintId);
            if (complaintOptional.isEmpty()) {
                return CompletableFuture.completedFuture(null);
            }

            Complaint complaint = complaintOptional.get();
            String content = complaint.getContent() == null ? "" : complaint.getContent().trim();
            if (content.isBlank()) {
                complaint.setEnrichmentStatus(EnrichmentStatus.FAILED);
                complaintRepository.save(complaint);
                return CompletableFuture.completedFuture(null);
            }

            complaint.setAiCategory(classify(content));
            complaint.setAiSummary(createSummary(content));
            complaint.setAiConfidence(scoreConfidence(content));
            complaint.setEnrichmentStatus(EnrichmentStatus.DONE);
            complaintRepository.save(complaint);

            return CompletableFuture.completedFuture(null);
        } catch (RuntimeException exception) {
            complaintRepository.findById(complaintId).ifPresent(complaint -> {
                complaint.setEnrichmentStatus(EnrichmentStatus.FAILED);
                complaintRepository.save(complaint);
            });
            return CompletableFuture.failedFuture(exception);
        }
    }

    private String classify(String content) {
        String lowerContent = content.toLowerCase(Locale.ROOT);
        if (lowerContent.contains("harass") || lowerContent.contains("abuse")) {
            return "harassment";
        }
        if (lowerContent.contains("fraud") || lowerContent.contains("billing") || lowerContent.contains("charge")) {
            return "financial";
        }
        if (lowerContent.contains("privacy") || lowerContent.contains("data")) {
            return "privacy";
        }
        if (lowerContent.contains("safety") || lowerContent.contains("threat")) {
            return "safety";
        }
        return "general";
    }

    private String createSummary(String content) {
        String cleaned = content.replaceAll("\\s+", " ").trim();
        if (cleaned.length() <= 160) {
            return cleaned;
        }
        return cleaned.substring(0, 157) + "...";
    }

    private double scoreConfidence(String content) {
        long wordCount = content.trim().split("\\s+").length;
        if (wordCount >= 60) {
            return 0.88;
        }
        if (wordCount >= 20) {
            return 0.72;
        }
        return 0.55;
    }
}