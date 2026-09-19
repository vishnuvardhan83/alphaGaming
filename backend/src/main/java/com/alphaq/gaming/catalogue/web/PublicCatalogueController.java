package com.alphaq.gaming.catalogue.web;

import com.alphaq.gaming.catalogue.dto.CatalogueDtos.*;
import com.alphaq.gaming.catalogue.service.CatalogueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public, unauthenticated catalogue endpoints for the marketing site. */
@RestController
@RequestMapping("/api/public")
public class PublicCatalogueController {

    private final CatalogueService catalogue;

    public PublicCatalogueController(CatalogueService catalogue) { this.catalogue = catalogue; }

    @GetMapping("/pricing")
    public List<PlatformPricingDto> pricing() { return catalogue.pricing(); }

    @GetMapping("/games")
    public List<GameDto> games() { return catalogue.games(); }

    @GetMapping("/setups")
    public List<SetupSummaryDto> setups() { return catalogue.setupSummary(); }
}
