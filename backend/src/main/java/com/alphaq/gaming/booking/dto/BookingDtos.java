package com.alphaq.gaming.booking.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Booking request/response payloads. */
public final class BookingDtos {
    private BookingDtos() {}

    public record CreateBookingRequest(
            @NotBlank @Pattern(regexp = "PC|PS5", message = "Choose PC or PS5.") String platform,
            @NotNull @FutureOrPresent(message = "Choose today or a future date.") LocalDate date,
            @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Choose a valid start time.") String start,
            @Min(value = 30, message = "Minimum 30 minutes.") int durationMin,
            @Min(1) @Max(13) int quantity,
            @Min(1) @Max(4) int participants,
            boolean dayPass
    ) {}

    public record BookingDto(
            String reference, String platform, LocalDate date, String start, String end,
            int durationMin, boolean dayPass, int quantity, int participants,
            int unitPriceInr, int totalInr, String status,
            Instant holdExpiresAt, long holdSecondsRemaining,
            List<String> assignedSetups, String decisionReason
    ) {}

    // ---- Admin ----
    public record AdminBookingDto(
            String reference, String username, String platform, LocalDate date,
            String start, String end, int quantity, int participants, boolean dayPass,
            int totalInr, String status, List<String> assignedSetups,
            String decidedBy, String decisionReason, Instant createdAt
    ) {}

    public record ApproveRequest(@NotEmpty(message = "Assign at least one setup.") List<String> setupCodes) {}

    public record RejectRequest(String reason) {}
}
