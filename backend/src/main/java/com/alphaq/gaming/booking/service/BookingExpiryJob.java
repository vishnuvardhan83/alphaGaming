package com.alphaq.gaming.booking.service;

import com.alphaq.gaming.booking.entity.Booking;
import com.alphaq.gaming.booking.entity.BookingStatus;
import com.alphaq.gaming.booking.repo.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Releases expired 10-minute payment holds (blueprint §04: "expired holds
 * release availability"). Availability already ignores expired holds in its
 * query; this job also flips their status to EXPIRED so dashboards are tidy.
 */
@Component
public class BookingExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryJob.class);
    private final BookingRepository bookings;

    public BookingExpiryJob(BookingRepository bookings) { this.bookings = bookings; }

    @Scheduled(fixedDelay = 60_000) // every minute
    @Transactional
    public void expireHolds() {
        Instant now = Instant.now();
        int n = 0;
        for (Booking b : bookings.findAll()) {
            if (b.getStatus() == BookingStatus.AWAITING_PAYMENT
                    && b.getHoldExpiresAt() != null && now.isAfter(b.getHoldExpiresAt())) {
                b.setStatus(BookingStatus.EXPIRED);
                b.setHoldExpiresAt(null);
                n++;
            }
        }
        if (n > 0) log.info("Released {} expired booking hold(s).", n);
    }
}
