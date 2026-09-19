package com.alphaq.gaming.booking.web;

import com.alphaq.gaming.booking.dto.AvailabilityDto;
import com.alphaq.gaming.booking.service.AvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

/** Public availability lookups for the booking UI. */
@RestController
@RequestMapping("/api/public/availability")
public class AvailabilityController {

    private final AvailabilityService availability;

    public AvailabilityController(AvailabilityService availability) { this.availability = availability; }

    @GetMapping
    public AvailabilityDto check(
            @RequestParam String platform,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime start,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime end) {
        return availability.check(platform, date, start, end);
    }

    @GetMapping("/day")
    public AvailabilityDto day(
            @RequestParam String platform,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availability.checkDay(platform, date);
    }
}
