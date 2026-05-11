export type ProductFeature = {
  title: string;
  text: string;
};

export type Product = {
  id: string;
  slug: string;
  shopifyHandle: string;
  shopifyVariantId: string;
  name: string;
  category: string;
  accent: "cyan" | "fuchsia" | "amber";
  price: string;
  compareAtPrice: string;
  numericPrice: number;
  saveText: string;
  shortDescription: string;
  reviewSummary: string;
  reviewScore: string;
  gallery: string[];
  inStock: boolean;
  featuredImage: string;
  shippingNotes: string[];
  features: ProductFeature[];
  reviewQuotes: string[];
};

export const products: Product[] = [
  {
    id: "prod_her_care_period_panty",
    slug: "her-care-period-panty",
    shopifyHandle: "her-care-period-panty",
    shopifyVariantId: "gid://shopify/ProductVariant/43284638597179",
    name: "Aevyrixa Her Care Period Panty",
    category: "Reusable Period Care",
    accent: "fuchsia",
    price: "$39.00",
    compareAtPrice: "$59.00",
    numericPrice: 39,
    saveText: "Save 34%",
    shortDescription:
      "Soft, discreet reusable period protection with a premium fit and comfort-first layered coverage.",
    reviewSummary: "4.9 rating - loved for comfort and discreet protection",
    reviewScore: "4.9/5",
    featuredImage: "css-her-care-period-panty",
    gallery: ["Front Fit", "Layer Detail", "Soft Waist", "Care View"],
    inStock: true,
    shippingNotes: [
      "Discreet packaging for a more comfortable delivery experience.",
      "Shipping time depends on destination and demand.",
      "Tracking details are shared after dispatch.",
      "Support is available for order and delivery questions.",
    ],
    features: [
      {
        title: "Layered Protection",
        text: "Designed to help manage light to moderate flow while staying comfortable for daily wear.",
      },
      {
        title: "Soft Stretch Fit",
        text: "Flexible fabric moves with your body and keeps the silhouette discreet under outfits.",
      },
      {
        title: "Reusable Care",
        text: "Simple rinse, gentle wash, and air dry steps support repeated wear.",
      },
      {
        title: "Premium Feel",
        text: "Refined finishing and smooth edges make period care feel calmer and more polished.",
      },
    ],
    reviewQuotes: [
      "The fit feels soft and secure without looking bulky.",
      "Comfortable enough for a full day and easy to care for after.",
      "A practical upgrade that feels more premium than my usual period products.",
    ],
  },
  {
    id: "prod_her_care_overnight",
    slug: "her-care-overnight-short",
    shopifyHandle: "her-care-overnight-short",
    shopifyVariantId: "gid://shopify/ProductVariant/00000000000002",
    name: "Aevyrixa Her Care Overnight Short",
    category: "Extra Coverage Care",
    accent: "cyan",
    price: "$45.00",
    compareAtPrice: "$69.00",
    numericPrice: 45,
    saveText: "Save 35%",
    shortDescription:
      "Extended reusable coverage with a secure, soft feel for nights, travel, and heavier routine days.",
    reviewSummary: "4.8 rating - loved for coverage and comfort",
    reviewScore: "4.8/5",
    featuredImage: "css-her-care-overnight-short",
    gallery: ["Front Fit", "Coverage View", "Comfort Band", "Care View"],
    inStock: true,
    shippingNotes: [
      "Discreet packaging for a more comfortable delivery experience.",
      "Delivery timing depends on location and order volume.",
      "Tracking information is provided once the order is shipped.",
      "Customer support is available for sizing, care, or delivery assistance.",
    ],
    features: [
      {
        title: "Extended Coverage",
        text: "A longer shape supports extra confidence through overnight wear and busy days.",
      },
      {
        title: "Gentle Waistband",
        text: "Soft stretch keeps the fit secure without adding harsh pressure.",
      },
      {
        title: "Breathable Comfort",
        text: "Smooth materials help the piece feel wearable, discreet, and easy to move in.",
      },
      {
        title: "Reusable Routine",
        text: "Built for simple care steps that make repeat use easier.",
      },
    ],
    reviewQuotes: [
      "The extra coverage makes nights feel much easier.",
      "Soft enough to sleep in and still feels secure.",
      "I like that it feels supportive without looking bulky.",
    ],
  },
  {
    id: "prod_her_care_starter_set",
    slug: "her-care-starter-set",
    shopifyHandle: "her-care-starter-set",
    shopifyVariantId: "gid://shopify/ProductVariant/00000000000003",
    name: "Aevyrixa Her Care Starter Set",
    category: "Cycle Care Set",
    accent: "amber",
    price: "$79.00",
    compareAtPrice: "$109.00",
    numericPrice: 79,
    saveText: "Save 28%",
    shortDescription:
      "A premium starter bundle for building a reusable period care routine with comfort and discretion.",
    reviewSummary: "4.8 rating - loved for value and routine coverage",
    reviewScore: "4.8/5",
    featuredImage: "css-her-care-starter-set",
    gallery: ["Set View", "Fit Options", "Layer Detail", "Care View"],
    inStock: true,
    shippingNotes: [
      "Discreet packaging for a more comfortable delivery experience.",
      "Estimated shipping time depends on destination.",
      "Tracking is shared after order fulfillment.",
      "Support remains available for sizing, care, or order concerns.",
    ],
    features: [
      {
        title: "Routine Ready",
        text: "A simple set for rotating reusable pieces through your cycle.",
      },
      {
        title: "Comfort Coverage",
        text: "Includes practical coverage options for everyday confidence.",
      },
      {
        title: "Premium Materials",
        text: "Soft stretch and smooth finishing create a more elevated feel.",
      },
      {
        title: "Easy Upkeep",
        text: "Care instructions are simple enough for regular reuse.",
      },
    ],
    reviewQuotes: [
      "The set made it easier to switch into reusable care.",
      "Good value and the pieces feel comfortable.",
      "A polished starter option for a less stressful cycle routine.",
    ],
  },
];
