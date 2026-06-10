package com.voiceout.service;

import com.voiceout.dto.AdminComplaintDetailResponse;
import com.voiceout.dto.AdminComplaintListItemResponse;
import com.voiceout.dto.AdminNoteRequest;
import com.voiceout.dto.ComplaintCreateRequest;
import com.voiceout.dto.ComplaintCreateResponse;
import com.voiceout.dto.ComplaintPublicResponse;
import com.voiceout.dto.ComplaintStatusUpdateRequest;
import com.voiceout.dto.AdminNoteViewResponse;
import com.voiceout.model.AdminNote;
import com.voiceout.model.Complaint;
import com.voiceout.model.ComplaintStatus;
import com.voiceout.model.EnrichmentStatus;
import com.voiceout.repository.AdminNoteRepository;
import com.voiceout.repository.ComplaintRepository;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComplaintService {

    private static final char[] TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private final ComplaintRepository complaintRepository;
    private final AdminNoteRepository adminNoteRepository;
    private final ComplaintEnrichmentService complaintEnrichmentService;
    private final SubmissionRateLimiter submissionRateLimiter;
    private final SecureRandom secureRandom = new SecureRandom();

    public ComplaintService(
            ComplaintRepository complaintRepository,
            AdminNoteRepository adminNoteRepository,
            ComplaintEnrichmentService complaintEnrichmentService,
            SubmissionRateLimiter submissionRateLimiter) {
        this.complaintRepository = complaintRepository;
        this.adminNoteRepository = adminNoteRepository;
        this.complaintEnrichmentService = complaintEnrichmentService;
        this.submissionRateLimiter = submissionRateLimiter;
    }

    @Transactional
    public ComplaintCreateResponse createComplaint(ComplaintCreateRequest request, String clientKey) {
        if (!submissionRateLimiter.allow(clientKey)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Submission rate limit exceeded");
        }

        Complaint complaint = new Complaint();
        complaint.setContent(request.content().trim());
        complaint.setTrackingCode(generateUniqueTrackingCode());
        complaint.setStatus(ComplaintStatus.NEW);
        complaint.setEnrichmentStatus(EnrichmentStatus.PENDING);
        complaintRepository.save(complaint);

        complaintEnrichmentService.enrichComplaint(complaint.getId());

        return new ComplaintCreateResponse(
                complaint.getTrackingCode(),
                complaint.getStatus().name(),
                "Complaint received. Keep your tracking code to revisit the record later.");
    }

    @Transactional(readOnly = true)
    public ComplaintPublicResponse getPublicComplaint(String trackingCode) {
        Complaint complaint = complaintRepository.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        return new ComplaintPublicResponse(
                complaint.getTrackingCode(),
                complaint.getStatus().name(),
                complaint.getContent(),
                complaint.getEnrichmentStatus().name(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public List<AdminComplaintListItemResponse> listAdminComplaints(Optional<String> status) {
        List<Complaint> complaints = status
                .map(value -> ComplaintStatus.valueOf(value.toUpperCase(Locale.ROOT)))
                .map(complaintRepository::findAllByStatusOrderByCreatedAtDesc)
                .orElseGet(complaintRepository::findAllByOrderByCreatedAtDesc);

        List<AdminComplaintListItemResponse> responses = new ArrayList<>();
        for (Complaint complaint : complaints) {
            responses.add(toListItem(complaint));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public AdminComplaintDetailResponse getAdminComplaint(UUID complaintId) {
        Complaint complaint = findComplaintOrThrow(complaintId);
        List<AdminNoteViewResponse> noteViews = adminNoteRepository.findAllByComplaint_IdOrderByCreatedAtDesc(complaintId)
                .stream()
                .map(note -> new AdminNoteViewResponse(note.getId(), note.getNote(), note.getCreatedAt()))
                .toList();

        return new AdminComplaintDetailResponse(
                complaint.getId(),
                complaint.getTrackingCode(),
                complaint.getContent(),
                complaint.getStatus().name(),
                complaint.getEnrichmentStatus().name(),
                complaint.getAiCategory(),
                complaint.getAiSummary(),
                complaint.getAiConfidence(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                noteViews);
    }

    @Transactional
    public AdminComplaintDetailResponse addNote(UUID complaintId, AdminNoteRequest request) {
        Complaint complaint = findComplaintOrThrow(complaintId);
        AdminNote note = new AdminNote();
        note.setComplaint(complaint);
        note.setNote(request.note().trim());
        adminNoteRepository.save(note);
        return getAdminComplaint(complaintId);
    }

    @Transactional
    public AdminComplaintDetailResponse updateStatus(UUID complaintId, ComplaintStatusUpdateRequest request) {
        Complaint complaint = findComplaintOrThrow(complaintId);
        complaint.setStatus(request.status());
        complaintRepository.save(complaint);
        return getAdminComplaint(complaintId);
    }



    private Complaint findComplaintOrThrow(UUID complaintId) {
        return complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    private String generateUniqueTrackingCode() {
        for (int attempt = 0; attempt < 100; attempt++) {
            String candidate = randomCode(10);
            if (!complaintRepository.existsByTrackingCode(candidate)) {
                return candidate;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate tracking code");
    }

    private String randomCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int index = 0; index < length; index++) {
            builder.append(TRACKING_ALPHABET[secureRandom.nextInt(TRACKING_ALPHABET.length)]);
        }
        return builder.toString();
    }

    private AdminComplaintListItemResponse toListItem(Complaint complaint) {
        return new AdminComplaintListItemResponse(
                complaint.getId(),
                complaint.getTrackingCode(),
                complaint.getStatus().name(),
                complaint.getEnrichmentStatus().name(),
                complaint.getAiCategory(),
                complaint.getAiSummary(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt());
    }
}