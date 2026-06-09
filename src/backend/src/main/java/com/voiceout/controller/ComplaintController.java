package com.voiceout.controller;

import com.voiceout.dto.ComplaintCreateRequest;
import com.voiceout.dto.ComplaintCreateResponse;
import com.voiceout.dto.ComplaintPublicResponse;
import com.voiceout.service.ComplaintService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintCreateResponse> createComplaint(
            @Valid @RequestBody ComplaintCreateRequest request,
            HttpServletRequest servletRequest) {
        String clientKey = servletRequest.getRemoteAddr() == null ? "anonymous" : servletRequest.getRemoteAddr();
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.createComplaint(request, clientKey));
    }

    @GetMapping("/{trackingCode}")
    public ComplaintPublicResponse getComplaint(@PathVariable String trackingCode) {
        return complaintService.getPublicComplaint(trackingCode);
    }
}