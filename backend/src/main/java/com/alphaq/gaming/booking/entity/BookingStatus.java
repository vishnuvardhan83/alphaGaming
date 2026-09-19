package com.alphaq.gaming.booking.entity;

import java.util.Set;

/** Booking lifecycle (blueprint §05). */
public enum BookingStatus {
    AWAITING_PAYMENT,   // hold placed, payment pending (occupies capacity only until hold_expires_at)
    PAYMENT_RECEIVED,   // server-verified payment
    PENDING_APPROVAL,   // awaiting manual admin confirmation
    CONFIRMED,
    CHECKED_IN,
    ACTIVE,
    COMPLETED,
    REJECTED,
    CANCELLED,
    REFUNDED,
    NO_SHOW,
    EXPIRED;

    /** Statuses that occupy a setup for availability purposes. */
    public static final Set<BookingStatus> OCCUPYING = Set.of(
            AWAITING_PAYMENT, PAYMENT_RECEIVED, PENDING_APPROVAL, CONFIRMED, CHECKED_IN, ACTIVE);

    public static Set<String> occupyingNames() {
        return OCCUPYING.stream().map(Enum::name).collect(java.util.stream.Collectors.toSet());
    }
}
