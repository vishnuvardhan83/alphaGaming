package com.alphaq.gaming.catalogue.dto;

import java.util.List;

/** Public catalogue payloads. */
public final class CatalogueDtos {
    private CatalogueDtos() {}

    public record PricingTierDto(String tierCode, String label, int minutes, int priceInr) {}

    public record PlatformPricingDto(String platform, String name, String capacity,
                                     int capacityPlayers, List<PricingTierDto> tiers) {}

    public record GameDto(Long id, String title, String platform, List<String> tags, String playerCount) {}

    public record SetupSummaryDto(String platform, String name, long total, long underMaintenance,
                                  long inServiceCount, int capacityPlayers) {}

    public record SetupAdminDto(Long id, String code, String platform, String status, int capacityPlayers) {}
}
