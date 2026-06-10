package com.voiceout.service;

import com.voiceout.dto.*;
import com.voiceout.model.*;
import com.voiceout.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final SurveyTokenRepository surveyTokenRepository;
    private final SurveyResponseRepository surveyResponseRepository;

    @Value("${voiceout.frontend-origin:http://localhost:5173}")
    private String frontendOrigin;

    public SurveyService(
            SurveyRepository surveyRepository,
            SurveyTokenRepository surveyTokenRepository,
            SurveyResponseRepository surveyResponseRepository) {
        this.surveyRepository = surveyRepository;
        this.surveyTokenRepository = surveyTokenRepository;
        this.surveyResponseRepository = surveyResponseRepository;
    }

    @Transactional
    public SurveyDetailsResponse createSurvey(SurveyCreateRequest request) {
        Survey survey = new Survey();
        survey.setTitle(request.title().trim());
        survey.setDescription(request.description() != null ? request.description().trim() : "");
        
        List<SurveyQuestion> questionsList = new ArrayList<>();
        int order = 0;
        for (QuestionDTO qDto : request.questions()) {
            SurveyQuestion q = new SurveyQuestion();
            q.setSurvey(survey);
            q.setText(qDto.text().trim());
            q.setType(qDto.type().trim());
            q.setOptions(qDto.options() != null ? qDto.options() : new ArrayList<>());
            q.setOrder(order++);
            questionsList.add(q);
        }
        survey.setQuestions(questionsList);
        surveyRepository.save(survey);

        List<SurveyTokenResponse> tokenResponses = new ArrayList<>();
        for (String email : request.emails()) {
            String cleanEmail = email.trim();
            if (cleanEmail.isEmpty()) {
                continue;
            }

            SurveyToken token = new SurveyToken();
            token.setSurveyId(survey.getId());
            token.setEmail(cleanEmail);
            token.setToken(UUID.randomUUID().toString());
            token.setUsed(false);
            surveyTokenRepository.save(token);

            String link = frontendOrigin + "/?surveyToken=" + token.getToken();
            
            System.out.println("----------------------------------------");
            System.out.println("SIMULATION: Sending Survey Link to: " + cleanEmail);
            System.out.println("Link: " + link);
            System.out.println("----------------------------------------");

            tokenResponses.add(new SurveyTokenResponse(
                    token.getId(),
                    token.getEmail(),
                    token.getToken(),
                    token.isUsed(),
                    link
            ));
        }

        List<QuestionDTO> questionDtos = survey.getQuestions().stream().map(q -> new QuestionDTO(
                q.getText(),
                q.getType(),
                q.getOptions()
        )).toList();

        return new SurveyDetailsResponse(
                survey.getId(),
                survey.getTitle(),
                survey.getDescription(),
                questionDtos,
                survey.getCreatedAt(),
                tokenResponses,
                new ArrayList<>()
        );
    }

    @Transactional
    public List<SurveyTokenResponse> addInvitations(UUID surveyId, AddInvitationsRequest request) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not found"));

        List<SurveyTokenResponse> tokenResponses = new ArrayList<>();
        for (String email : request.emails()) {
            String cleanEmail = email.trim();
            if (cleanEmail.isEmpty()) {
                continue;
            }

            SurveyToken token = new SurveyToken();
            token.setSurveyId(survey.getId());
            token.setEmail(cleanEmail);
            token.setToken(UUID.randomUUID().toString());
            token.setUsed(false);
            surveyTokenRepository.save(token);

            String link = frontendOrigin + "/?surveyToken=" + token.getToken();
            
            System.out.println("----------------------------------------");
            System.out.println("SIMULATION: Sending Additional Survey Link to: " + cleanEmail);
            System.out.println("Link: " + link);
            System.out.println("----------------------------------------");

            tokenResponses.add(new SurveyTokenResponse(
                    token.getId(),
                    token.getEmail(),
                    token.getToken(),
                    token.isUsed(),
                    link
            ));
        }
        return tokenResponses;
    }

    @Transactional(readOnly = true)
    public List<SurveySummaryResponse> listSurveys() {
        List<Survey> surveys = surveyRepository.findAll();
        List<SurveySummaryResponse> summaryResponses = new ArrayList<>();
        for (Survey survey : surveys) {
            long responseCount = surveyResponseRepository.countBySurveyId(survey.getId());
            int inviteCount = surveyTokenRepository.findAllBySurveyId(survey.getId()).size();
            summaryResponses.add(new SurveySummaryResponse(
                    survey.getId(),
                    survey.getTitle(),
                    survey.getDescription(),
                    (int) responseCount,
                    inviteCount,
                    survey.getCreatedAt()
            ));
        }
        return summaryResponses;
    }

    @Transactional(readOnly = true)
    public SurveyDetailsResponse getSurveyDetails(UUID surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not found"));

        List<SurveyToken> tokens = surveyTokenRepository.findAllBySurveyId(surveyId);
        List<SurveyTokenResponse> tokenResponses = tokens.stream().map(t -> new SurveyTokenResponse(
                t.getId(),
                t.getEmail(),
                t.getToken(),
                t.isUsed(),
                frontendOrigin + "/?surveyToken=" + t.getToken()
        )).toList();

        List<SurveyResponse> responses = surveyResponseRepository.findAllBySurveyIdOrderBySubmittedAtDesc(surveyId);
        List<SurveyResponseView> responseViews = responses.stream().map(r -> new SurveyResponseView(
                r.getId(),
                r.getAnswers(),
                r.getSubmittedAt()
        )).toList();

        List<QuestionDTO> questionDtos = survey.getQuestions().stream().map(q -> new QuestionDTO(
                q.getText(),
                q.getType(),
                q.getOptions()
        )).toList();

        return new SurveyDetailsResponse(
                survey.getId(),
                survey.getTitle(),
                survey.getDescription(),
                questionDtos,
                survey.getCreatedAt(),
                tokenResponses,
                responseViews
        );
    }

    @Transactional(readOnly = true)
    public SurveyVerificationResponse verifyToken(String tokenValue) {
        SurveyToken token = surveyTokenRepository.findByToken(tokenValue)
                .orElse(null);

        if (token == null || token.isUsed()) {
            return new SurveyVerificationResponse(false, null, null, null, null);
        }

        Survey survey = surveyRepository.findById(token.getSurveyId()).orElse(null);
        if (survey == null) {
            return new SurveyVerificationResponse(false, null, null, null, null);
        }

        List<QuestionDTO> questionDtos = survey.getQuestions().stream().map(q -> new QuestionDTO(
                q.getText(),
                q.getType(),
                q.getOptions()
        )).toList();

        return new SurveyVerificationResponse(
                true,
                survey.getId(),
                survey.getTitle(),
                survey.getDescription(),
                questionDtos
        );
    }

    @Transactional
    public void submitSurvey(SurveySubmitRequest request) {
        SurveyToken token = surveyTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token is invalid"));

        if (token.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This token has already been used to submit feedback");
        }

        Survey survey = surveyRepository.findById(token.getSurveyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Survey not found"));

        SurveyResponse response = new SurveyResponse();
        response.setSurveyId(survey.getId());
        response.setAnswers(request.answers());
        surveyResponseRepository.save(response);

        token.setUsed(true);
        surveyTokenRepository.save(token);
    }
}
