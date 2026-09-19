package com.alphaq.gaming.booking.web;

import com.alphaq.gaming.booking.dto.BookingDtos.*;
import com.alphaq.gaming.booking.service.BookingService;
import com.alphaq.gaming.common.error.ApiException;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Authenticated booking endpoints (JWT required — enforced by SecurityConfig). */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) { this.bookingService = bookingService; }

    @PostMapping
    public BookingDto create(@Valid @RequestBody CreateBookingRequest req, Authentication auth) {
        return bookingService.create(requireUser(auth), req);
    }

    @PostMapping("/{reference}/pay")
    public BookingDto pay(@PathVariable String reference, Authentication auth) {
        return bookingService.payMock(requireUser(auth), reference);
    }

    @PostMapping("/{reference}/cancel")
    public BookingDto cancel(@PathVariable String reference, Authentication auth) {
        return bookingService.cancel(requireUser(auth), reference);
    }

    @GetMapping
    public List<BookingDto> mine(Authentication auth) {
        return bookingService.myBookings(requireUser(auth));
    }

    @GetMapping("/{reference}")
    public BookingDto get(@PathVariable String reference, Authentication auth) {
        return bookingService.get(requireUser(auth), reference);
    }

    private String requireUser(Authentication auth) {
        if (auth == null || auth.getName() == null) throw ApiException.unauthorized("Please log in.");
        return auth.getName();
    }
}
