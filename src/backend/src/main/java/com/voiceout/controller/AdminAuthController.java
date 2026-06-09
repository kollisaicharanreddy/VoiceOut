package com.voiceout.controller;

import com.voiceout.dto.AdminLoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.MediaType;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    private final AuthenticationManager authenticationManager;
    private final org.springframework.security.web.context.SecurityContextRepository securityContextRepository =
            new org.springframework.security.web.context.HttpSessionSecurityContextRepository();

    public AdminAuthController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(request.username(), request.password());
        try {
            System.out.println("DEBUG: Login attempt for username: " + request.username() + ", password length: " + (request.password() != null ? request.password().length() : 0));
            Authentication auth = authenticationManager.authenticate(token);
            
            org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            // ensure session is created
            httpRequest.getSession(true);
            System.out.println("DEBUG: Login successful for user: " + request.username());
            return ResponseEntity.ok().build();
        } catch (AuthenticationException ex) {
            System.err.println("DEBUG: Authentication failed for user: " + request.username() + ", error: " + ex.getMessage());
            ex.printStackTrace();
            // Return 401 with JSON body for failed login attempts
            Map<String, String> body = Map.of("error", "Unauthorized", "message", ex.getMessage());
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).contentType(MediaType.APPLICATION_JSON).body(body);
        }
    }
}
