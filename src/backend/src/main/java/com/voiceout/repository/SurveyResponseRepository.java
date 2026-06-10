package com.voiceout.repository;

import com.voiceout.model.SurveyResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, UUID> {
    List<SurveyResponse> findAllBySurveyIdOrderBySubmittedAtDesc(UUID surveyId);
    long countBySurveyId(UUID surveyId);
}
