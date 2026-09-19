package com.alphaq.gaming.auth.otp;

/**
 * Delivery channel for a one-time code. Business code never calls an SMS SDK
 * directly (master prompt §5/§6) — it goes through this abstraction so the
 * provider can be swapped without touching auth logic.
 */
public interface OtpProvider {
    void send(String mobile, String code, String purpose);
}
