package com.voiceout.service;

import com.voiceout.dto.ComplaintCreateRequest;
import com.voiceout.dto.ComplaintCreateResponse;
import com.voiceout.model.Complaint;
import com.voiceout.model.EnrichmentStatus;
import com.voiceout.repository.ComplaintRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ComplaintEnrichmentServiceTest {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Test
    public void testCreateAndEnrichComplaintEndToEnd() {
        ComplaintCreateRequest request = new ComplaintCreateRequest(
                "I would like to report ongoing harassment by a colleague in the workplace."
        );
        ComplaintCreateResponse response = complaintService.createComplaint(request, "test-client");
        assertNotNull(response.trackingCode());

        // Wait for the async enrichment to complete
        Complaint complaint = null;
        for (int i = 0; i < 50; i++) {
            Optional<Complaint> complaintOpt = complaintRepository.findByTrackingCode(response.trackingCode());
            if (complaintOpt.isPresent() && complaintOpt.get().getEnrichmentStatus() != EnrichmentStatus.PENDING) {
                complaint = complaintOpt.get();
                break;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        assertNotNull(complaint, "Complaint was not found or enrichment remained PENDING");
        assertEquals(EnrichmentStatus.DONE, complaint.getEnrichmentStatus());
        assertEquals("harassment", complaint.getAiCategory());
        assertNotNull(complaint.getAiSummary());
        assertNotNull(complaint.getAiConfidence());
        assertTrue(complaint.getAiConfidence() > 0);
    }
}
