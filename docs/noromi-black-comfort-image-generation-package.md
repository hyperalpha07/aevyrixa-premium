# Noromi Care Black Comfort Image Generation Package

Status: Production prompt and import-preparation package. This file does not authorize image generation, Supabase upload, database mutation, or application-code changes.

## Product source of truth

- Slug: `period-panty-everyday-black-comfort`
- Name: Noromi Care Leak-Proof Period Panty - Black Comfort
- Category: Reusable Period Panty
- Color: Black
- Absorbency: Moderate
- Sizes: XS, S, M, L, XL, XXL
- Approved visual reference: `e9c3f580-6851-42d3-beff-1a2d40282421.jpg`

Use the approved source image as a visual reference only. Never overwrite, alter, delete, or upload over it. Any generated or composited garment must preserve the actual SKU's black color, silhouette, waistband, lace, seams, gusset, and proportions. If the reference does not clearly establish a physical detail, do not invent that detail.

## Product-safe visual identity

- Premium, clean feminine-care ecommerce presentation with a calm, trustworthy tone.
- Product-focused and suitable for customers in Bangladesh; avoid clinical, explicit, sensational, or embarrassment-based styling.
- Supporting palette: vivid Noromi pink and magenta, purple, lavender, blush, a very small gold accent, deep purple copy, and a soft warm background.
- Keep the garment a realistic neutral black. Do not recolor it purple, blue, grey, or pink.
- Use soft diffused studio light, realistic fabric texture, gentle natural shadows, ample negative space, and restrained graphic accents.
- Keep all essential product details and text inside the central 80% safe area so square thumbnails and mobile galleries remain readable.
- Use the approved Noromi Care logo artwork when a logo is shown. Do not ask a generation model to invent, redraw, or approximate the logo.
- Treat generated photography and final typography as separate production stages. Generate a clean text-safe composition first, then typeset only the exact approved copy during layout. This prevents broken or invented wording.

## Global negative prompt

Append this negative prompt to every generation request:

> No Aevyrixa, Aevyrixa Her Care, Her Care, Hygeia, competitor name, supplier watermark, marketplace badge, placeholder LOGO text, misspelled brand name, invented logo, fake review, testimonial, star rating, award, certification mark, OEKO-TEX, ISO, CE, FDA, medical cross, laboratory symbol, clinical diagram, Ag+, antibacterial, antimicrobial, germ-killing, bacteria, fungus, virus, yeast, named microorganism, irritation-prevention claim, rash claim, infection claim, odor-control claim, tampon equivalence, pad equivalence, 36ML, 40ML, capacity number, all-night, overnight, guaranteed leak-proof, never leaks, 100% leak-proof, verified-lab claim, test result, absorbency duration, 100% cotton, unverified material percentage, S-4XL, 3XL, 4XL, measurements, body-size comparison, misleading fit claim, invented courier badge, fake courier logo, delivery-time guarantee, free-delivery badge, fake review, fake certification, blood simulation, blue-liquid demonstration, explicit body styling, sexualized pose, model wearing underwear, malformed garment, altered lace, altered seams, extra waistband, fabricated layer cross-section, fake packaging, or invented accessory.

## Shared production and export requirements

- Aspect ratio: exactly 1:1.
- Master canvas: 2000 x 2000 px.
- Minimum accepted source: 1600 x 1600 px; do not upscale a smaller source.
- Working color space: sRGB IEC61966-2.1.
- Delivery format: WebP.
- Suggested WebP quality: 82-88, selected by visual inspection.
- Target delivery size: under 600 KB when achievable without banding, halos, broken type, or loss of black fabric detail.
- Background: opaque, with no accidental transparency or light fringe around the black garment.
- Retain a layered, non-destructive working master outside the storefront delivery package.
- Strip unnecessary metadata while retaining the correct sRGB profile.
- Use each filename exactly as specified below.

## A. Folded product close-up

### Delivery specification

- Filename: `noromi-care-black-comfort-folded-detail.webp`
- Intended gallery position: 2
- Purpose: Folded black product close-up
- Alt text: `Folded Noromi Care Black Comfort reusable period panty`

### Exact generation prompt

> Create a premium square ecommerce product photograph using the supplied approved reference image of the Noromi Care Black Comfort reusable period panty as the strict garment reference. Show the actual black garment neatly folded at a three-quarter angle on a soft warm blush-to-cream studio surface. Preserve the real silhouette, black color, waistband, lace finish, seams, gusset placement, fabric texture, and proportions from the reference; do not invent construction. Make the garment occupy about 70 percent of the frame and place it slightly below the optical center. Use soft diffused lighting, subtle natural shadows, visible detail in the black fabric, restrained lavender styling, and at most one small non-badge-like gold or petal accent. Leave uncluttered text-safe space in the upper-left within the central 80 percent safe area. The mood is calm, premium, discreet, trustworthy, product-focused feminine care for a Bangladesh ecommerce storefront. No model, no body, no explicit or clinical styling. Generate the photographic composition without rendered words or an invented logo; add the approved Noromi Care logo and exact approved text during controlled typesetting.

### Exact on-image text

Use only these three lines:

```text
Noromi Care
Black Comfort
Reusable period panty
```

No punctuation, slogan, badge, extra benefit, capacity, material, absorbency, medical, or certification copy may be added.

### Composition and typography handoff

- Place the approved Noromi Care logo/wordmark in the upper-left safe area.
- Set `Black Comfort` below it as the primary product label.
- Set `Reusable period panty` as a smaller supporting line.
- Ensure the waistband and lace face the camera and remain unobstructed.
- Avoid props other than a neutral paper or fabric surface that cannot be mistaken for an included item.
- Confirm that the garment and product name remain recognizable in a 56 x 56 px thumbnail.

### Asset QA checklist

- [ ] Garment matches the approved source image and remains neutral black.
- [ ] Waistband, lace, seams, and gusset are truthful and unobstructed.
- [ ] Only the three approved text lines appear, spelled exactly.
- [ ] Approved logo artwork is used; no generated or old-brand logo appears.
- [ ] No model, body crop, packaging, accessory bundle, wetness test, or performance diagram appears.
- [ ] No capacity, medical, certification, material, antibacterial, odor, or overnight claim appears.
- [ ] Black textile detail is visible without crushed shadows or artificial gloss.
- [ ] Copy remains readable on mobile and stays inside the safe area.
- [ ] Export filename, dimensions, profile, quality, and format are correct.

## B. Four-layer and waistband detail

### Delivery specification

- Filename: `noromi-care-black-comfort-four-layer-detail.webp`
- Intended gallery position: 3
- Purpose: Fabric/waistband detail plus claim-light benefit card
- Alt text: `Black Comfort fabric and four-layer support detail`

### Exact generation prompt

> Create a premium square ecommerce product-detail composition using genuine close-up crops from the supplied approved Black Comfort product reference. Use an approximately 60/40 layout: realistic macro photography of the exact black waistband, lace, fabric, seam, and gusset details on the left, and a clean claim-light information area on the right. Preserve the real SKU construction and texture; do not create an exploded layer stack or invent layer materials. Use a soft blush or warm off-white background, deep-purple typography space, and restrained pink, magenta, lavender, purple, and minimal gold line accents. Keep the visual informative and approachable rather than scientific. Use soft diffused light and retain texture in the black fabric. Leave sufficient clean space for the approved benefit text, all inside the central 80 percent safe area. The mood is trustworthy, premium, clear, and mobile-readable for a Bangladesh ecommerce storefront. No liquid test, laboratory visual, medical icon, shield, bacteria graphic, absorbency meter, or performance chart. Generate the product-detail imagery without rendered words or an invented logo; apply the approved Noromi Care logo and exact approved text in controlled typesetting afterward.

### Exact on-image text

Use only:

```text
Noromi Care
Black Comfort
4-layer leak-proof support
Moderate absorbency
Breathable comfort
Flexible waistband
```

The word `support` must remain in `4-layer leak-proof support`. Do not shorten it to an absolute leak-proof claim.

### Composition and typography handoff

- Keep authentic product macros on the left and the text hierarchy on the right.
- A numeral `4` may appear only as part of the exact approved phrase; it must not introduce an invented layer diagram.
- Use subtle dividers or simple dots, not medical, certification, shield, droplet-volume, or laboratory icons.
- Make `4-layer leak-proof support` and `Moderate absorbency` readable at typical mobile gallery width.
- Do not name layer materials or show a cutaway unless separately verified evidence becomes available.

### Asset QA checklist

- [ ] All product details come from the exact Black Comfort SKU.
- [ ] All six approved text lines match exactly.
- [ ] `Support` qualifies the leak-proof wording.
- [ ] `Moderate absorbency` appears with no all-night or overnight implication.
- [ ] No cross-section, layer composition, fabric claim, or product construction is invented.
- [ ] No capacity number, duration, medical, certification, antibacterial, microorganism, odor, or cotton claim appears.
- [ ] No placeholder logo or generated typography remains.
- [ ] Main copy is readable on mobile and stays inside the safe area.
- [ ] Export filename, dimensions, profile, quality, and format are correct.

## C. Size availability card

### Delivery specification

- Filename: `noromi-care-black-comfort-size-options.webp`
- Intended gallery position: 4
- Purpose: Simple size availability card
- Alt text: `Black Comfort available sizes XS to XXL`

### Exact generation prompt

> Create a clean premium square ecommerce size-availability card for the Noromi Care Black Comfort reusable period panty. Use a soft blush or warm off-white background, deep-purple text-safe areas, restrained Noromi pink and purple outlines, and a minimal gold accent. Include a small supporting crop or faithful silhouette derived from the supplied approved black product reference in the lower-right; preserve the actual garment shape and do not imply different body shapes or fit outcomes. Reserve the main area for six equal, clearly separated size chips arranged as one balanced row or two balanced rows. This is availability information only, not a measurement chart. Keep all elements in the central 80 percent safe area, with high contrast, generous spacing, and mobile-first readability. No person, body silhouette comparison, ruler, tape measure, waist/hip diagram, measurement unit, size conversion, or fit promise. Generate the clean background and product-supporting composition without rendered words or an invented logo; apply the approved Noromi Care logo and exact approved text during controlled typesetting.

### Exact on-image text

Use only:

```text
Noromi Care
Black Comfort
Available sizes
XS  S  M  L  XL  XXL
```

Render all six sizes separately, exactly once, in that order. Do not use a range shorthand instead of the explicit list.

### Composition and typography handoff

- Put the approved wordmark and `Black Comfort` in the upper-left safe area.
- Use `Available sizes` as the main heading.
- Give all six size chips equal visual weight.
- Do not add measurements, conversion tables, recommendation copy, stock status, or body/fit guidance.
- Ensure `XS` and `XXL` are both present and visually distinct.

### Asset QA checklist

- [ ] Exact ordered list is `XS, S, M, L, XL, XXL`.
- [ ] Each size appears once; no size is omitted, duplicated, or added.
- [ ] No S-4XL shorthand, 3XL, 4XL, measurement, conversion, or fit promise appears.
- [ ] Supporting garment art matches the black source SKU.
- [ ] No body diagram or misleading body/fit implication appears.
- [ ] Approved logo and exact typography are crisp and correctly spelled.
- [ ] Every size is readable on mobile and within the safe area.
- [ ] Export filename, dimensions, profile, quality, and format are correct.

## D. Discreet packaging flat lay

### Delivery specification

- Filename: `noromi-care-black-comfort-discreet-packaging.webp`
- Intended gallery position: 5
- Purpose: Folded black product with discreet Noromi Care packaging flat lay
- Alt text: `Black Comfort period panty with discreet Noromi Care packaging`

### Production prerequisite

Use photographs of the actual approved production packaging only. If that packaging is not available, create a composition proof without a package for layout review, but do not approve or export it as the final packaging asset. Never generate an invented Noromi Care package and present it as the delivered product.

### Exact generation/compositing prompt

> Create a premium square overhead ecommerce flat lay using the supplied approved image of the exact Black Comfort garment and approved photographs of the real production packaging. Show the genuine black period panty neatly folded as the main product, alongside the real plain discreet outer mailer and any real approved Noromi Care inner package or insert. Preserve the actual garment, packaging materials, colors, proportions, closures, and branding. The outer delivery mailer must remain plain and must not expose sensitive product wording. Use a soft cream or blush background, a restrained lavender fabric or paper accent, soft diffused lighting, realistic contact shadows, and ample negative space. Let the folded product occupy roughly 45 percent of the frame and the genuine packaging roughly 30 percent. Reserve a quiet vertical text-safe area for three service statements and the approved wordmark, all within the central 80 percent safe area. The result should feel discreet, calm, trustworthy, and appropriate for delivery to customers in Bangladesh. Generic line icons may depict a closed parcel, a neutral Bangladesh outline, and an order-confirmation check, but must not resemble courier, certification, security, or medical badges. Generate or composite the visual without rendered words or an invented logo; add only the approved Noromi Care logo and exact approved text during controlled typesetting.

### Exact on-image text

Use only:

```text
Noromi Care
Discreet packaging
Bangladesh delivery
Order confirmation before dispatch
```

Do not add delivery speed, nationwide guarantee, free delivery, cash-on-delivery, courier, tracking, return, exchange, or support promises.

### Composition and typography handoff

- Use the actual folded product and actual fulfilment materials.
- Put the approved Noromi Care branding only where it appears truthfully in the delivered packaging experience.
- Keep sensitive product wording off the visible outer mailer.
- Use generic, non-badge-like icons only when they improve comprehension.
- Do not show customer names, addresses, telephone numbers, order IDs, or functional barcode data.

### Asset QA checklist

- [ ] Product matches the approved Black Comfort source image.
- [ ] Packaging matches actual approved fulfilment materials.
- [ ] Outer mailer remains discreet and exposes no sensitive product wording.
- [ ] Only the four approved text lines appear, spelled exactly.
- [ ] No delivery-time, free-delivery, COD, courier, tracking, refund, or return promise appears.
- [ ] No customer data, functional barcode, fake badge, review, or certification appears.
- [ ] Noromi Care branding appears only where truthful.
- [ ] Text and core subjects remain clear on mobile and within the safe area.
- [ ] Export filename, dimensions, profile, quality, and format are correct.

## Package-level QA checklist

- [ ] Four final files use the exact required filenames.
- [ ] Each file is 1:1, 2000 x 2000 px master, sRGB WebP, quality 82-88.
- [ ] Each file targets less than 600 KB without visible quality loss.
- [ ] Only the exact approved text for that asset appears.
- [ ] No forbidden claim, word, logo, badge, number, icon, or implication appears.
- [ ] Noromi Care branding is correct; no Aevyrixa, Her Care, Hygeia, or placeholder branding remains.
- [ ] The garment is the truthful black SKU and no physical construction is invented.
- [ ] Sizes are exactly XS, S, M, L, XL, XXL.
- [ ] There are no misleading body, fit, medical, certification, capacity, or performance claims.
- [ ] Typography is correctly spelled, unbroken, high-contrast, and readable on mobile.
- [ ] Packaging artwork is blocked until actual production packaging is available and verified.
- [ ] Every image is manually reviewed at full resolution, storefront size, and thumbnail size.

## Future import checklist

Do not execute these steps until the four assets receive explicit manual approval:

1. Review every generated/composited image against the product source, exact-copy block, negative prompt, and QA checklist.
2. Confirm the packaging image uses actual approved fulfilment materials.
3. Upload only approved files to Supabase Storage; do not overwrite or delete existing objects.
4. Update the product `images` array only through a separately approved admin/database workflow.
5. Keep `e9c3f580-6851-42d3-beff-1a2d40282421.jpg` as the safe primary image.
6. Remove the duplicate safe gallery reference later only after approval, without deleting its Storage object.
7. Keep the public safety filter active until replacement URLs are imported and verified on the live storefront.
8. After import, verify `/product`, the Black Comfort detail page, thumbnails, main image, zoom/lightbox, cart image, metadata image, mobile cropping, and broken-image behavior.

## Delivery manifest

| Position | Exact filename | Approval gate |
| ---: | --- | --- |
| 2 | `noromi-care-black-comfort-folded-detail.webp` | Brand and product-accuracy review |
| 3 | `noromi-care-black-comfort-four-layer-detail.webp` | Product and claims review |
| 4 | `noromi-care-black-comfort-size-options.webp` | Catalog size review |
| 5 | `noromi-care-black-comfort-discreet-packaging.webp` | Brand and fulfilment review; real packaging required |
