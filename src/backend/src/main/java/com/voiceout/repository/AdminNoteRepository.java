package com.voiceout.repository;

import com.voiceout.model.AdminNote;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminNoteRepository extends JpaRepository<AdminNote, UUID> {
    List<AdminNote> findAllByComplaint_IdOrderByCreatedAtDesc(UUID complaintId);
}