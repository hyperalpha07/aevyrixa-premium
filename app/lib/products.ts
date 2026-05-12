export type ProductVisualTheme = "blush-violet" | "cyan-night" | "rose-gold";

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  numericPrice: number;
  category: string;
  sizes: string[];
  colors: string[];
  absorbency: "Light" | "Moderate" | "Heavy/Night";
  absorbencyOptions: string[];
  benefits: string[];
  care: string[];
  seoTitle: string;
  seoDescription: string;
  visualTheme: ProductVisualTheme;
};

export const productSizes = ["XS", "S", "M", "L", "XL", "XXL"];
export const productColors = ["Black", "Nude", "Soft Pink"];

export const products: Product[] = [
  {
    id: "aev-her-care-everyday-comfort",
    slug: "everyday-comfort",
    name: "Aevyrixa Her Care Period Panty - Everyday Comfort",
    shortDescription:
      "Soft reusable period underwear for lighter routine days with a smooth, discreet fit.",
    description:
      "Everyday Comfort is designed for light-flow days, backup coverage, and calm daily wear. The silhouette feels refined under outfits while the reusable layered gusset supports a simpler care routine.",
    price: "$34.00",
    compareAtPrice: "$44.00",
    numericPrice: 34,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Light",
    absorbencyOptions: ["Light", "Moderate"],
    benefits: [
      "Smooth low-profile shape for everyday outfits",
      "Soft stretch waistband for flexible comfort",
      "Reusable design made for simple cycle routines",
      "Discreet finish with a premium Her Care look",
    ],
    care: [
      "Rinse with cold water after wear",
      "Machine wash cold with similar colors",
      "Use mild detergent and avoid bleach or fabric softener",
      "Air dry fully before storing or wearing again",
    ],
    seoTitle: "Aevyrixa Her Care Everyday Comfort Period Panty",
    seoDescription:
      "Shop Aevyrixa Her Care Everyday Comfort reusable period panty for light-flow days, discreet comfort, and simple care.",
    visualTheme: "blush-violet",
  },
  {
    id: "aev-her-care-heavy-flow-support",
    slug: "heavy-flow-support",
    name: "Aevyrixa Her Care Period Panty - Heavy Flow Support",
    shortDescription:
      "A supportive reusable panty for heavier routine days with secure coverage and soft structure.",
    description:
      "Heavy Flow Support brings a more anchored Her Care feel for days when you want extra coverage. The design focuses on comfort, discretion, and reusable protection without a bulky look.",
    price: "$39.00",
    compareAtPrice: "$52.00",
    numericPrice: 39,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Moderate",
    absorbencyOptions: ["Moderate", "Heavy/Night"],
    benefits: [
      "Supportive coverage for heavier routine days",
      "Soft contouring edges designed to reduce visible bulk",
      "Reusable layered gusset for repeat wear",
      "Premium dark-cyan visual identity for a confident feel",
    ],
    care: [
      "Rinse in cold water until water runs clearer",
      "Machine wash cold on a gentle cycle",
      "Do not use bleach, fabric softener, or high heat",
      "Air dry in a ventilated space before reuse",
    ],
    seoTitle: "Aevyrixa Her Care Heavy Flow Support Period Panty",
    seoDescription:
      "Explore Aevyrixa Her Care Heavy Flow Support reusable period panty with secure comfort and discreet reusable coverage.",
    visualTheme: "cyan-night",
  },
  {
    id: "aev-her-care-night-comfort",
    slug: "night-comfort",
    name: "Aevyrixa Her Care Period Panty - Night Comfort",
    shortDescription:
      "Extended comfort for sleep, travel, and long wear moments with a soft secure feel.",
    description:
      "Night Comfort is shaped for overnight routines and longer wear windows. It pairs extended coverage with a smooth waistband and soft materials so rest feels less interrupted.",
    price: "$42.00",
    compareAtPrice: "$56.00",
    numericPrice: 42,
    category: "Reusable Period Panty",
    sizes: productSizes,
    colors: productColors,
    absorbency: "Heavy/Night",
    absorbencyOptions: ["Heavy/Night"],
    benefits: [
      "Extended coverage designed for overnight comfort",
      "Soft rise and waistband for relaxed long wear",
      "Reusable construction for repeat cycle support",
      "Rose-gold and ivory accents for a premium care mood",
    ],
    care: [
      "Rinse cold after use before washing",
      "Wash cold with gentle detergent",
      "Avoid ironing, dry cleaning, bleach, and fabric softener",
      "Air dry completely; do not tumble dry on high heat",
    ],
    seoTitle: "Aevyrixa Her Care Night Comfort Period Panty",
    seoDescription:
      "Shop Aevyrixa Her Care Night Comfort reusable period panty for overnight routines, soft coverage, and reusable care.",
    visualTheme: "rose-gold",
  },
];
