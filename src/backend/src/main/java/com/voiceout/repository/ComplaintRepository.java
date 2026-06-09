package com.voiceout.repository;

import com.voiceout.model.Complaint;
import com.voiceout.model.ComplaintStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    Optional<Complaint> findByTrackingCode(String trackingCode);

    boolean existsByTrackingCode(String trackingCode);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findAllByStatusOrderByCreatedAtDesc(ComplaintStatus status);
}