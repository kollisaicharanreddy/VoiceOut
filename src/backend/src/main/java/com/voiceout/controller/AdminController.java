package com.voiceout.controller;

import com.voiceout.dto.AdminComplaintDetailResponse;
import com.voiceout.dto.AdminComplaintListItemResponse;
import com.voiceout.dto.AdminNoteRequest;
import com.voiceout.dto.ComplaintSimilarityResponse;
import com.voiceout.dto.ComplaintStatusUpdateRequest;
import com.voiceout.service.ComplaintService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ComplaintService complaintService;

    public AdminController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping("/complaints")
    public List<AdminComplaintListItemResponse> listComplaints(@RequestParam Optional<String> status) {
        return complaintService.listAdminComplaints(status);
    }

    @GetMapping("/complaints/{complaintId}")
    public AdminComplaintDetailResponse getComplaint(@PathVariable UUID complaintId) {
        return complaintService.getAdminComplaint(complaintId);
    }

    @PostMapping("/complaints/{complaintId}/notes")
    public AdminComplaintDetailResponse addNote(
            @PathVariable UUID complaintId,
            @Valid @RequestBody AdminNoteRequest request) {
        return complaintService.addNote(complaintId, request);
    }

    @PatchMapping("/complaints/{complaintId}/status")
    public AdminComplaintDetailResponse updateStatus(
            @PathVariable UUID complaintId,
            @Valid @RequestBody ComplaintStatusUpdateRequest request) {
        return complaintService.updateStatus(complaintId, request);
    }

    @GetMapping("/complaints/{complaintId}/similar")
    public List<ComplaintSimilarityResponse> findSimilar(
            @PathVariable UUID complaintId,
            @RequestParam(defaultValue = "5") int n) {
        return complaintService.findSimilarComplaints(complaintId, n);
    }
}