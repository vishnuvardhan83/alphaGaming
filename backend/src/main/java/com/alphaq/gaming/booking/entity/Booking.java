package com.alphaq.gaming.booking.entity;

import com.alphaq.gaming.catalogue.entity.GamingSetup;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String reference;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 10)
    private String platform;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "duration_min", nullable = false)
    private int durationMin;

    @Column(name = "day_pass", nullable = false)
    private boolean dayPass;

    @Column(nullable = false)
    private int participants = 1;

    @Column(name = "unit_price_inr", nullable = false)
    private int unitPriceInr;

    @Column(name = "total_inr", nullable = false)
    private int totalInr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    @Column(length = 300)
    private String notes;

    @Column(name = "decided_by", length = 80)
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "decision_reason", length = 300)
    private String decisionReason;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "booking_setup",
            joinColumns = @JoinColumn(name = "booking_id"),
            inverseJoinColumns = @JoinColumn(name = "setup_id"))
    private Set<GamingSetup> assignedSetups = new HashSet<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Version
    private Long version;

    // getters / setters
    public Long getId() { return id; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public int getDurationMin() { return durationMin; }
    public void setDurationMin(int durationMin) { this.durationMin = durationMin; }
    public boolean isDayPass() { return dayPass; }
    public void setDayPass(boolean dayPass) { this.dayPass = dayPass; }
    public int getParticipants() { return participants; }
    public void setParticipants(int participants) { this.participants = participants; }
    public int getUnitPriceInr() { return unitPriceInr; }
    public void setUnitPriceInr(int unitPriceInr) { this.unitPriceInr = unitPriceInr; }
    public int getTotalInr() { return totalInr; }
    public void setTotalInr(int totalInr) { this.totalInr = totalInr; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public Instant getHoldExpiresAt() { return holdExpiresAt; }
    public void setHoldExpiresAt(Instant holdExpiresAt) { this.holdExpiresAt = holdExpiresAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getDecidedBy() { return decidedBy; }
    public void setDecidedBy(String decidedBy) { this.decidedBy = decidedBy; }
    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
    public Set<GamingSetup> getAssignedSetups() { return assignedSetups; }
    public Instant getCreatedAt() { return createdAt; }
}
