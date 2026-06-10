package com.voiceout.repository;

import com.voiceout.model.SurveyToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SurveyTokenRepository extends JpaRepository<SurveyToken, UUID> {
    Optional<SurveyToken> findByToken(String token);
    List<SurveyToken> findAllBySurveyId(UUID surveyId);
}
