package com.alphaq.gaming.booking.dto;

import java.time.LocalDate;

/** Live availability for a platform in a specific window on a date. */
public record AvailabilityDto(
        String platform,
        LocalDate date,
        String start,
        String end,
        long capacity,      // setups in service (not under maintenance)
        long booked,        // occupied by active bookings/holds
        long available      // capacity - booked (never negative)
) {}
