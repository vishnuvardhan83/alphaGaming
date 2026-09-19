package com.alphaq.gaming.auth.repo;

import com.alphaq.gaming.auth.entity.OtpRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpRequestRepository extends JpaRepository<OtpRequest, Long> {

    Optional<OtpRequest> findFirstByMobileAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            String mobile, String purpose);

    long countByMobileAndPurposeAndCreatedAtAfter(String mobile, String purpose, Instant after);
}
