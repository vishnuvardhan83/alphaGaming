package com.alphaq.gaming.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Auth request/response payloads. Grouped for brevity; each is a validated record. */
public final class AuthDtos {

    private AuthDtos() { }

    private static final String MOBILE_RE = "^\\+?[0-9]{10,15}$";
    private static final String USERNAME_RE = "^[A-Za-z0-9_.]{3,40}$";

    public record MobileRequest(
            @NotBlank @Pattern(regexp = MOBILE_RE, message = "Enter a valid mobile number.")
            String mobile
    ) {}

    public record RegisterRequest(
            @NotBlank @Pattern(regexp = MOBILE_RE, message = "Enter a valid mobile number.")
            String mobile,
            @NotBlank @Size(min = 4, max = 8, message = "Enter the OTP sent to your mobile.")
            String otp,
            @NotBlank @Pattern(regexp = USERNAME_RE, message = "3–40 letters, numbers, dot or underscore.")
            String username,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be at least 8 characters.")
            String password,
            @Email(message = "Enter a valid email.") String email
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Enter your username or mobile.") String identifier,
            @NotBlank(message = "Enter your password.") String password
    ) {}

    public record ResetPasswordRequest(
            @NotBlank @Pattern(regexp = MOBILE_RE, message = "Enter a valid mobile number.")
            String mobile,
            @NotBlank @Size(min = 4, max = 8) String otp,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be at least 8 characters.")
            String newPassword
    ) {}

    // devOtp is populated only in dev (mock provider + expose flag) so the UI can auto-fill it.
    public record OtpSentResponse(String message, int expiresInSeconds, String devOtp) {}

    public record UserSummary(Long id, String username, String mobile, String email, List<String> roles) {}

    public record AuthResponse(String token, String tokenType, long expiresInMinutes, UserSummary user) {}
}
