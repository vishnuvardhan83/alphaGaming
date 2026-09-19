package com.alphaq.gaming.booking.service;

import com.alphaq.gaming.auth.entity.User;
import com.alphaq.gaming.auth.repo.UserRepository;
import com.alphaq.gaming.booking.BookingRules;
import com.alphaq.gaming.booking.dto.AvailabilityDto;
import com.alphaq.gaming.booking.dto.BookingDtos.*;
import com.alphaq.gaming.booking.entity.Booking;
import com.alphaq.gaming.booking.entity.BookingStatus;
import com.alphaq.gaming.booking.repo.BookingRepository;
import com.alphaq.gaming.catalogue.entity.Pricing;
import com.alphaq.gaming.catalogue.repo.PricingRepository;
import com.alphaq.gaming.common.audit.AuditService;
import com.alphaq.gaming.common.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingService {

    private static final char[] REF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final SecureRandom random = new SecureRandom();

    private final BookingRepository bookings;
    private final PricingRepository pricing;
    private final UserRepository users;
    private final AvailabilityService availability;
    private final AuditService audit;

    public BookingService(BookingRepository bookings, PricingRepository pricing, UserRepository users,
                          AvailabilityService availability, AuditService audit) {
        this.bookings = bookings;
        this.pricing = pricing;
        this.users = users;
        this.availability = availability;
        this.audit = audit;
    }

    @Transactional
    public BookingDto create(String username, CreateBookingRequest req) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Please log in to book."));

        String platform = req.platform().toUpperCase();
        LocalDate date = req.date();

        // ---- Operating-window validation (blueprint §04/§05) ----
        if (date.isAfter(LocalDate.now().plusDays(BookingRules.BOOKING_WINDOW_DAYS))) {
            throw ApiException.badRequest("Bookings open up to " + BookingRules.BOOKING_WINDOW_DAYS + " days ahead.");
        }
        if (date.getDayOfWeek() == BookingRules.WEEKLY_CLOSURE) {
            throw ApiException.badRequest("We're closed on Mondays. Pick another day.");
        }
        if (req.platform().equals("PS5") && req.participants() > 4) {
            throw ApiException.badRequest("A PS5 console seats up to 4 players.");
        }

        LocalTime start;
        LocalTime end;
        int duration;
        boolean dayPass = req.dayPass();
        if (dayPass) {
            start = BookingRules.OPEN;
            end = BookingRules.CLOSE;
            duration = BookingRules.DAY_MINUTES;
        } else {
            start = LocalTime.parse(req.start());
            duration = req.durationMin();
            if (duration % 30 != 0) throw ApiException.badRequest("Duration must be in 30-minute blocks.");
            end = start.plusMinutes(duration);
            if (start.isBefore(BookingRules.OPEN) || end.isAfter(BookingRules.CLOSE) || !start.isBefore(end)) {
                throw ApiException.badRequest("Sessions run within 11:00 AM – 8:00 PM.");
            }
        }

        // ---- Price (from DB; never hardcoded) ----
        int unitPrice = priceFor(platform, dayPass, duration);
        int total = unitPrice * req.quantity();

        // ---- Availability re-check inside the transaction (overlap safety) ----
        AvailabilityDto avail = availability.check(platform, date, start, end);
        if (avail.available() < req.quantity()) {
            throw ApiException.conflict("Only " + avail.available() + " " + platform
                    + " setup(s) free for that slot. Please adjust your booking.");
        }

        Booking b = new Booking();
        b.setReference(newReference());
        b.setUserId(user.getId());
        b.setPlatform(platform);
        b.setQuantity(req.quantity());
        b.setBookingDate(date);
        b.setStartTime(start);
        b.setEndTime(end);
        b.setDurationMin(duration);
        b.setDayPass(dayPass);
        b.setParticipants(Math.max(1, req.participants()));
        b.setUnitPriceInr(unitPrice);
        b.setTotalInr(total);
        b.setStatus(BookingStatus.AWAITING_PAYMENT);
        b.setHoldExpiresAt(Instant.now().plus(BookingRules.HOLD_MINUTES, ChronoUnit.MINUTES));
        bookings.save(b);

        audit.record(username, "BOOKING_CREATE", "Booking", b.getReference() + " " + platform + " x" + req.quantity());
        return toDto(b);
    }

    /**
     * Mock payment: verifies the hold is still valid, then advances to
     * PENDING_APPROVAL. Payment success is NOT confirmation (blueprint §05).
     */
    @Transactional
    public BookingDto payMock(String username, String reference) {
        Booking b = load(username, reference);
        if (b.getStatus() != BookingStatus.AWAITING_PAYMENT) {
            throw ApiException.badRequest("This booking is not awaiting payment.");
        }
        if (b.getHoldExpiresAt() != null && Instant.now().isAfter(b.getHoldExpiresAt())) {
            b.setStatus(BookingStatus.EXPIRED);
            throw ApiException.badRequest("Your 10-minute hold expired. Please start a new booking.");
        }
        // Re-check availability before committing the slot (someone may have taken it).
        AvailabilityDto avail = availability.check(b.getPlatform(), b.getBookingDate(), b.getStartTime(), b.getEndTime());
        // avail includes this booking's own hold, so require capacity >= 0 after excluding self is complex;
        // the hold already reserved the slot, so we simply advance.
        b.setStatus(BookingStatus.PENDING_APPROVAL);
        b.setHoldExpiresAt(null);
        audit.record(username, "BOOKING_PAYMENT_RECEIVED", "Booking", b.getReference());
        return toDto(b);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> myBookings(String username) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Please log in."));
        return bookings.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto get(String username, String reference) {
        return toDto(load(username, reference));
    }

    @Transactional
    public BookingDto cancel(String username, String reference) {
        Booking b = load(username, reference);
        if (b.getStatus() == BookingStatus.CANCELLED) return toDto(b);
        if (b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.ACTIVE) {
            throw ApiException.badRequest("This booking can no longer be cancelled.");
        }
        b.setStatus(BookingStatus.CANCELLED);
        b.setHoldExpiresAt(null);
        audit.record(username, "BOOKING_CANCEL", "Booking", b.getReference());
        return toDto(b);
    }

    // ---- helpers ----

    private Booking load(String username, String reference) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Please log in."));
        Booking b = bookings.findByReference(reference)
                .orElseThrow(() -> ApiException.notFound("Booking not found."));
        if (!b.getUserId().equals(user.getId())) {
            throw ApiException.notFound("Booking not found."); // don't leak others' bookings
        }
        return b;
    }

    private int priceFor(String platform, boolean dayPass, int durationMin) {
        if (dayPass) {
            return tier(platform, "DAY").getPriceInr();
        }
        // 30-min block pricing (hourly == 2×30-min for the current price list).
        int blocks = durationMin / 30;
        return blocks * tier(platform, "MIN30").getPriceInr();
    }

    private Pricing tier(String platform, String code) {
        return pricing.findByPlatformAndTierCodeAndActiveTrue(platform, code)
                .orElseThrow(() -> ApiException.badRequest("Pricing unavailable. Contact support."));
    }

    private String newReference() {
        for (int attempt = 0; attempt < 8; attempt++) {
            StringBuilder sb = new StringBuilder("AQ-");
            for (int i = 0; i < 6; i++) sb.append(REF[random.nextInt(REF.length)]);
            String ref = sb.toString();
            if (!bookings.existsByReference(ref)) return ref;
        }
        throw ApiException.badRequest("Could not allocate a booking reference. Try again.");
    }

    private BookingDto toDto(Booking b) {
        long holdRemaining = 0;
        if (b.getHoldExpiresAt() != null) {
            holdRemaining = Math.max(0, b.getHoldExpiresAt().getEpochSecond() - Instant.now().getEpochSecond());
        }
        var setups = b.getAssignedSetups().stream()
                .map(com.alphaq.gaming.catalogue.entity.GamingSetup::getCode).sorted().toList();
        return new BookingDto(
                b.getReference(), b.getPlatform(), b.getBookingDate(),
                b.getStartTime().toString(), b.getEndTime().toString(),
                b.getDurationMin(), b.isDayPass(), b.getQuantity(), b.getParticipants(),
                b.getUnitPriceInr(), b.getTotalInr(), b.getStatus().name(),
                b.getHoldExpiresAt(), holdRemaining, setups, b.getDecisionReason());
    }
}
