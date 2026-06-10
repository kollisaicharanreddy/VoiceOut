package com.voiceout.service;

import com.voiceout.dto.AddInvitationsRequest;
import com.voiceout.dto.QuestionDTO;
import com.voiceout.dto.SurveyCreateRequest;
import com.voiceout.dto.SurveyDetailsResponse;
import com.voiceout.dto.SurveySubmitRequest;
import com.voiceout.dto.SurveyTokenResponse;
import com.voiceout.dto.SurveyVerificationResponse;
import com.voiceout.model.SurveyResponse;
import com.voiceout.model.SurveyToken;
import com.voiceout.repository.SurveyResponseRepository;
import com.voiceout.repository.SurveyTokenRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
public class SurveyServiceTest {

    @Autowired
    private SurveyService surveyService;

    @Autowired
    private SurveyTokenRepository surveyTokenRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    @Test
    public void testCreateVerifyAndSubmitFeedback() {
        // 1. Create survey with complex question types
        QuestionDTO q1 = new QuestionDTO("How is the training?", "DESCRIPTIVE", List.of());
        QuestionDTO q2 = new QuestionDTO("Select topics you liked", "MULTIPLE_CHOICE", List.of("JPA", "Security", "REST"));
        QuestionDTO q3 = new QuestionDTO("Rate pace from 1 to 5", "NUMBER", List.of());

        SurveyCreateRequest createRequest = new SurveyCreateRequest(
                "Training Feedback",
                "Description test",
                List.of(q1, q2, q3),
                List.of("user1@example.com")
        );
        SurveyDetailsResponse details = surveyService.createSurvey(createRequest);
        assertNotNull(details.id());
        assertEquals("Training Feedback", details.title());
        assertEquals(3, details.questions().size());
        assertEquals("MULTIPLE_CHOICE", details.questions().get(1).type());
        assertEquals(3, details.questions().get(1).options().size());
        assertEquals(1, details.tokens().size());

        String tokenVal1 = details.tokens().get(0).token();
        assertEquals("user1@example.com", details.tokens().get(0).email());

        // 2. Add an additional invitation post-creation
        AddInvitationsRequest addInvitesRequest = new AddInvitationsRequest(List.of("user2@example.com"));
        List<SurveyTokenResponse> addedTokens = surveyService.addInvitations(details.id(), addInvitesRequest);
        assertEquals(1, addedTokens.size());
        String tokenVal2 = addedTokens.get(0).token();
        assertEquals("user2@example.com", addedTokens.get(0).email());

        // 3. Verify token 2
        SurveyVerificationResponse verifyResponse = surveyService.verifyToken(tokenVal2);
        assertTrue(verifyResponse.valid());
        assertEquals(details.id(), verifyResponse.surveyId());
        assertEquals("Training Feedback", verifyResponse.surveyTitle());
        assertEquals(3, verifyResponse.questions().size());
        assertEquals("Rate pace from 1 to 5", verifyResponse.questions().get(2).text());

        // 4. Submit feedback for token 2
        SurveySubmitRequest submitRequest = new SurveySubmitRequest(
                tokenVal2,
                List.of("Pace was excellent", "JPA, Security", "5")
        );
        surveyService.submitSurvey(submitRequest);

        // 5. Verify token 2 is now invalid/used
        SurveyVerificationResponse verifyAfterSubmit = surveyService.verifyToken(tokenVal2);
        assertFalse(verifyAfterSubmit.valid());

        // Check token entity is marked used
        SurveyToken tokenEntity = surveyTokenRepository.findByToken(tokenVal2).orElseThrow();
        assertTrue(tokenEntity.isUsed());

        // Check response is stored anonymously
        List<SurveyResponse> responses = surveyResponseRepository.findAllBySurveyIdOrderBySubmittedAtDesc(details.id());
        assertEquals(1, responses.size());
        assertEquals(3, responses.get(0).getAnswers().size());
        assertEquals("Pace was excellent", responses.get(0).getAnswers().get(0));
        assertEquals("JPA, Security", responses.get(0).getAnswers().get(1));
        assertEquals("5", responses.get(0).getAnswers().get(2));
    }
}
