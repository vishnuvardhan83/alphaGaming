package com.alphaq.gaming.auth.otp;

import com.alphaq.gaming.common.error.ApiException;
import com.alphaq.gaming.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Real SMS delivery via MSG91 (recommended for Indian numbers / Indore latency).
 *
 * ─── TO ACTIVATE ────────────────────────────────────────────────────────────
 *  1. Get a free MSG91 account → Auth Key, and create a DLT-approved OTP
 *     template → Template ID.
 *  2. Set env vars (never commit them):
 *        OTP_PROVIDER=msg91
 *        MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxx
 *        MSG91_TEMPLATE_ID=xxxxxxxxxxxxxxxxxx
 *  3. Add to application.yml under alphaq.otp (already scaffolded there as
 *     commented keys) OR just rely on the env vars above.
 *  4. Restart — this bean replaces MockOtpProvider automatically. Also set
 *     alphaq.otp.expose-in-response=false so the code is no longer returned.
 * ────────────────────────────────────────────────────────────────────────────
 */
@Component
@ConditionalOnProperty(name = "alphaq.otp.provider", havingValue = "msg91")
public class Msg91OtpProvider implements OtpProvider {

    private static final Logger log = LoggerFactory.getLogger(Msg91OtpProvider.class);

    private final AppProperties.Otp.Msg91 cfg;
    private final RestClient http;

    public Msg91OtpProvider(AppProperties props) {
        this.cfg = props.getOtp().getMsg91();
        this.http = RestClient.builder().baseUrl(cfg.getBaseUrl()).build();
        if (cfg.getAuthKey().isBlank() || cfg.getTemplateId().isBlank()) {
            log.warn("MSG91 provider selected but authKey/templateId are empty — SMS will fail until configured.");
        }
    }

    @Override
    public void send(String mobile, String code, String purpose) {
        // MSG91 v5 OTP API: passing `otp` sends *our* generated code (single source of truth).
        // Number must include the country code (India = 91) and no leading '+'.
        String recipient = mobile.startsWith("91") ? mobile : "91" + mobile.replaceFirst("^\\+", "");
        try {
            http.post()
                .uri(uri -> uri
                    .queryParam("template_id", cfg.getTemplateId())
                    .queryParam("mobile", recipient)
                    .queryParam("otp", code)
                    .queryParam("sender", cfg.getSenderId())
                    .build())
                .header("authkey", cfg.getAuthKey())
                .header("accept", "application/json")
                .retrieve()
                .toBodilessEntity();
            log.info("MSG91 OTP dispatched for {} ({})", recipient, purpose);
        } catch (Exception ex) {
            log.error("MSG91 OTP send failed for {}: {}", recipient, ex.getMessage());
            throw ApiException.badRequest("Could not send OTP right now. Please try again shortly.");
        }
    }
}
