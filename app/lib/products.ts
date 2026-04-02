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
    id: "prod_flame_diffuser",
    slug: "flame-diffuser",
    shopifyHandle:
      "led-flame-aroma-diffuser-volcanic-humidifier-with-color-night-light",
    shopifyVariantId: "gid://shopify/ProductVariant/43284638597179",
    name: "LED Flame Aroma Diffuser – Volcanic Humidifier with Color Night Light",
    category: "Home Gadgets",
    accent: "amber",
    price: "$69.99",
    compareAtPrice: "$89.99",
    numericPrice: 69.99,
    saveText: "Save 22%",
    shortDescription:
      "A premium flame-style aroma diffuser that combines humidifier comfort, volcanic visual effect, and colorful night lighting for a more luxurious atmosphere.",
    reviewSummary: "4.9 rating • loved for premium flame effect and relaxing vibe",
    reviewScore: "4.9/5",
    featuredImage: "/products/flame-diffuser/1.png",
    gallery: [
      "/products/flame-diffuser/1.png",
      "/products/flame-diffuser/2.png",
      "/products/flame-diffuser/3.png",
      "/products/flame-diffuser/4.png",
    ],
    inStock: true,
    shippingNotes: [
      "Fast order processing with careful packaging for safe delivery.",
      "Shipping time depends on destination and demand.",
      "Tracking details are shared after dispatch.",
      "Support is available for order and delivery questions.",
    ],
    features: [
      {
        title: "Volcanic Flame Effect",
        text: "Creates a rich flame-style glow that makes the room feel more premium and relaxing.",
      },
      {
        title: "Humidifier Comfort",
        text: "Helps improve the atmosphere of your room while adding a modern smart-living feel.",
      },
      {
        title: "Color Night Light",
        text: "Built-in lighting enhances mood and makes the diffuser more visually attractive at night.",
      },
      {
        title: "Luxury Home Vibe",
        text: "Perfect for bedrooms, desks, side tables, and elegant modern home setups.",
      },
    ],
    reviewQuotes: [
      "The flame effect looks beautiful and makes the room feel much more premium.",
      "Very stylish diffuser and the night light makes it even better.",
      "A perfect product if you want both relaxation and aesthetic atmosphere.",
    ],
  },
  {
    id: "prod_diffuser",
    slug: "diffuser",
    shopifyHandle: "diffuser",
    shopifyVariantId: "gid://shopify/ProductVariant/00000000000002",
    name: "Luxury Diffuser",
    category: "Home Wellness",
    accent: "fuchsia",
    price: "$39.00",
    compareAtPrice: "$59.00",
    numericPrice: 39,
    saveText: "Save 34%",
    shortDescription:
      "An elegant aroma diffuser that blends wellness, premium design, and modern home atmosphere in one refined product.",
    reviewSummary: "4.8 rating • loved for calm atmosphere and stylish design",
    reviewScore: "4.8/5",
    featuredImage: "/products/diffuser/1.png",
    gallery: [
      "/products/diffuser/1.png",
      "/products/diffuser/2.png",
      "/products/diffuser/3.png",
      "/products/diffuser/4.png",
    ],
    inStock: true,
    shippingNotes: [
      "Packed carefully to protect the diffuser body during shipping.",
      "Delivery timing depends on location and order volume.",
      "Tracking information is provided once the order is shipped.",
      "Customer support is available for setup or delivery assistance.",
    ],
    features: [
      {
        title: "Relaxing Home Atmosphere",
        text: "Helps create a calm and elegant environment for bedrooms, living rooms, and personal spaces.",
      },
      {
        title: "Premium Visual Appeal",
        text: "Designed to look luxurious and refined while fitting naturally into modern interiors.",
      },
      {
        title: "Wellness-Inspired Use",
        text: "Perfect for customers who want style, mood, and a more peaceful everyday environment.",
      },
      {
        title: "Easy Lifestyle Upgrade",
        text: "A simple way to make your room feel more polished, inviting, and premium.",
      },
    ],
    reviewQuotes: [
      "Looks beautiful in my room and makes the whole space feel calmer.",
      "Very elegant product design and the atmosphere feels much more premium.",
      "One of those products that makes a room feel instantly upgraded.",
    ],
  },
  {
    id: "prod_desk_gadget",
    slug: "desk-gadget",
    shopifyHandle: "desk-gadget",
    shopifyVariantId: "gid://shopify/ProductVariant/00000000000003",
    name: "Minimal Desk Gadget",
    category: "Smart Essentials",
    accent: "amber",
    price: "$29.00",
    compareAtPrice: "$45.00",
    numericPrice: 29,
    saveText: "Save 36%",
    shortDescription:
      "A sleek smart accessory built to add function, elegance, and a clean premium look to your everyday desk setup.",
    reviewSummary: "4.8 rating • loved for practicality and clean design",
    reviewScore: "4.8/5",
    featuredImage: "/products/desk-gadget/1.png",
    gallery: [
      "/products/desk-gadget/1.png",
      "/products/desk-gadget/2.png",
      "/products/desk-gadget/3.png",
      "/products/desk-gadget/4.png",
    ],
    inStock: true,
    shippingNotes: [
      "Securely packed to keep the product protected during transit.",
      "Estimated shipping time depends on destination.",
      "Tracking is shared after order fulfillment.",
      "Support remains available for product or order concerns.",
    ],
    features: [
      {
        title: "Clean Desk Upgrade",
        text: "Adds a modern premium touch to workspaces, study setups, and minimalist desk environments.",
      },
      {
        title: "Compact and Stylish",
        text: "Small enough to fit easily while still improving the overall look and feel of the setup.",
      },
      {
        title: "Functional Everyday Use",
        text: "Designed for regular use while maintaining a polished and elegant appearance.",
      },
      {
        title: "Premium Setup Feel",
        text: "Great for users who want their desk area to feel more refined, organized, and elevated.",
      },
    ],
    reviewQuotes: [
      "Simple but very premium-looking on the desk.",
      "Nice design, useful feel, and matches modern setups really well.",
      "A small product that makes the whole desk area feel more polished.",
    ],
  },
];