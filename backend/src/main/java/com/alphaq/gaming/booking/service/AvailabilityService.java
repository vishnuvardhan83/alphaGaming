package com.alphaq.gaming.booking.service;

import com.alphaq.gaming.booking.BookingRules;
import com.alphaq.gaming.booking.dto.AvailabilityDto;
import com.alphaq.gaming.booking.entity.BookingStatus;
import com.alphaq.gaming.booking.repo.BookingRepository;
import com.alphaq.gaming.catalogue.repo.GamingSetupRepository;
import com.alphaq.gaming.common.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/** Computes live availability = in-service setups − overlapping active bookings. */
@Service
public class AvailabilityService {

    private final GamingSetupRepository setupRepo;
    private final BookingRepository bookingRepo;

    public AvailabilityService(GamingSetupRepository setupRepo, BookingRepository bookingRepo) {
        this.setupRepo = setupRepo;
        this.bookingRepo = bookingRepo;
    }

    @Transactional(readOnly = true)
    public AvailabilityDto check(String platform, LocalDate date, LocalTime start, LocalTime end) {
        String plat = platform == null ? "" : platform.toUpperCase();
        if (!plat.equals("PC") && !plat.equals("PS5")) {
            throw ApiException.badRequest("Choose a valid platform (PC or PS5).");
        }
        if (start == null || end == null || !start.isBefore(end)) {
            throw ApiException.badRequest("Start time must be before end time.");
        }
        long capacity = setupRepo.countByPlatformAndStatus(plat, "AVAILABLE");
        long booked = bookingRepo.sumOccupied(
                plat, date, start, end,
                BookingStatus.OCCUPYING, BookingStatus.AWAITING_PAYMENT, Instant.now());
        long available = Math.max(0, capacity - booked);
        return new AvailabilityDto(plat, date, start.toString(), end.toString(), capacity, booked, available);
    }

    /** Convenience: whole operating day (used for the "today" strip). */
    @Transactional(readOnly = true)
    public AvailabilityDto checkDay(String platform, LocalDate date) {
        return check(platform, date, BookingRules.OPEN, BookingRules.CLOSE);
    }
}
