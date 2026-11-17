export type PlanKey =
  | "cowFattening"
  | "goatRearing"
  | "buffaloFattening"
  | "premiumCowFattening"
  | "sheepRearing"
  | "goatFattening";

export type PlanCategory = "cow" | "goat" | "buffalo" | "sheep";
export type PlanStatus = "open" | "coming-soon" | "fully-funded";

export interface PlanMeta {
  key: PlanKey;
  slug: string;
  image: string;
  category: PlanCategory;
  division: string;
  district: string;
  durationMonths: number;
  roiMin: number;
  roiMax: number;
  status: PlanStatus;
  statusVariant: "approved" | "neutral" | "funded";
  ctaVariant: "dark" | "outline" | "disabled";
  ctaHref?: string;
  unitsFunded: number;
  unitsTotal: number;
  isFullyFunded: boolean;
  isComingSoon: boolean;
  muted?: boolean;
}

export const PLANS: PlanMeta[] = [
  {
    key: "cowFattening",
    slug: "cow-fattening",
    image: "/images/Cow-Fattening-Plan.png",
    category: "cow",
    division: "Dhaka",
    district: "Gazipur",
    durationMonths: 6,
    roiMin: 15,
    roiMax: 20,
    status: "open",
    statusVariant: "approved",
    ctaVariant: "dark",
    ctaHref: "/plans/cow-fattening",
    unitsFunded: 7,
    unitsTotal: 15,
    isFullyFunded: false,
    isComingSoon: false,
  },
  {
    key: "goatRearing",
    slug: "goat-rearing",
    image: "/images/Goat-Rearing-Plan.png",
    category: "goat",
    division: "Mymensingh",
    district: "Mymensingh",
    durationMonths: 4,
    roiMin: 12,
    roiMax: 18,
    status: "open",
    statusVariant: "approved",
    ctaVariant: "dark",
    ctaHref: "/plans/goat-rearing",
    unitsFunded: 4,
    unitsTotal: 10,
    isFullyFunded: false,
    isComingSoon: false,
  },
  {
    key: "buffaloFattening",
    slug: "buffalo-fattening",
    image: "/images/Buffalo-Fattening-Plan.png",
    category: "buffalo",
    division: "Rajshahi",
    district: "Rajshahi",
    durationMonths: 8,
    roiMin: 18,
    roiMax: 25,
    status: "coming-soon",
    statusVariant: "neutral",
    ctaVariant: "outline",
    ctaHref: "/plans/buffalo-fattening",
    unitsFunded: 0,
    unitsTotal: 0,
    isFullyFunded: false,
    isComingSoon: true,
    muted: true,
  },
  {
    key: "premiumCowFattening",
    slug: "premium-cow-fattening",
    image: "/images/premium-cow-fattening.png",
    category: "cow",
    division: "Chattogram",
    district: "Chattogram",
    durationMonths: 6,
    roiMin: 20,
    roiMax: 28,
    status: "open",
    statusVariant: "approved",
    ctaVariant: "dark",
    ctaHref: "/plans/premium-cow-fattening",
    unitsFunded: 2,
    unitsTotal: 5,
    isFullyFunded: false,
    isComingSoon: false,
  },
  {
    key: "sheepRearing",
    slug: "sheep-rearing",
    image: "/images/sheep-rearing.png",
    category: "sheep",
    division: "Sylhet",
    district: "Sylhet",
    durationMonths: 5,
    roiMin: 14,
    roiMax: 20,
    status: "open",
    statusVariant: "approved",
    ctaVariant: "dark",
    ctaHref: "/plans/sheep-rearing",
    unitsFunded: 5,
    unitsTotal: 25,
    isFullyFunded: false,
    isComingSoon: false,
  },
  {
    key: "goatFattening",
    slug: "goat-fattening",
    image: "/images/goat-fattening.png",
    category: "goat",
    division: "Khulna",
    district: "Khulna",
    durationMonths: 3,
    roiMin: 10,
    roiMax: 15,
    status: "fully-funded",
    statusVariant: "funded",
    ctaVariant: "disabled",
    unitsFunded: 12,
    unitsTotal: 12,
    isFullyFunded: true,
    isComingSoon: false,
  },
];

export function findPlanBySlug(slug: string): PlanMeta | undefined {
  return PLANS.find((p) => p.slug === slug);
}