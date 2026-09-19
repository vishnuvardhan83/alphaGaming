/** Mirrors backend CatalogueDtos (com.alphaq.gaming.catalogue.dto). */
export interface PricingTier { tierCode: string; label: string; minutes: number; priceInr: number; }

export interface PlatformPricing {
  platform: string;
  name: string;
  capacity: string;
  capacityPlayers: number;
  tiers: PricingTier[];
}

export interface GameCard {
  id: number;
  title: string;
  platform: string;
  tags: string[];
  playerCount: string | null;
}

export interface SetupSummary {
  platform: string;
  name: string;
  total: number;
  underMaintenance: number;
  inServiceCount: number;
  capacityPlayers: number;
}
