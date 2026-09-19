package com.alphaq.gaming.admin;

import com.alphaq.gaming.auth.repo.UserRepository;
import com.alphaq.gaming.booking.dto.BookingDtos.AdminBookingDto;
import com.alphaq.gaming.booking.entity.Booking;
import com.alphaq.gaming.booking.entity.BookingStatus;
import com.alphaq.gaming.booking.repo.BookingRepository;
import com.alphaq.gaming.catalogue.dto.CatalogueDtos.SetupAdminDto;
import com.alphaq.gaming.catalogue.entity.GamingSetup;
import com.alphaq.gaming.catalogue.repo.GamingSetupRepository;
import com.alphaq.gaming.common.audit.AuditService;
import com.alphaq.gaming.common.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Admin operations: booking approval/rejection + setup assignment + maintenance. */
@Service
public class AdminService {

    private final BookingRepository bookings;
    private final GamingSetupRepository setups;
    private final UserRepository users;
    private final AuditService audit;

    public AdminService(BookingRepository bookings, GamingSetupRepository setups,
                        UserRepository users, AuditService audit) {
        this.bookings = bookings;
        this.setups = setups;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AdminBookingDto> listBookings(String status) {
        List<Booking> list = (status == null || status.isBlank() || status.equalsIgnoreCase("ALL"))
                ? bookings.findAllByOrderByCreatedAtDesc()
                : bookings.findByStatusOrderByCreatedAtAsc(parseStatus(status));
        // username lookup (small scale — cache per id)
        Map<Long, String> names = users.findAll().stream()
                .collect(Collectors.toMap(u -> u.getId(), u -> u.getUsername()));
        return list.stream().map(b -> toAdminDto(b, names.getOrDefault(b.getUserId(), "—"))).toList();
    }

    @Transactional(readOnly = true)
    public List<String> assignableSetups(String reference) {
        Booking b = booking(reference);
        var takenIds = bookings.assignedSetupIds(b.getPlatform(), b.getBookingDate(),
                b.getStartTime(), b.getEndTime(), BookingStatus.OCCUPYING);
        return setups.findByPlatformAndStatusOrderBySortOrderAsc(b.getPlatform(), "AVAILABLE").stream()
                .filter(s -> !takenIds.contains(s.getId()))
                .map(GamingSetup::getCode).toList();
    }

    @Transactional
    public AdminBookingDto approve(String reference, List<String> setupCodes, String admin) {
        Booking b = booking(reference);
        if (b.getStatus() != BookingStatus.PENDING_APPROVAL) {
            throw ApiException.badRequest("Only bookings pending approval can be confirmed.");
        }
        if (setupCodes == null || setupCodes.size() != b.getQuantity()) {
            throw ApiException.badRequest("Assign exactly " + b.getQuantity() + " setup(s).");
        }
        var assignable = assignableSetups(reference);
        for (String code : setupCodes) {
            if (!assignable.contains(code)) {
                throw ApiException.conflict("Setup " + code + " is not free for this slot.");
            }
            GamingSetup s = setups.findByCode(code)
                    .orElseThrow(() -> ApiException.badRequest("Unknown setup " + code + "."));
            if (!s.getPlatform().equals(b.getPlatform())) {
                throw ApiException.badRequest("Setup " + code + " is not a " + b.getPlatform() + ".");
            }
            b.getAssignedSetups().add(s);
        }
        b.setStatus(BookingStatus.CONFIRMED);
        b.setDecidedBy(admin);
        b.setDecidedAt(Instant.now());
        audit.record(admin, "BOOKING_APPROVE", "Booking", b.getReference() + " -> " + String.join(",", setupCodes));
        return toAdminDto(b, username(b.getUserId()));
    }

    @Transactional
    public AdminBookingDto reject(String reference, String reason, String admin) {
        Booking b = booking(reference);
        if (b.getStatus() != BookingStatus.PENDING_APPROVAL) {
            throw ApiException.badRequest("Only bookings pending approval can be rejected.");
        }
        b.setStatus(BookingStatus.REJECTED);
        b.setDecidedBy(admin);
        b.setDecidedAt(Instant.now());
        b.setDecisionReason(reason == null || reason.isBlank() ? "Rejected by staff." : reason.trim());
        audit.record(admin, "BOOKING_REJECT", "Booking", b.getReference() + " (" + b.getDecisionReason() + ")");
        return toAdminDto(b, username(b.getUserId()));
    }

    // ---- Setups ----

    @Transactional(readOnly = true)
    public List<SetupAdminDto> listSetups() {
        return setups.findAllByOrderBySortOrderAsc().stream()
                .map(s -> new SetupAdminDto(s.getId(), s.getCode(), s.getPlatform(), s.getStatus(), s.getCapacityPlayers()))
                .toList();
    }

    @Transactional
    public SetupAdminDto setSetupStatus(String code, String status, String admin) {
        String st = status == null ? "" : status.toUpperCase();
        if (!st.equals("AVAILABLE") && !st.equals("MAINTENANCE")) {
            throw ApiException.badRequest("Status must be AVAILABLE or MAINTENANCE.");
        }
        GamingSetup s = setups.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Setup " + code + " not found."));
        s.setStatus(st);
        audit.record(admin, "SETUP_STATUS", "GamingSetup", code + " -> " + st);
        return new SetupAdminDto(s.getId(), s.getCode(), s.getPlatform(), s.getStatus(), s.getCapacityPlayers());
    }

    // ---- helpers ----

    private Booking booking(String reference) {
        return bookings.findByReference(reference)
                .orElseThrow(() -> ApiException.notFound("Booking not found."));
    }

    private BookingStatus parseStatus(String s) {
        try { return BookingStatus.valueOf(s.toUpperCase()); }
        catch (Exception e) { throw ApiException.badRequest("Unknown status filter: " + s); }
    }

    private String username(Long userId) {
        return users.findById(userId).map(u -> u.getUsername()).orElse("—");
    }

    private AdminBookingDto toAdminDto(Booking b, String username) {
        var setupCodes = b.getAssignedSetups().stream().map(GamingSetup::getCode).sorted().toList();
        return new AdminBookingDto(
                b.getReference(), username, b.getPlatform(), b.getBookingDate(),
                b.getStartTime().toString(), b.getEndTime().toString(),
                b.getQuantity(), b.getParticipants(), b.isDayPass(), b.getTotalInr(),
                b.getStatus().name(), setupCodes, b.getDecidedBy(), b.getDecisionReason(), b.getCreatedAt());
    }
}
