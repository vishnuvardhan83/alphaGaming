package com.alphaq.gaming.catalogue.repo;

import com.alphaq.gaming.catalogue.entity.Pricing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PricingRepository extends JpaRepository<Pricing, Long> {
    List<Pricing> findByActiveTrueOrderByPlatformAscSortOrderAsc();
    Optional<Pricing> findByPlatformAndTierCodeAndActiveTrue(String platform, String tierCode);
}
