package com.alphaq.gaming.auth.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Local/dev OTP delivery — logs the code to the server console instead of
 * sending an SMS. Clearly a mock (master prompt §18); replace with a real
 * authorised SMS provider in production by setting alphaq.otp.provider.
 */
@Component
@ConditionalOnProperty(name = "alphaq.otp.provider", havingValue = "mock", matchIfMissing = true)
public class MockOtpProvider implements OtpProvider {

    private static final Logger log = LoggerFactory.getLogger(MockOtpProvider.class);

    @Override
    public void send(String mobile, String code, String purpose) {
        log.info("╔═══════════════════════════════════════════════╗");
        log.info("║  [MOCK OTP]  {} → {}  (code: {})", purpose, mobile, code);
        log.info("║  Dev only — no real SMS sent.                 ║");
        log.info("╚═══════════════════════════════════════════════╝");
    }
}
