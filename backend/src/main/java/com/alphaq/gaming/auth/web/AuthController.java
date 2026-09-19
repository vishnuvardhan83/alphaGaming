package com.alphaq.gaming.auth.web;

import com.alphaq.gaming.auth.dto.AuthDtos.*;
import com.alphaq.gaming.auth.service.AuthService;
import com.alphaq.gaming.common.error.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** Public authentication endpoints (register, login, password recovery) + /me. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register/request-otp")
    public OtpSentResponse requestRegisterOtp(@Valid @RequestBody MobileRequest req) {
        return authService.startRegistration(req.mobile());
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/forgot-password/request-otp")
    public OtpSentResponse requestResetOtp(@Valid @RequestBody MobileRequest req) {
        return authService.startPasswordReset(req.mobile());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserSummary me(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw ApiException.unauthorized("Not authenticated.");
        }
        return authService.currentUser(auth.getName());
    }
}
