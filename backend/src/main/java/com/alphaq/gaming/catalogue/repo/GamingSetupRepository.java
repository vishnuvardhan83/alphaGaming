package com.alphaq.gaming.catalogue.repo;

import com.alphaq.gaming.catalogue.entity.GamingSetup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GamingSetupRepository extends JpaRepository<GamingSetup, Long> {
    long countByPlatform(String platform);
    long countByPlatformAndStatus(String platform, String status);
    List<GamingSetup> findByPlatformOrderBySortOrderAsc(String platform);
    List<GamingSetup> findByPlatformAndStatusOrderBySortOrderAsc(String platform, String status);
    List<GamingSetup> findAllByOrderBySortOrderAsc();
    Optional<GamingSetup> findByCode(String code);
}
