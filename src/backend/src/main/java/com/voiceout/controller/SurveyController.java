package com.voiceout.controller;

import com.voiceout.dto.SurveySubmitRequest;
import com.voiceout.dto.SurveyVerificationResponse;
import com.voiceout.service.SurveyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    private final SurveyService surveyService;

    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @GetMapping("/verify")
    public SurveyVerificationResponse verifyToken(@RequestParam String token) {
        return surveyService.verifyToken(token);
    }

    @PostMapping("/submit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submitSurvey(@Valid @RequestBody SurveySubmitRequest request) {
        surveyService.submitSurvey(request);
    }
}
