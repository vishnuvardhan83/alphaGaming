package com.alphaq.gaming.auth.otp;

import com.alphaq.gaming.common.error.ApiException;
import com.alphaq.gaming.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Real SMS delivery via TextBee (an Android phone acting as an SMS gateway).
 *
 * ─── TO ACTIVATE ────────────────────────────────────────────────────────────
 *  1. Pair your Android phone in the TextBee dashboard → copy the Device ID and API Key.
 *  2. Set env vars (never commit them):
 *        OTP_PROVIDER=textbee
 *        TEXTBEE_API_KEY=your_api_key
 *        TEXTBEE_DEVICE_ID=your_device_id
 *        OTP_EXPOSE_IN_RESPONSE=false     # stop returning the code in the API
 *  3. Restart the backend — this bean replaces MockOtpProvider automatically.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * API shape (TextBee v1): POST {baseUrl}/gateway/devices/{deviceId}/send-sms
 *   header: x-api-key: <apiKey>
 *   body:   { "recipients": ["+91XXXXXXXXXX"], "message": "..." }
 */
@Component
@ConditionalOnProperty(name = "alphaq.otp.provider", havingValue = "textbee")
public class TextBeeOtpProvider implements OtpProvider {

    private static final Logger log = LoggerFactory.getLogger(TextBeeOtpProvider.class);

    private final AppProperties.Otp.TextBee cfg;
    private final RestClient http;

    public TextBeeOtpProvider(AppProperties props) {
        this.cfg = props.getOtp().getTextbee();
        this.http = RestClient.builder().baseUrl(cfg.getBaseUrl()).build();
        if (cfg.getApiKey().isBlank() || cfg.getDeviceId().isBlank()) {
            log.warn("TextBee provider selected but apiKey/deviceId are empty — SMS will fail until configured.");
        }
    }

    @Override
    public void send(String mobile, String code, String purpose) {
        String recipient = toE164(mobile);
        String message = "Your AlphaQ verification code is " + code
                + ". Valid for 5 minutes. Please do not share this code.";
        Map<String, Object> body = new HashMap<>();
        body.put("recipients", List.of(recipient));
        body.put("message", message);
        // Force a specific SIM slot when configured (e.g. dual-SIM phones).
        if (cfg.getSimSubscriptionId() >= 0) {
            body.put("simSubscriptionId", cfg.getSimSubscriptionId());
        }
        try {
            http.post()
                .uri("/gateway/devices/{deviceId}/send-sms", cfg.getDeviceId())
                .header("x-api-key", cfg.getApiKey())
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .toBodilessEntity();
            log.info("TextBee OTP dispatched to {} via SIM {} ({})", recipient, cfg.getSimSubscriptionId(), purpose);
        } catch (Exception ex) {
            log.error("TextBee OTP send failed for {}: {}", recipient, ex.getMessage());
            throw ApiException.badRequest("Could not send OTP right now. Please try again shortly.");
        }
    }

    /** Ensure the number is in +<country><number> form for the gateway. */
    private String toE164(String mobile) {
        String m = mobile == null ? "" : mobile.replaceAll("\\s+", "");
        if (m.startsWith("+")) return m;
        if (m.length() == 10) return "+" + cfg.getDefaultCountryCode() + m;   // 10-digit local
        return "+" + m;                                                       // already has country code
    }
}
