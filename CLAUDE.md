# cenullum.github.io

Personal website / portfolio for Cenker Cennet (indie game developer). Static site, plain HTML/CSS/JS, no build step. Each section lives in its own folder with an `index.html`.

## Shared visual theme (use on EVERY html page)

All pages share one dark, grayscale theme. When creating a new page or tool, copy these CSS variables verbatim into `:root` and build on them so the look stays consistent.

```css
:root {
    --primary-color: #6b7280;   /* gray-500 — buttons, borders, accents */
    --secondary-color: #4b5563; /* gray-600 — button hover, gradients */
    --accent-color: #9ca3af;    /* gray-400 — secondary text, hover borders */
    --dark-bg: #050505;         /* near-black — page background */
    --light-bg: #19191b;        /* dark gray — cards, panels, surfaces */
    --text-light: #fff;         /* primary text on dark bg */
    --text-dark: #333;          /* text on light surfaces */
    --shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    --gradient: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}
```

### Typography
- Body font: `Verdana, Geneva, 'DejaVu Sans', Arial, sans-serif`
- Heading font (h1–h6, titles): `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- Base `line-height: 1.6`; body text color `var(--text-light)` on `var(--dark-bg)`.

### Components & conventions
- **Surfaces / cards / panels:** `background: var(--light-bg)`, `box-shadow: var(--shadow)`.
- **Border radius:** `3px` is the default (buttons, inputs, cards). Larger media cards use `8px`; pills/badges use `12px`. Keep corners subtle.
- **Borders:** `1px solid var(--primary-color)`; on hover shift to `border-color: var(--accent-color)`.
- **Buttons (`.btn`):** `background: var(--primary-color)`, white text, `border-radius: 3px`, `font-weight: 600`. Hover: `background: var(--secondary-color)` + `transform: translateY(-1px)` + `box-shadow: var(--shadow)`.
- **Hover motion:** lift elements with `transform: translateY(-1px/-2px)` and deepen shadow to `0 8px 32px rgba(0,0,0,0.2)`.
- **Transitions:** `all 0.3s ease` is the standard.
- **Inputs / color pickers:** dark, minimal, `var(--light-bg)` background with `var(--primary-color)` border.
- Reset with `* { margin:0; padding:0; box-sizing:border-box; }`.

### Summary of the "feel"
Monochrome, near-black background with layered dark-gray surfaces, white text, gray accents, soft shadows, small 3px radii, gentle lift-on-hover. No bright/saturated accent colors in the shared theme (the older `scoreapp` page uses a blue accent, but that is the exception — new work should follow the grayscale palette above).

## Tools
- `image_localizer/index.html` — "Localization Image Composer": single-file, offline, no-dependency browser tool for generating localized game images (text/image/rect layers, multi-page, multi-language, font + localization import, ZIP export). All logic, ZIP writing, and font cmap parsing are implemented in-file with no external libraries.
</content>
</invoke>
