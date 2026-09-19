package com.alphaq.gaming.admin;

import com.alphaq.gaming.booking.dto.BookingDtos.*;
import com.alphaq.gaming.catalogue.dto.CatalogueDtos.SetupAdminDto;
import com.alphaq.gaming.common.error.ApiException;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin endpoints — gated to OWNER/ADMIN by SecurityConfig (/api/admin/**). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) { this.admin = admin; }

    @GetMapping("/bookings")
    public List<AdminBookingDto> bookings(@RequestParam(required = false) String status) {
        return admin.listBookings(status);
    }

    @GetMapping("/bookings/{reference}/assignable-setups")
    public List<String> assignable(@PathVariable String reference) {
        return admin.assignableSetups(reference);
    }

    @PostMapping("/bookings/{reference}/approve")
    public AdminBookingDto approve(@PathVariable String reference,
                                   @Valid @RequestBody ApproveRequest req, Authentication auth) {
        return admin.approve(reference, req.setupCodes(), name(auth));
    }

    @PostMapping("/bookings/{reference}/reject")
    public AdminBookingDto reject(@PathVariable String reference,
                                  @RequestBody(required = false) RejectRequest req, Authentication auth) {
        return admin.reject(reference, req == null ? null : req.reason(), name(auth));
    }

    @GetMapping("/setups")
    public List<SetupAdminDto> setups() {
        return admin.listSetups();
    }

    @PostMapping("/setups/{code}/status")
    public SetupAdminDto setSetupStatus(@PathVariable String code, @RequestBody Map<String, String> body,
                                        Authentication auth) {
        return admin.setSetupStatus(code, body.get("status"), name(auth));
    }

    private String name(Authentication auth) {
        if (auth == null || auth.getName() == null) throw ApiException.unauthorized("Please log in.");
        return auth.getName();
    }
}
