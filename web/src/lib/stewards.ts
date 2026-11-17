import type { PlanKey } from "./plans";

export type StewardType = "individual" | "organization";
export type StewardRole = "farmer" | "veterinarian" | "agronomist";

export interface StewardReview {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface Steward {
  id: string;
  slug: string;
  name: string;
  type: StewardType;
  role?: StewardRole;
  location: string;
  division: string;
  categories: ("cattle" | "goats" | "sheep" | "buffalo")[];
  ratingAvg?: number;
  ratingCount?: number;
  description: string;
  image: string;
  /** Profile-page-only fields — optional so directory can render without them */
  longBio?: string[];
  operatingArea?: string;
  livestockFocus?: string;
  stewardTypeLabel?: string;
  currentOpportunitiesCount?: number;
  reviews?: StewardReview[];
  relatedPlans?: PlanKey[];
}

export const STEWARDS: Steward[] = [
  {
    id: "1",
    slug: "mujeeb-hossain",
    name: "Mujeeb Hossain",
    type: "individual",
    role: "farmer",
    location: "Mymensingh, Bangladesh",
    division: "Mymensingh",
    categories: ["cattle", "goats"],
    ratingAvg: 4.8,
    ratingCount: 24,
    description:
      "Coordinates livestock operations and farmer activities across Mymensingh.",
    image: "/images/why-visual.png",
    longBio: [
      "Mujeeb Hossain coordinates livestock activities and investment operations for cattle and goat projects across the Mymensingh region. He works closely with local farmers to support livestock care, updates, expense reviews and sale coordination throughout the investment journey.",
      "His role is centred on practical coordination: he helps ensure that livestock activities are visible, that updates are consistent, and that eligible expenses and sale processes are handled with clarity for investors.",
    ],
    operatingArea: "Mymensingh, Bangladesh",
    livestockFocus: "Cattle · Goats",
    stewardTypeLabel: "Individual Steward",
    currentOpportunitiesCount: 2,
    reviews: [
      {
        id: "r1",
        quote:
          "The updates were consistent and the livestock information was easy to follow. I always knew what was happening with the investment.",
        author: "Tanvir R.",
        role: "Investor",
      },
      {
        id: "r2",
        quote:
          "Good coordination and regular updates throughout the livestock cycle.",
        author: "Fahan A.",
        role: "Investor",
      },
    ],
    relatedPlans: ["cowFattening", "goatRearing"],
  },
  {
    id: "2",
    slug: "rahman-agro-stewardship",
    name: "Rahman Agro Stewardship",
    type: "organization",
    location: "Mymensingh, Bangladesh",
    division: "Mymensingh",
    categories: ["cattle", "goats"],
    ratingAvg: 4.8,
    ratingCount: 24,
    description:
      "Coordinates livestock operations and farmer activities across Mymensingh.",
    image: "/images/hero-image-wrapper.png",
  },
  {
    id: "3",
    slug: "green-field-livestock",
    name: "Green Field Livestock",
    type: "organization",
    location: "Bogura, Bangladesh",
    division: "Bogura",
    categories: ["cattle", "sheep"],
    description:
      "Coordinates livestock operations and farmer activities across Bogura.",
    image: "/images/card-image.png",
  },
];

export function findStewardBySlug(slug: string): Steward | undefined {
  return STEWARDS.find((s) => s.slug === slug);
}

export const ALL_DIVISIONS = [
  "Mymensingh",
  "Bogura",
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Sylhet",
  "Khulna",
] as const;

export const ALL_CATEGORIES = [
  { value: "cattle", labelKey: "cattle" },
  { value: "goats", labelKey: "goats" },
  { value: "sheep", labelKey: "sheep" },
  { value: "buffalo", labelKey: "buffalo" },
] as const;