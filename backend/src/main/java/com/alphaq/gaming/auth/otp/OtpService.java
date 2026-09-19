package com.alphaq.gaming.auth.otp;

import com.alphaq.gaming.auth.entity.OtpRequest;
import com.alphaq.gaming.auth.repo.OtpRequestRepository;
import com.alphaq.gaming.common.error.ApiException;
import com.alphaq.gaming.config.AppProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Issues and verifies one-time codes with expiry, attempt limits, resend
 * cooldown and per-hour rate limiting (master prompt §6). Codes are stored
 * hashed and never returned to the client.
 */
@Service
public class OtpService {

    private final OtpRequestRepository repo;
    private final OtpProvider provider;
    private final PasswordEncoder encoder;
    private final AppProperties.Otp cfg;
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpRequestRepository repo, OtpProvider provider,
                      PasswordEncoder encoder, AppProperties props) {
        this.repo = repo;
        this.provider = provider;
        this.encoder = encoder;
        this.cfg = props.getOtp();
    }

    /** Result of issuing an OTP. devCode is non-null only in dev (mock + expose). */
    public record IssueResult(int ttlSeconds, String devCode) {}

    /** Generate, persist (hashed) and dispatch a code. */
    @Transactional
    public IssueResult issue(String mobile, String purpose) {
        Instant now = Instant.now();

        long lastHour = repo.countByMobileAndPurposeAndCreatedAtAfter(
                mobile, purpose, now.minus(1, ChronoUnit.HOURS));
        if (lastHour >= cfg.getMaxPerHour()) {
            throw ApiException.tooMany("Too many OTP requests. Please try again later.");
        }

        repo.findFirstByMobileAndPurposeAndConsumedFalseOrderByCreatedAtDesc(mobile, purpose)
            .ifPresent(existing -> {
                long age = now.getEpochSecond() - existing.getCreatedAt().getEpochSecond();
                if (age < cfg.getResendCooldownSeconds()) {
                    throw ApiException.tooMany("Please wait a moment before requesting another code.");
                }
                existing.setConsumed(true); // supersede the previous unconsumed code
            });

        String code = generateCode();
        OtpRequest otp = new OtpRequest();
        otp.setMobile(mobile);
        otp.setPurpose(purpose);
        otp.setCodeHash(encoder.encode(code));
        otp.setExpiresAt(now.plusSeconds(cfg.getTtlSeconds()));
        repo.save(otp);

        provider.send(mobile, code, purpose);

        boolean expose = cfg.isExposeInResponse() && "mock".equalsIgnoreCase(cfg.getProvider());
        return new IssueResult(cfg.getTtlSeconds(), expose ? code : null);
    }

    /** Verify a submitted code; consumes it on success. Throws on any failure. */
    @Transactional
    public void verify(String mobile, String purpose, String code) {
        OtpRequest otp = repo
                .findFirstByMobileAndPurposeAndConsumedFalseOrderByCreatedAtDesc(mobile, purpose)
                .orElseThrow(() -> ApiException.badRequest("Please request a new OTP."));

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            otp.setConsumed(true);
            throw ApiException.badRequest("This OTP has expired. Request a new one.");
        }
        if (otp.getAttempts() >= cfg.getMaxAttempts()) {
            otp.setConsumed(true);
            throw ApiException.tooMany("Too many incorrect attempts. Request a new OTP.");
        }
        if (!encoder.matches(code, otp.getCodeHash())) {
            otp.setAttempts(otp.getAttempts() + 1);
            throw ApiException.badRequest("Incorrect OTP. Please check and try again.");
        }
        otp.setConsumed(true); // single-use
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, cfg.getLength());
        int min = (int) Math.pow(10, cfg.getLength() - 1);
        int value = min + random.nextInt(bound - min);
        return String.valueOf(value);
    }
}
