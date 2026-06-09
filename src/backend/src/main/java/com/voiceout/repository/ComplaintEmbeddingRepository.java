package com.voiceout.repository;

import com.voiceout.model.ComplaintEmbedding;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintEmbeddingRepository extends JpaRepository<ComplaintEmbedding, UUID> {
    Optional<ComplaintEmbedding> findByComplaint_Id(UUID complaintId);
}