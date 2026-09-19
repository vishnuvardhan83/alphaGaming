package com.alphaq.gaming.booking.repo;

import com.alphaq.gaming.booking.entity.Booking;
import com.alphaq.gaming.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByReference(String reference);
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByStatusOrderByCreatedAtAsc(BookingStatus status);
    List<Booking> findAllByOrderByCreatedAtDesc();
    boolean existsByReference(String reference);

    /** Ids of physical setups already assigned to overlapping active bookings. */
    @Query("""
           SELECT s.id FROM Booking b JOIN b.assignedSetups s
           WHERE b.platform = :platform
             AND b.bookingDate = :date
             AND b.startTime < :endTime
             AND b.endTime > :startTime
             AND b.status IN :statuses
           """)
    java.util.Set<Long> assignedSetupIds(@Param("platform") String platform,
                                         @Param("date") LocalDate date,
                                         @Param("startTime") LocalTime startTime,
                                         @Param("endTime") LocalTime endTime,
                                         @Param("statuses") Collection<BookingStatus> statuses);

    /**
     * Number of setups already occupied for a platform in a time window on a date.
     * Two windows overlap when start1 < end2 AND end1 > start2. Un-paid holds
     * that have expired are excluded.
     */
    @Query("""
           SELECT COALESCE(SUM(b.quantity), 0) FROM Booking b
           WHERE b.platform = :platform
             AND b.bookingDate = :date
             AND b.startTime < :endTime
             AND b.endTime > :startTime
             AND b.status IN :statuses
             AND (b.status <> :awaiting OR b.holdExpiresAt > :now)
           """)
    long sumOccupied(@Param("platform") String platform,
                     @Param("date") LocalDate date,
                     @Param("startTime") LocalTime startTime,
                     @Param("endTime") LocalTime endTime,
                     @Param("statuses") Collection<BookingStatus> statuses,
                     @Param("awaiting") BookingStatus awaiting,
                     @Param("now") Instant now);
}
