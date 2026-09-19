package com.alphaq.gaming.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Strongly-typed binding for the `alphaq.*` settings in application.yml. */
@ConfigurationProperties(prefix = "alphaq")
public class AppProperties {

    private final Cors cors = new Cors();
    private final Jwt jwt = new Jwt();
    private final Otp otp = new Otp();

    public Cors getCors() { return cors; }
    public Jwt getJwt() { return jwt; }
    public Otp getOtp() { return otp; }

    public static class Cors {
        private String allowedOrigins = "http://localhost:4200";
        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String v) { this.allowedOrigins = v; }
    }

    public static class Jwt {
        private String secret;
        private long ttlMinutes = 720;
        public String getSecret() { return secret; }
        public void setSecret(String v) { this.secret = v; }
        public long getTtlMinutes() { return ttlMinutes; }
        public void setTtlMinutes(long v) { this.ttlMinutes = v; }
    }

    public static class Otp {
        private int length = 6;
        private int ttlSeconds = 300;
        private int maxAttempts = 5;
        private int resendCooldownSeconds = 30;
        private int maxPerHour = 6;
        private String provider = "mock";
        // DEV ONLY: when true AND provider=mock, the OTP is returned in the API
        // response so the UI can auto-fill it. Never enable with a real provider.
        private boolean exposeInResponse = true;
        private final Msg91 msg91 = new Msg91();
        public Msg91 getMsg91() { return msg91; }
        private final TextBee textbee = new TextBee();
        public TextBee getTextbee() { return textbee; }
        public int getLength() { return length; }
        public void setLength(int v) { this.length = v; }
        public int getTtlSeconds() { return ttlSeconds; }
        public void setTtlSeconds(int v) { this.ttlSeconds = v; }
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int v) { this.maxAttempts = v; }
        public int getResendCooldownSeconds() { return resendCooldownSeconds; }
        public void setResendCooldownSeconds(int v) { this.resendCooldownSeconds = v; }
        public int getMaxPerHour() { return maxPerHour; }
        public void setMaxPerHour(int v) { this.maxPerHour = v; }
        public String getProvider() { return provider; }
        public void setProvider(String v) { this.provider = v; }
        public boolean isExposeInResponse() { return exposeInResponse; }
        public void setExposeInResponse(boolean v) { this.exposeInResponse = v; }

        /** MSG91 (Indian SMS gateway) settings — used only when provider=msg91. */
        public static class Msg91 {
            private String authKey = "";       // MSG91 auth key (secret)
            private String templateId = "";     // DLT-approved OTP template id
            private String senderId = "ALPHAQ"; // 6-char DLT sender id
            private String baseUrl = "https://control.msg91.com/api/v5/otp";
            public String getAuthKey() { return authKey; }
            public void setAuthKey(String v) { this.authKey = v; }
            public String getTemplateId() { return templateId; }
            public void setTemplateId(String v) { this.templateId = v; }
            public String getSenderId() { return senderId; }
            public void setSenderId(String v) { this.senderId = v; }
            public String getBaseUrl() { return baseUrl; }
            public void setBaseUrl(String v) { this.baseUrl = v; }
        }

        /** TextBee (Android-phone SMS gateway) settings — used only when provider=textbee. */
        public static class TextBee {
            private String apiKey = "";                              // TextBee API key (secret)
            private String deviceId = "";                            // paired device id from the dashboard
            private String baseUrl = "https://api.textbee.dev/api/v1"; // override if your dashboard differs
            private String defaultCountryCode = "91";                // prefixed to 10-digit numbers
            private int simSubscriptionId = -1;                      // which SIM slot to send from; -1 = phone default
            public String getApiKey() { return apiKey; }
            public void setApiKey(String v) { this.apiKey = v; }
            public String getDeviceId() { return deviceId; }
            public void setDeviceId(String v) { this.deviceId = v; }
            public String getBaseUrl() { return baseUrl; }
            public void setBaseUrl(String v) { this.baseUrl = v; }
            public String getDefaultCountryCode() { return defaultCountryCode; }
            public void setDefaultCountryCode(String v) { this.defaultCountryCode = v; }
            public int getSimSubscriptionId() { return simSubscriptionId; }
            public void setSimSubscriptionId(int v) { this.simSubscriptionId = v; }
        }
    }
}
