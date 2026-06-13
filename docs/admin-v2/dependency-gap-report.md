# Admin V2 Dependency Gap Report

## Current Packages Before Admin V2

Runtime:

- `next@16.2.1`
- `react@19.2.4`
- `react-dom@19.2.4`
- `lucide-react@1.7.0`
- `gsap@3.14.2`
- `lenis@1.3.23`

Tooling:

- `typescript@^5`
- `tailwindcss@^4`
- `@tailwindcss/postcss@^4`
- `eslint@^9`
- `eslint-config-next@16.2.1`

## Materio Free TypeScript Packages

The free Materio TypeScript reference uses:

- MUI 5 and Emotion 11;
- `@mui/material-nextjs`;
- `@mui/lab`;
- ApexCharts and `react-apexcharts`;
- `react-perfect-scrollbar`;
- `react-use`;
- Iconify build tooling;
- Next 14 and React 18.

Those versions are not copied because this app is on Next 16 and React 19.

## Packages Added

Installed command:

```bash
npm.cmd install @mui/material @emotion/react @emotion/styled @mui/material-nextjs
```

Added runtime packages:

- `@mui/material@^9.1.1`
- `@mui/material-nextjs@^9.1.1`
- `@emotion/react@^11.14.0`
- `@emotion/styled@^11.14.1`

## Packages Not Required In Phase 1

- `@mui/lab`: no lab-only components are needed for the shell.
- `apexcharts` and `react-apexcharts`: Phase 1 avoids chart dependency risk.
- `react-perfect-scrollbar`: native browser scrolling is sufficient.
- Iconify packages: existing `lucide-react` covers Admin V2 icons.
- `react-use`: local hooks are small and scoped.
- Materio Tailwind/PostCSS/dev tooling: the app already has Next 16, ESLint 9, TypeScript 5, and Tailwind 4.

## Compatibility Risks

- Materio's reference package targets Next 14 and React 18, so package versions were not reused.
- `@mui/material@9.1.1` and `@mui/material-nextjs@9.1.1` were selected by npm for the current app instead of downgrading React or Next.
- `@mui/material-nextjs` still exposes the App Router cache provider under `@mui/material-nextjs/v13-appRouter`, which is used for the scoped Admin V2 provider.
- `npm install` reported 3 vulnerabilities in the full tree. No automated `npm audit fix --force` was run because that can rewrite unrelated versions.

## Exact Install Command For Reproducibility

```bash
npm.cmd install @mui/material @emotion/react @emotion/styled @mui/material-nextjs
```
