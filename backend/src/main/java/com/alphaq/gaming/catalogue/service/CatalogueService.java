package com.alphaq.gaming.catalogue.service;

import com.alphaq.gaming.catalogue.dto.CatalogueDtos.*;
import com.alphaq.gaming.catalogue.entity.Pricing;
import com.alphaq.gaming.catalogue.repo.GameRepository;
import com.alphaq.gaming.catalogue.repo.GamingSetupRepository;
import com.alphaq.gaming.catalogue.repo.PricingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Read-only catalogue: pricing, games and setup capacity. */
@Service
@Transactional(readOnly = true)
public class CatalogueService {

    private static final String MAINTENANCE = "MAINTENANCE";

    private final PricingRepository pricingRepo;
    private final GameRepository gameRepo;
    private final GamingSetupRepository setupRepo;

    public CatalogueService(PricingRepository pricingRepo, GameRepository gameRepo,
                            GamingSetupRepository setupRepo) {
        this.pricingRepo = pricingRepo;
        this.gameRepo = gameRepo;
        this.setupRepo = setupRepo;
    }

    public List<PlatformPricingDto> pricing() {
        Map<String, List<PricingTierDto>> byPlatform = new LinkedHashMap<>();
        for (Pricing p : pricingRepo.findByActiveTrueOrderByPlatformAscSortOrderAsc()) {
            byPlatform.computeIfAbsent(p.getPlatform(), k -> new ArrayList<>())
                    .add(new PricingTierDto(p.getTierCode(), p.getLabel(), p.getMinutes(), p.getPriceInr()));
        }
        List<PlatformPricingDto> out = new ArrayList<>();
        byPlatform.forEach((platform, tiers) -> {
            long total = setupRepo.countByPlatform(platform);
            int cap = "PS5".equals(platform) ? 4 : 1;
            out.add(new PlatformPricingDto(platform, displayName(platform),
                    total + " setups", cap, tiers));
        });
        return out;
    }

    public List<GameDto> games() {
        return gameRepo.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(g -> new GameDto(g.getId(), g.getTitle(), g.getPlatform(),
                        splitTags(g.getTags()), g.getPlayerCount()))
                .toList();
    }

    public List<SetupSummaryDto> setupSummary() {
        List<SetupSummaryDto> out = new ArrayList<>();
        for (String platform : List.of("PC", "PS5")) {
            long total = setupRepo.countByPlatform(platform);
            if (total == 0) continue;
            long maint = setupRepo.countByPlatformAndStatus(platform, MAINTENANCE);
            int cap = "PS5".equals(platform) ? 4 : 1;
            out.add(new SetupSummaryDto(platform, displayName(platform), total, maint, total - maint, cap));
        }
        return out;
    }

    private String displayName(String platform) {
        return switch (platform) {
            case "PC" -> "Gaming PC";
            case "PS5" -> "PlayStation 5";
            default -> platform;
        };
    }

    private List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return List.of(tags.split("\\s*,\\s*"));
    }
}
