package com.alphaq.gaming.auth.service;

import com.alphaq.gaming.auth.dto.AuthDtos.*;
import com.alphaq.gaming.auth.entity.Role;
import com.alphaq.gaming.auth.entity.User;
import com.alphaq.gaming.auth.otp.OtpService;
import com.alphaq.gaming.auth.repo.RoleRepository;
import com.alphaq.gaming.auth.repo.UserRepository;
import com.alphaq.gaming.auth.security.JwtService;
import com.alphaq.gaming.common.audit.AuditService;
import com.alphaq.gaming.common.error.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private static final String PURPOSE_REGISTER = "REGISTER";
    private static final String PURPOSE_RESET = "PASSWORD_RESET";
    private static final String DEFAULT_ROLE = "CUSTOMER";

    private final UserRepository users;
    private final RoleRepository roles;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public AuthService(UserRepository users, RoleRepository roles, OtpService otpService,
                       JwtService jwtService, PasswordEncoder encoder, AuditService audit) {
        this.users = users;
        this.roles = roles;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.encoder = encoder;
        this.audit = audit;
    }

    // ---- Registration ------------------------------------------------------

    @Transactional
    public OtpSentResponse startRegistration(String rawMobile) {
        String mobile = normalize(rawMobile);
        if (users.existsByMobile(mobile)) {
            throw ApiException.conflict("This mobile number is already registered. Try logging in.");
        }
        var res = otpService.issue(mobile, PURPOSE_REGISTER);
        return new OtpSentResponse("OTP sent to " + mask(mobile) + ".", res.ttlSeconds(), res.devCode());
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String mobile = normalize(req.mobile());
        if (users.existsByMobile(mobile)) {
            throw ApiException.conflict("This mobile number is already registered.");
        }
        if (users.existsByUsername(req.username())) {
            throw ApiException.conflict("That username is taken. Please choose another.");
        }
        String email = normalizeEmail(req.email());
        if (email != null && users.existsByEmail(email)) {
            throw ApiException.conflict("That email is already in use.");
        }

        otpService.verify(mobile, PURPOSE_REGISTER, req.otp());

        Role role = roles.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> ApiException.badRequest("Default role missing. Contact support."));

        User user = new User();
        user.setMobile(mobile);
        user.setUsername(req.username());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setMobileVerified(true);
        user.addRole(role);
        users.save(user);

        audit.record(user.getUsername(), "AUTH_REGISTER", "User", "id=" + user.getId());
        return buildAuthResponse(user);
    }

    // ---- Login -------------------------------------------------------------

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String id = req.identifier().trim();
        User user = users.findByUsernameOrMobile(id, normalize(id))
                .orElseThrow(() -> ApiException.unauthorized("Invalid username/mobile or password."));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid username/mobile or password.");
        }
        if (!"ACTIVE".equals(user.getStatus())) {
            throw ApiException.unauthorized("This account is not active. Contact support.");
        }
        audit.record(user.getUsername(), "AUTH_LOGIN", "User", "id=" + user.getId());
        return buildAuthResponse(user);
    }

    // ---- Password recovery -------------------------------------------------

    @Transactional
    public OtpSentResponse startPasswordReset(String rawMobile) {
        String mobile = normalize(rawMobile);
        // Do not reveal whether the number exists; only send if it does.
        String devOtp = null;
        var existing = users.findByMobile(mobile);
        if (existing.isPresent()) {
            devOtp = otpService.issue(mobile, PURPOSE_RESET).devCode();
        }
        return new OtpSentResponse(
                "If that mobile is registered, an OTP has been sent.", 300, devOtp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String mobile = normalize(req.mobile());
        User user = users.findByMobile(mobile)
                .orElseThrow(() -> ApiException.badRequest("Please request a new OTP."));
        otpService.verify(mobile, PURPOSE_RESET, req.otp());
        user.setPasswordHash(encoder.encode(req.newPassword()));
        audit.record(user.getUsername(), "AUTH_PASSWORD_RESET", "User", "id=" + user.getId());
    }

    // ---- Current user ------------------------------------------------------

    @Transactional(readOnly = true)
    public UserSummary currentUser(String username) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Session expired. Please log in again."));
        return toSummary(user);
    }

    // ---- Helpers -----------------------------------------------------------

    private AuthResponse buildAuthResponse(User user) {
        List<String> roleNames = user.getRoles().stream().map(Role::getName).toList();
        String token = jwtService.issue(user.getId(), user.getUsername(), roleNames);
        return new AuthResponse(token, "Bearer", jwtService.getTtlMinutes(), toSummary(user));
    }

    private UserSummary toSummary(User user) {
        return new UserSummary(user.getId(), user.getUsername(), user.getMobile(), user.getEmail(),
                user.getRoles().stream().map(Role::getName).toList());
    }

    private String normalize(String mobile) {
        return mobile == null ? null : mobile.replaceAll("\\s+", "");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim().toLowerCase();
    }

    private String mask(String mobile) {
        if (mobile.length() < 4) return "****";
        return "*".repeat(mobile.length() - 4) + mobile.substring(mobile.length() - 4);
    }
}
