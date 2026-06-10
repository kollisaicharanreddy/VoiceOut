package com.voiceout.controller;

import com.voiceout.dto.AddInvitationsRequest;
import com.voiceout.dto.SurveyCreateRequest;
import com.voiceout.dto.SurveyDetailsResponse;
import com.voiceout.dto.SurveySummaryResponse;
import com.voiceout.dto.SurveyTokenResponse;
import com.voiceout.service.SurveyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/surveys")
public class AdminSurveyController {

    private final SurveyService surveyService;

    public AdminSurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SurveyDetailsResponse createSurvey(@Valid @RequestBody SurveyCreateRequest request) {
        return surveyService.createSurvey(request);
    }

    @GetMapping
    public List<SurveySummaryResponse> listSurveys() {
        return surveyService.listSurveys();
    }

    @GetMapping("/{surveyId}")
    public SurveyDetailsResponse getSurveyDetails(@PathVariable UUID surveyId) {
        return surveyService.getSurveyDetails(surveyId);
    }

    @PostMapping("/{surveyId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public List<SurveyTokenResponse> addInvitations(
            @PathVariable UUID surveyId,
            @Valid @RequestBody AddInvitationsRequest request) {
        return surveyService.addInvitations(surveyId, request);
    }
}
