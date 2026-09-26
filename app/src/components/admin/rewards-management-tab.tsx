import { useEffect, useState } from "react";
import {
  Gift,
  Tag,
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Copy,
  Clock,
  Coffee,
  Crown,
  Sparkles,
  Zap,
  Flame,
  Search,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modal";
import {
  type RewardOption,
  type NewRewardOption,
  type Offer,
  type NewOffer,
  type AdminUser,
  listAdminRewardOptions,
  createRewardOption,
  updateRewardOption,
  deleteRewardOption,
  listAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  listUsers,
  adjustReward,
} from "@/lib/db";

const primaryBtn =
  "rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5";
const ghostBtn =
  "rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary flex items-center justify-center gap-1.5";
const dangerBtn =
  "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20 flex items-center justify-center gap-1.5";
const inputCls =
  "w-full rounded-lg border border-border bg-background/90 px-3 py-2 text-sm outline-none focus:border-primary transition";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

const REWARD_TYPES = [
  { value: "cafe_discount", label: "Café Discount Voucher" },
  { value: "gaming_hour", label: "Free Gaming Hour Pass" },
  { value: "booking_discount", label: "Station Booking Discount" },
  { value: "vip_pass", label: "VIP Tournament Pass" },
  { value: "snack_combo", label: "Snack & Drink Combo" },
  { value: "custom", label: "Custom Reward Item" },
];

const ICON_OPTIONS = [
  { value: "gift", label: "Gift Box", Icon: Gift },
  { value: "coffee", label: "Café / Snack", Icon: Coffee },
  { value: "clock", label: "Free Hours", Icon: Clock },
  { value: "crown", label: "VIP Crown", Icon: Crown },
  { value: "tag", label: "Discount Tag", Icon: Tag },
  { value: "sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "zap", label: "Fast Pass", Icon: Zap },
  { value: "flame", label: "Hot Deal", Icon: Flame },
];

function getRewardIcon(iconName: string) {
  switch (iconName) {
    case "coffee":
      return Coffee;
    case "clock":
      return Clock;
    case "crown":
      return Crown;
    case "tag":
      return Tag;
    case "sparkles":
      return Sparkles;
    case "zap":
      return Zap;
    case "flame":
      return Flame;
    default:
      return Gift;
  }
}

export function RewardsManagementTab() {
  const [subTab, setSubTab] = useState<"options" | "offers" | "users">("options");

  // Options State
  const [options, setOptions] = useState<RewardOption[] | null>(null);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<RewardOption | null>(null);
  const [savingOption, setSavingOption] = useState(false);
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<RewardOption | null>(null);

  // Form fields for Option
  const [optTitle, setOptTitle] = useState("");
  const [optDesc, setOptDesc] = useState("");
  const [optPoints, setOptPoints] = useState(50);
  const [optType, setOptType] = useState("cafe_discount");
  const [optDiscount, setOptDiscount] = useState(50);
  const [optBadge, setOptBadge] = useState("");
  const [optIcon, setOptIcon] = useState("gift");
  const [optActive, setOptActive] = useState(true);
  const [optSort, setOptSort] = useState(0);

  // Offers State
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);
  const [deleteOfferTarget, setDeleteOfferTarget] = useState<Offer | null>(null);

  // Form fields for Offer
  const [offTitle, setOffTitle] = useState("");
  const [offCode, setOffCode] = useState("");
  const [offDesc, setOffDesc] = useState("");
  const [offType, setOffType] = useState<"percentage" | "flat">("percentage");
  const [offValue, setOffValue] = useState(20);
  const [offMinHours, setOffMinHours] = useState(1);
  const [offPlatform, setOffPlatform] = useState<"all" | "pc" | "ps5" | "racing">("all");
  const [offValidUntil, setOffValidUntil] = useState("Ongoing");
  const [offBadge, setOffBadge] = useState("");
  const [offActive, setOffActive] = useState(true);

  // Users & Points State
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [adjustingUser, setAdjustingUser] = useState<number | null>(null);
  const [customAdjustUser, setCustomAdjustUser] = useState<AdminUser | null>(null);
  const [customDelta, setCustomDelta] = useState(50);
  const [customReason, setCustomReason] = useState("");

  const reloadOptions = () => {
    setOptions(null);
    listAdminRewardOptions()
      .then(setOptions)
      .catch(() => {
        setOptions([]);
        toast.error("Failed to load reward options.");
      });
  };

  const reloadOffers = () => {
    setOffers(null);
    listAdminOffers()
      .then(setOffers)
      .catch(() => {
        setOffers([]);
        toast.error("Failed to load promotional offers.");
      });
  };

  const reloadUsers = () => {
    setUsers(null);
    listUsers()
      .then(setUsers)
      .catch(() => {
        setUsers([]);
        toast.error("Failed to load users list.");
      });
  };

  useEffect(() => {
    reloadOptions();
    reloadOffers();
    reloadUsers();
  }, []);

  // Open Option modal
  function openOptionModal(opt?: RewardOption) {
    if (opt) {
      setEditingOption(opt);
      setOptTitle(opt.title);
      setOptDesc(opt.description);
      setOptPoints(opt.pointsCost);
      setOptType(opt.rewardType);
      setOptDiscount(opt.discountAmount);
      setOptBadge(opt.badge);
      setOptIcon(opt.icon);
      setOptActive(opt.active);
      setOptSort(opt.sortOrder);
    } else {
      setEditingOption(null);
      setOptTitle("");
      setOptDesc("");
      setOptPoints(50);
      setOptType("cafe_discount");
      setOptDiscount(50);
      setOptBadge("");
      setOptIcon("gift");
      setOptActive(true);
      setOptSort(options ? options.length + 1 : 1);
    }
    setOptionModalOpen(true);
  }

  async function handleSaveOption(e: React.FormEvent) {
    e.preventDefault();
    if (!optTitle.trim()) {
      toast.error("Please enter a title for the reward option.");
      return;
    }
    if (optPoints <= 0) {
      toast.error("Points cost must be greater than 0.");
      return;
    }

    try {
      setSavingOption(true);
      const payload: NewRewardOption = {
        title: optTitle.trim(),
        description: optDesc.trim(),
        pointsCost: optPoints,
        rewardType: optType,
        discountAmount: optDiscount,
        badge: optBadge.trim(),
        icon: optIcon,
        active: optActive,
        sortOrder: optSort,
      };

      if (editingOption) {
        await updateRewardOption(editingOption.id, payload);
        toast.success(`Reward option "${payload.title}" updated.`);
      } else {
        await createRewardOption(payload);
        toast.success(`Reward option "${payload.title}" created.`);
      }

      setOptionModalOpen(false);
      reloadOptions();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save reward option.");
    } finally {
      setSavingOption(false);
    }
  }

  async function handleToggleOptionActive(opt: RewardOption) {
    try {
      await updateRewardOption(opt.id, { active: !opt.active });
      setOptions((prev) =>
        prev ? prev.map((o) => (o.id === opt.id ? { ...o, active: !o.active } : o)) : prev,
      );
      toast.success(
        `Reward option "${opt.title}" is now ${!opt.active ? "visible to gamers" : "hidden"}.`,
      );
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDeleteOption() {
    if (!deleteOptionTarget) return;
    try {
      await deleteRewardOption(deleteOptionTarget.id);
      toast.success(`Deleted reward option "${deleteOptionTarget.title}".`);
      setDeleteOptionTarget(null);
      reloadOptions();
    } catch {
      toast.error("Failed to delete reward option.");
    }
  }

  // Open Offer Modal
  function openOfferModal(off?: Offer) {
    if (off) {
      setEditingOffer(off);
      setOffTitle(off.title);
      setOffCode(off.code);
      setOffDesc(off.description);
      setOffType(off.discountType);
      setOffValue(off.discountValue);
      setOffMinHours(off.minHours);
      setOffPlatform(off.applicablePlatform);
      setOffValidUntil(off.validUntil);
      setOffBadge(off.badge);
      setOffActive(off.active);
    } else {
      setEditingOffer(null);
      setOffTitle("");
      setOffCode("");
      setOffDesc("");
      setOffType("percentage");
      setOffValue(20);
      setOffMinHours(1);
      setOffPlatform("all");
      setOffValidUntil("Ongoing");
      setOffBadge("");
      setOffActive(true);
    }
    setOfferModalOpen(true);
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offTitle.trim()) {
      toast.error("Please enter a title for the offer.");
      return;
    }
    if (!offCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (offValue <= 0) {
      toast.error("Discount value must be greater than 0.");
      return;
    }

    try {
      setSavingOffer(true);
      const payload: NewOffer = {
        title: offTitle.trim(),
        code: offCode.trim().toUpperCase(),
        description: offDesc.trim(),
        discountType: offType,
        discountValue: offValue,
        minHours: offMinHours,
        applicablePlatform: offPlatform,
        validUntil: offValidUntil.trim() || "Ongoing",
        badge: offBadge.trim(),
        active: offActive,
      };

      if (editingOffer) {
        await updateOffer(editingOffer.id, payload);
        toast.success(`Offer "${payload.title}" updated.`);
      } else {
        await createOffer(payload);
        toast.success(`Offer "${payload.title}" created with code ${payload.code}.`);
      }

      setOfferModalOpen(false);
      reloadOffers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save offer.");
    } finally {
      setSavingOffer(false);
    }
  }

  async function handleToggleOfferActive(off: Offer) {
    try {
      await updateOffer(off.id, { active: !off.active });
      setOffers((prev) =>
        prev ? prev.map((o) => (o.id === off.id ? { ...o, active: !o.active } : o)) : prev,
      );
      toast.success(
        `Offer "${off.title}" is now ${!off.active ? "active for gamers" : "deactivated"}.`,
      );
    } catch {
      toast.error("Failed to update offer status.");
    }
  }

  async function handleDeleteOffer() {
    if (!deleteOfferTarget) return;
    try {
      await deleteOffer(deleteOfferTarget.id);
      toast.success(`Deleted offer "${deleteOfferTarget.title}".`);
      setDeleteOfferTarget(null);
      reloadOffers();
    } catch {
      toast.error("Failed to delete offer.");
    }
  }

  // Points Adjustment
  async function handleQuickAdjust(u: AdminUser, delta: number) {
    setAdjustingUser(u.id);
    try {
      const updated = await adjustReward(
        u.id,
        delta,
        `Staff adjustment (${delta > 0 ? "+" : ""}${delta} pts)`,
      );
      setUsers((prev) =>
        prev ? prev.map((x) => (x.id === u.id ? { ...x, rewardPoints: updated.rewardPoints } : x)) : prev,
      );
      toast.success(`Adjusted ${u.name || u.phone} by ${delta > 0 ? "+" : ""}${delta} points.`);
    } catch {
      toast.error("Adjustment failed.");
    } finally {
      setAdjustingUser(null);
    }
  }

  async function handleCustomAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!customAdjustUser) return;
    if (customDelta === 0) {
      toast.error("Point change cannot be 0.");
      return;
    }
    try {
      const reason = customReason.trim() || `Staff adjustment (${customDelta > 0 ? "+" : ""}${customDelta} pts)`;
      const updated = await adjustReward(customAdjustUser.id, customDelta, reason);
      setUsers((prev) =>
        prev
          ? prev.map((x) =>
              x.id === customAdjustUser.id ? { ...x, rewardPoints: updated.rewardPoints } : x,
            )
          : prev,
      );
      toast.success(
        `Successfully adjusted ${customAdjustUser.name || customAdjustUser.phone} by ${customDelta > 0 ? "+" : ""}${customDelta} points.`,
      );
      setCustomAdjustUser(null);
    } catch {
      toast.error("Failed to adjust points.");
    }
  }

  const filteredUsers = (users || []).filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Rewards &amp; Promotional Offers Management
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure redeemable rewards catalog for gamers, publish promotional deals, and adjust user point balances
              </p>
            </div>
          </div>
        </div>

        {/* Sub-nav Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background/80 p-1">
          <button
            onClick={() => setSubTab("options")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              subTab === "options"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            Redeem Options
            {options && (
              <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                {options.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab("offers")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              subTab === "offers"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            Promotional Offers
            {offers && (
              <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                {offers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab("users")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              subTab === "users"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            User Points Ledger
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: REDEEM OPTIONS */}
      {subTab === "options" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Gamer Redeem Catalog
              </h3>
              <p className="text-xs text-muted-foreground">
                These are the rewards gamers can select and redeem in their portal using points
              </p>
            </div>
            <button onClick={() => openOptionModal()} className={primaryBtn}>
              <Plus className="h-4 w-4" /> Add Redeem Option
            </button>
          </div>

          {options === null ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <Gift className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No reward redeem options yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add rewards like café discounts, free gaming hours, or tournament passes for gamers to redeem.
              </p>
              <button onClick={() => openOptionModal()} className={primaryBtn}>
                <Plus className="h-4 w-4" /> Add First Reward Option
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {options.map((opt) => {
                const IconComponent = getRewardIcon(opt.icon);
                return (
                  <div
                    key={opt.id}
                    className={`relative rounded-xl border p-4 transition flex flex-col justify-between ${
                      opt.active
                        ? "border-border bg-card hover:border-primary/40"
                        : "border-border/50 bg-card/40 opacity-70"
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Points + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <IconComponent className="h-5 w-5" />
                          </span>
                          <div>
                            <span className="font-mono text-sm font-bold text-primary">
                              {opt.pointsCost} <span className="text-xs font-normal">pts</span>
                            </span>
                            {opt.badge && (
                              <span className="ml-2 inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleOptionActive(opt)}
                          title={opt.active ? "Click to deactivate" : "Click to activate"}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition ${
                            opt.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                        >
                          {opt.active ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h4 className="mt-3 font-display text-sm font-bold text-foreground">
                        {opt.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {opt.description || "No description provided."}
                      </p>

                      {/* Meta Tags */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        {opt.discountAmount > 0 && (
                          <span className="rounded bg-background px-2 py-0.5 border border-border font-medium text-foreground">
                            Value: ₹{opt.discountAmount}
                          </span>
                        )}
                        <span className="rounded bg-background px-2 py-0.5 border border-border capitalize">
                          {opt.rewardType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Order: #{opt.sortOrder}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openOptionModal(opt)}
                          className={ghostBtn}
                          title="Edit reward option"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteOptionTarget(opt)}
                          className={dangerBtn}
                          title="Delete reward option"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PROMOTIONAL OFFERS */}
      {subTab === "offers" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Promotional Deals &amp; Coupons
              </h3>
              <p className="text-xs text-muted-foreground">
                Coupons and special deals published across the arena site and booking flow
              </p>
            </div>
            <button onClick={() => openOfferModal()} className={primaryBtn}>
              <Plus className="h-4 w-4" /> Create New Offer
            </button>
          </div>

          {offers === null ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <Tag className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No promotional offers yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create coupon codes, happy hour discounts, and LAN party specials for gamers.
              </p>
              <button onClick={() => openOfferModal()} className={primaryBtn}>
                <Plus className="h-4 w-4" /> Create First Offer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((off) => {
                return (
                  <div
                    key={off.id}
                    className={`relative rounded-xl border p-4 transition flex flex-col justify-between ${
                      off.active
                        ? "border-border bg-card hover:border-primary/40"
                        : "border-border/50 bg-card/40 opacity-70"
                    }`}
                  >
                    <div>
                      {/* Top Row: Promo Code Badge + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                            <span>{off.code}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(off.code);
                                toast.success(`Code ${off.code} copied!`);
                              }}
                              className="text-primary hover:text-white"
                              title="Copy promo code"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {off.badge && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                              {off.badge}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleOfferActive(off)}
                          title={off.active ? "Click to deactivate" : "Click to activate"}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition ${
                            off.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                        >
                          {off.active ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </div>

                      {/* Title & Discount Highlight */}
                      <div className="mt-3">
                        <h4 className="font-display text-sm font-bold text-foreground">
                          {off.title}
                        </h4>
                        <p className="font-display text-lg font-extrabold text-emerald-400 mt-0.5">
                          {off.discountType === "percentage"
                            ? `${off.discountValue}% OFF`
                            : `₹${off.discountValue} FLAT OFF`}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {off.description || "Special promotional deal."}
                      </p>

                      {/* Criteria Tags */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="rounded bg-background px-2 py-0.5 border border-border">
                          Min: {off.minHours} hr(s)
                        </span>
                        <span className="rounded bg-background px-2 py-0.5 border border-border uppercase">
                          {off.applicablePlatform === "all" ? "All Zones" : `${off.applicablePlatform} Zone`}
                        </span>
                        <span className="rounded bg-background px-2 py-0.5 border border-border">
                          {off.validUntil}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                      <button
                        onClick={() => openOfferModal(off)}
                        className={ghostBtn}
                        title="Edit offer"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteOfferTarget(off)}
                        className={dangerBtn}
                        title="Delete offer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: USER POINTS & MANUAL ADJUSTMENTS */}
      {subTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Gamer Points &amp; Balance Adjustments
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage gamer reward balances, grant promotional bonus points, or adjust balances
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search gamer name, phone..."
                className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {users === null ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No matching gamers found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Gamer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-right">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {u.name || "Gamer"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {u.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-primary text-base">
                        {u.rewardPoints.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {adjustingUser === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleQuickAdjust(u, -10)}
                                className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
                                title="Deduct 10 points"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(u, 10)}
                                className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                                title="Add 10 points"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(u, 50)}
                                className="rounded bg-primary/20 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/30 transition"
                                title="Add 50 points"
                              >
                                +50
                              </button>
                              <button
                                onClick={() => {
                                  setCustomAdjustUser(u);
                                  setCustomDelta(100);
                                  setCustomReason("");
                                }}
                                className="rounded border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                                title="Custom adjustment"
                              >
                                Custom
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT REWARD OPTION */}
      <Modal
        open={optionModalOpen}
        onClose={() => setOptionModalOpen(false)}
        title={editingOption ? "Edit Reward Redeem Option" : "Add Reward Redeem Option"}
      >
        <form onSubmit={handleSaveOption} className="space-y-4">
          <div>
            <label className={labelCls}>Reward Title *</label>
            <input
              type="text"
              required
              value={optTitle}
              onChange={(e) => setOptTitle(e.target.value)}
              placeholder="e.g. ₹50 Café Voucher or 1 Free Gaming Hour"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Points Required *</label>
              <input
                type="number"
                required
                min="1"
                value={optPoints}
                onChange={(e) => setOptPoints(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Discount Value (₹)</label>
              <input
                type="number"
                min="0"
                value={optDiscount}
                onChange={(e) => setOptDiscount(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Reward Category</label>
              <select
                value={optType}
                onChange={(e) => setOptType(e.target.value)}
                className={inputCls}
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Display Icon</label>
              <select
                value={optIcon}
                onChange={(e) => setOptIcon(e.target.value)}
                className={inputCls}
              >
                {ICON_OPTIONS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Badge / Pill Label</label>
              <input
                type="text"
                value={optBadge}
                onChange={(e) => setOptBadge(e.target.value)}
                placeholder="e.g. Most Popular, Café Perk"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input
                type="number"
                value={optSort}
                onChange={(e) => setOptSort(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={2}
              value={optDesc}
              onChange={(e) => setOptDesc(e.target.value)}
              placeholder="Explain how the gamer can redeem or apply this reward..."
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="optActiveCheck"
              checked={optActive}
              onChange={(e) => setOptActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="optActiveCheck" className="text-xs font-semibold text-foreground cursor-pointer">
              Active &amp; visible in Gamer Portal redemption list
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setOptionModalOpen(false)}
              className={ghostBtn}
            >
              Cancel
            </button>
            <button type="submit" disabled={savingOption} className={primaryBtn}>
              {savingOption ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingOption ? "Update Reward Option" : "Create Reward Option"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT OFFER */}
      <Modal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title={editingOffer ? "Edit Promotional Offer" : "Create New Promotional Offer"}
      >
        <form onSubmit={handleSaveOffer} className="space-y-4">
          <div>
            <label className={labelCls}>Offer Title *</label>
            <input
              type="text"
              required
              value={offTitle}
              onChange={(e) => setOffTitle(e.target.value)}
              placeholder="e.g. Happy Hours 25% Off"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Coupon Code *</label>
              <input
                type="text"
                required
                value={offCode}
                onChange={(e) => setOffCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                placeholder="e.g. HAPPY25"
                className={`${inputCls} uppercase font-mono font-bold text-primary`}
              />
            </div>
            <div>
              <label className={labelCls}>Badge / Highlight</label>
              <input
                type="text"
                value={offBadge}
                onChange={(e) => setOffBadge(e.target.value)}
                placeholder="e.g. Weekday Special, Hot Deal"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Discount Type</label>
              <select
                value={offType}
                onChange={(e) => setOffType(e.target.value as "percentage" | "flat")}
                className={inputCls}
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="flat">Flat Amount (₹) Discount</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {offType === "percentage" ? "Discount Percentage (%)" : "Flat Discount (₹)"}
              </label>
              <input
                type="number"
                required
                min="1"
                value={offValue}
                onChange={(e) => setOffValue(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Applicable Platform</label>
              <select
                value={offPlatform}
                onChange={(e) =>
                  setOffPlatform(e.target.value as "all" | "pc" | "ps5" | "racing")
                }
                className={inputCls}
              >
                <option value="all">All Platforms (PC, PS5, Racing)</option>
                <option value="pc">PC Zone Only</option>
                <option value="ps5">PS5 Zone Only</option>
                <option value="racing">Racing Sim Only</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Min Booking Hours</label>
              <input
                type="number"
                min="1"
                value={offMinHours}
                onChange={(e) => setOffMinHours(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Validity Date / Duration</label>
            <input
              type="text"
              value={offValidUntil}
              onChange={(e) => setOffValidUntil(e.target.value)}
              placeholder="e.g. Ongoing, or Valid until 31 Dec 2026"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={2}
              value={offDesc}
              onChange={(e) => setOffDesc(e.target.value)}
              placeholder="Describe terms, timing, or how gamers can avail this offer..."
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="offActiveCheck"
              checked={offActive}
              onChange={(e) => setOffActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="offActiveCheck" className="text-xs font-semibold text-foreground cursor-pointer">
              Active &amp; published for gamers to apply
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setOfferModalOpen(false)}
              className={ghostBtn}
            >
              Cancel
            </button>
            <button type="submit" disabled={savingOffer} className={primaryBtn}>
              {savingOffer ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingOffer ? "Update Offer" : "Publish Offer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODALS */}
      {deleteOptionTarget && (
        <Modal
          open={Boolean(deleteOptionTarget)}
          onClose={() => setDeleteOptionTarget(null)}
          title="Delete Reward Option"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete the reward option{" "}
              <strong>"{deleteOptionTarget.title}"</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              Existing redeemed vouchers will not be affected, but gamers will no longer be able to select this item.
            </p>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button onClick={() => setDeleteOptionTarget(null)} className={ghostBtn}>
                Cancel
              </button>
              <button onClick={handleDeleteOption} className={dangerBtn}>
                <Trash2 className="h-4 w-4" /> Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteOfferTarget && (
        <Modal
          open={Boolean(deleteOfferTarget)}
          onClose={() => setDeleteOfferTarget(null)}
          title="Delete Promotional Offer"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete offer{" "}
              <strong>"{deleteOfferTarget.title}"</strong> (Code:{" "}
              <span className="font-mono font-bold">{deleteOfferTarget.code}</span>)?
            </p>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button onClick={() => setDeleteOfferTarget(null)} className={ghostBtn}>
                Cancel
              </button>
              <button onClick={handleDeleteOffer} className={dangerBtn}>
                <Trash2 className="h-4 w-4" /> Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CUSTOM POINTS ADJUSTMENT */}
      {customAdjustUser && (
        <Modal
          open={Boolean(customAdjustUser)}
          onClose={() => setCustomAdjustUser(null)}
          title={`Adjust Points for ${customAdjustUser.name || customAdjustUser.phone}`}
        >
          <form onSubmit={handleCustomAdjust} className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-3 text-xs flex justify-between items-center">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-display font-bold text-primary text-base">
                {customAdjustUser.rewardPoints} points
              </span>
            </div>

            <div>
              <label className={labelCls}>Points Change (Negative to deduct)</label>
              <input
                type="number"
                required
                value={customDelta}
                onChange={(e) => setCustomDelta(Number(e.target.value))}
                placeholder="e.g. +100 or -50"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                New balance will be:{" "}
                <span className="font-semibold text-foreground">
                  {Math.max(0, customAdjustUser.rewardPoints + customDelta)} points
                </span>
              </p>
            </div>

            <div>
              <label className={labelCls}>Reason / Audit Note</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Tournament winner bonus, Café compensation"
                className={inputCls}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCustomAdjustUser(null)}
                className={ghostBtn}
              >
                Cancel
              </button>
              <button type="submit" className={primaryBtn}>
                Apply Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
