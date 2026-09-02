# Noromi Care Product Media Replacement Plan

Status: Approved launch-safety production specification. This document does not authorize database or Supabase Storage mutation.

## Current public gallery state

The public product detail gallery builds its media list with the normalized primary image first, followed by allowed gallery images. Duplicate URLs are removed, thumbnails appear when more than one media item remains, and a product with no allowed gallery images continues to show its primary image.

The main gallery frame is near-square and uses `object-contain`. Thumbnails are square and use `object-cover`. New assets should therefore use a consistent 1:1 canvas with important content inside a central safe area.

| Product | Current public media | Effective unique visuals | Current limitation |
| --- | --- | ---: | --- |
| `period-panty-everyday-black-comfort` | Safe primary `e9c3f580-6851-42d3-beff-1a2d40282421.jpg` plus safe gallery URL `2516afb0-785b-430f-b17f-d48f36764d7c.jpg` | 1 | The second URL is a byte-for-byte duplicate of the primary, so the gallery repeats the same photograph. |
| `period-panty-organic-cotton-comfort` | Safe primary `12cc3907-adf9-47a5-a12f-aa4cef3f03b3.jpg` | 1 | Primary-only fallback works, but the page lacks useful alternate views and product details. |

## Production standards

- Minimum launch set: five unique images per product, consisting of the retained primary plus four replacements.
- Recommended delivery: 1:1 aspect ratio, 1600 x 1600 px or 2000 x 2000 px, sRGB, WebP at an appropriate ecommerce quality setting.
- Keep faces, text, logos, and product details at least 10% inside every edge so square thumbnail cropping remains readable.
- Use genuine product and production-packaging photography. Do not depict a material, construction detail, package, or included item that customers will not receive.
- Product photographs should normally contain no performance copy. Put the limited approved wording on separate Noromi Care benefit cards.
- Use the finalized Noromi Care logo only. No supplier, marketplace, competitor, placeholder, or certification branding may appear without written approval.
- Size artwork may list available sizes only. Do not publish body or garment measurements until the exact measurement method and values have been verified.

## Global claim controls

### Forbidden without product-specific evidence and approval

- Ag+, antibacterial, antimicrobial, germ-killing, or named microorganism claims
- OEKO-TEX, ISO, CE, FDA, or other certification/regulatory marks
- 36ML, 40ML, tampon equivalence, or comparisons with sanitary products
- Medical, therapeutic, infection, rash, or irritation-prevention claims
- Odor-control performance
- 100% cotton or exact material percentages
- Absolute leak guarantees such as “never leaks” or “100% leak-proof”
- All-night positioning for the Moderate-absorbency Black Comfort product

### Always forbidden in launch assets

- Other brand names, supplier watermarks, marketplace badges, and placeholder text such as `LOGO`
- Invented reviews, test results, certifications, capacity, measurements, awards, or included accessories

## Black Comfort minimum launch set

Product slug: `period-panty-everyday-black-comfort`

Retain the existing primary at gallery position 1. Produce four new images for positions 2–5. The safe duplicate gallery URL should not count as a launch asset and should be removed from the gallery array during the later approved media update; its Storage object does not need to be deleted.

| Position | Purpose and safe visual concept | Claims allowed | Claims forbidden | Ratio | Recommended filename | Recommended alt text | Replacement mapping |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 2 | Folded product close-up showing the actual black color, seams, gusset area, and lace/waist finish on a clean cream or blush surface. | Product name; black color; reusable period panty. | Capacity, all-night, antibacterial, medical, certification, fabric-percentage, or performance guarantees. | 1:1 | `noromi-care-black-comfort-folded-detail.webp` | `Folded Noromi Care Black Comfort reusable period panty` | Replaces denied `516030da-8b6a-4950-a3eb-5269c6cd1651.jpg`. |
| 3 | Noromi Care claim-light detail card using real close-up photography of the fabric and waistband with a small four-layer support callout. | “4-layer leak-proof support”; “Moderate absorbency”; “breathable comfort”; “flexible waistband.” Use qualified support wording, not a guarantee. | 36ML, 40ML, Ag+, microorganisms, 100% cotton, all-night, odor-control, certification, or absolute leak prevention. | 1:1 | `noromi-care-black-comfort-four-layer-detail.webp` | `Black Comfort fabric and four-layer support detail` | Replaces denied `9b248a04-b653-4989-a2b8-66f9a3f76c95.jpg` and consolidates the safe purpose of denied `536b4128-9b41-4ba2-8944-6b83f0422f9e.jpg`, `a149ded5-c3d7-4046-b3c8-e93658ffe731.jpg`, and `476f49f3-cada-4ec9-b27a-f99e1c26947b.jpg`. |
| 4 | Simple Noromi Care size-availability card. Show only `XS, S, M, L, XL, XXL`. Add verified garment measurements later only after checking the actual stock. | “Available sizes”; `XS, S, M, L, XL, XXL`; neutral fit guidance such as “Choose your usual fit or ask us for help.” | 3XL, 4XL, unverified centimetre/inch values, body-shape guarantees, or unsupported stretch ranges. | 1:1 | `noromi-care-black-comfort-size-options.webp` | `Black Comfort available sizes XS to XXL` | Replaces denied `0b69b9ab-2f46-484b-b56d-b82cf16604b1.jpg`. |
| 5 | Genuine product-and-packaging flat lay using the actual discreet delivery packaging. If production packaging is unavailable, use a neutral product flat lay without packaging. | “Discreet packaging”; “Bangladesh delivery”; “Order confirmation before dispatch.” | Delivery-time guarantee, free-delivery promise, medical claims, capacity, certification, or packaging not actually used. | 1:1 | `noromi-care-black-comfort-discreet-packaging.webp` | `Black Comfort period panty with discreet Noromi Care packaging` | Fills the useful packaging slot left after the remaining denied artwork is retired. |

### Black Comfort evidence-gated later set

| Position | Purpose | Evidence required | Claims allowed after approval | Claims still forbidden | Ratio | Recommended filename | Recommended alt text | Mapping |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Tested absorbency/capacity card. | A product-specific test report identifying this exact SKU, test method, sample count, and final approved value. | One verified capacity value and qualified test wording. | Showing both 36ML and 40ML; tampon equivalence; absolute protection guarantees. | 1:1 | `noromi-care-black-comfort-verified-absorbency.webp` | `Verified absorbency information for Black Comfort period panty` | Optional successor to the retired 36ML/40ML artwork. |
| 7 | Verified material construction card. | Supplier composition sheet tied to this exact SKU and, if used, independent fabric verification. | Exact verified material wording and percentages. | “100% cotton,” antibacterial, Ag+, or microorganism claims without separate supporting evidence and approval. | 1:1 | `noromi-care-black-comfort-verified-materials.webp` | `Verified material details for Black Comfort period panty` | Optional successor to denied `476f49f3-cada-4ec9-b27a-f99e1c26947b.jpg`. |

## Organic Cotton Comfort minimum launch set

Product slug: `period-panty-organic-cotton-comfort`

Retain the existing primary at gallery position 1. Produce four new, claim-light images for positions 2–5. Treat the product name as the approved display name, but do not add cotton percentages, sourcing, or certification language without composition evidence.

| Position | Purpose and safe visual concept | Claims allowed | Claims forbidden | Ratio | Recommended filename | Recommended alt text | Replacement mapping |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 2 | Folded product close-up showing the actual grey color, seams, gusset, and garment finish on a clean lavender or cream surface. | Product display name; grey color; reusable period panty; soft cotton feel. | 100% cotton, certification, 60ML, tampon equivalence, odor-control, or medical claims. | 1:1 | `noromi-care-organic-cotton-comfort-folded-detail.webp` | `Folded Noromi Care Organic Cotton Comfort period panty` | Replaces denied `5ddd3a84-e2ef-45dd-9174-cef8dd39b543.jpg`. |
| 3 | Real fabric and waistband close-up with minimal Noromi Care labels. | “Soft cotton feel”; “comfortable waistband”; “reusable comfort”; exact database absorbency label “Heavy/Night.” | Irritation prevention, second-skin guarantee, seamless claim unless verified, certification marks, exact layer count, or 60ML without evidence. | 1:1 | `noromi-care-organic-cotton-comfort-fabric-detail.webp` | `Organic Cotton Comfort fabric and waistband detail` | Replaces denied `86076b4e-bd9f-451a-98ee-89866d3a21a1.jpg`. |
| 4 | Simple size-availability card listing only `S, M, L, XL`. Measurements must remain absent until verified. | “Available sizes”; `S, M, L, XL`; neutral fit-help wording. | XS, XXL, 1XL–4XL, unverified measurements, or fit guarantees. | 1:1 | `noromi-care-organic-cotton-comfort-size-options.webp` | `Organic Cotton Comfort available sizes S to XL` | Replaces denied `89536c8d-043e-4060-9e17-440620721a91.jpg`. |
| 5 | Genuine product-and-packaging flat lay using actual discreet delivery packaging, or a neutral lifestyle flat lay if production packaging is not ready. | “Discreet packaging”; “Bangladesh delivery”; “Order confirmation before dispatch”; reusable comfort. | 60ML without evidence, tampon equivalence, odor-control, waterproof guarantee, certification marks, or medical claims. | 1:1 | `noromi-care-organic-cotton-comfort-discreet-packaging.webp` | `Organic Cotton Comfort period panty with discreet Noromi Care packaging` | Replaces the launch role of denied `22d0082c-ef11-433a-8320-c088926121e9.jpg`. |

### Organic Cotton Comfort evidence-gated later set

| Position | Purpose | Evidence required | Claims allowed after approval | Claims still forbidden | Ratio | Recommended filename | Recommended alt text | Mapping |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Verified 60ML absorbency card. | Product-specific capacity test identifying the exact SKU and test method. | “60ML absorbency support” with qualified, approved wording. | Tampon equivalence, “in seconds” unless separately tested, and absolute leak guarantees. | 1:1 | `noromi-care-organic-cotton-comfort-verified-60ml.webp` | `Verified absorbency information for Organic Cotton Comfort period panty` | Optional successor to denied `89536c8d-043e-4060-9e17-440620721a91.jpg`. |
| 7 | Verified layer-construction diagram based on the real garment. | Supplier construction sheet or teardown verification tying each layer and material to this SKU. | The verified number of layers and accurate functional, qualified labels. | Odor-control, waterproof guarantee, or cotton composition unless separately verified. | 1:1 | `noromi-care-organic-cotton-comfort-verified-layers.webp` | `Verified layer construction of Organic Cotton Comfort period panty` | Optional successor to denied `22d0082c-ef11-433a-8320-c088926121e9.jpg`. |
| 8 | Product-specific certification card, only if commercially necessary. | Valid certificate, scope, standard/registration number, named manufacturer, exact product applicability, current dates, and permission to display each mark. | Only the precise certification language and marks covered by verified documentation. | Generic ISO, OEKO-TEX, CE, FDA, or other marks that cannot be tied to this exact product. | 1:1 | `noromi-care-organic-cotton-comfort-verified-certifications.webp` | `Verified certifications for Organic Cotton Comfort period panty` | Optional successor to denied `86076b4e-bd9f-451a-98ee-89866d3a21a1.jpg`; omit entirely if proof is incomplete. |

## Later media-update checklist

1. Approve final photography against the physical product and production packaging.
2. Review every embedded word at full size and at the 56px thumbnail size.
3. Confirm file dimensions, color profile, compression, and transparent/solid background behavior.
4. Upload new assets without deleting the existing Supabase Storage objects.
5. Update the product media references through an approved admin or data workflow; do not infer facts from the artwork.
6. Confirm the public gallery order and remove the duplicate Black Comfort gallery reference from the product media array.
7. Verify desktop and mobile product pages, lightbox navigation, thumbnails, alt text, and broken-image handling.
8. Remove filenames from the temporary public denylist only after the raw gallery no longer references them or an individually reviewed replacement supersedes them.

## Approval gates

- Launch gate: retained primary plus four claim-light replacements per product.
- Evidence gate: capacity, construction, composition, performance, and certification assets remain optional and blocked until product-specific documentation is approved.
- Data gate: this plan does not approve SQL, database updates, or Storage deletion. Those require a separate implementation task and review.
