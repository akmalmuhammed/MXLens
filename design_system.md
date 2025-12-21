# MXLens Design System

> **Version**: 1.0.0
> **Last Updated**: Dec 21, 2024
> **Status**: Live

## 1. Typography
We use a distinct tri-font system to separate marketing copy, UI text, and technical data.

### Font Families
| Role | Font Family | Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Heading** | **Outfit** | `var(--font-outfit)` | Headlines (`h1`-`h6`), Impact text, Hero sections. Modern, geometric sans-serif. |
| **Body** | **Inter** | `var(--font-inter)` | General UI text, paragraphs, labels. High legibility standard. |
| **Code** | **JetBrains Mono** | `var(--font-mono)` | URLs, Headers, Hex dumps, JSON, Verdict logs. |

### Type Scale
| Element | Size | weight | Leading | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| `h1` Display | 4.5rem (72px) | 800 (ExtraBold) | 1.1 | -0.02em |
| `h2` Title | 3rem (48px) | 700 (Bold) | 1.2 | -0.01em |
| `h3` Section | 1.875rem (30px) | 600 (SemiBold) | 1.3 | Normal |
| `p` Body | 1rem (16px) | 400 (Regular) | 1.6 | Normal |
| `code` | 0.875rem (14px) | 500 (Medium) | 1.5 | Normal |

---

## 2. Color System
Our palette relies on a high-contrast slate foundation with electric cyan accents, designed primarily for dark mode utility in SOC environments.

### Primary Palette (Dark Mode)
The default experience for security analysts.
*   **Background**: `#0B0F19` (Rich Navy Black)
*   **Foreground**: `#F8FAFC` (Slate-50)
*   **Primary (Brand)**: `#00D9FF` (Electric Cyan)
*   **Secondary**: `#1E293B` (Slate-800)
*   **Accent**: `#164E63` (Cyan-900/Navy)

### Secondary Palette (Light Mode)
Optimized for documentation and marketing pages.
*   **Background**: `#F8FAFC` (Slate-50)
*   **Foreground**: `#0F172A` (Slate-900)
*   **Primary (Brand)**: `#0891B2` (Deep Cyan-600)
*   **Secondary**: `#E2E8F0` (Slate-200)

### Functional Colors
| Role | Color (Hex) | Usage |
| :--- | :--- | :--- |
| **Destructive** | `#BE123C` (Rose-700) | Malware detected, High risk, Delete actions. |
| **Success** | `#10B981` (Emerald-500) | Clean verdict, Passed checks. |
| **Warning** | `#F59E0B` (Amber-500) | Suspicious, SPF SoftFail. |
| **Muted** | `#94A3B8` (Slate-400) | Secondary text, placeholders. |

---

## 3. Iconography
We use **Lucide React** for consistency, stroke width, and scalability.

*   **Stroke Width**: 2px (Default)
*   **Size**: `w-4 h-4` (Small/UI), `w-6 h-6` (Feature), `w-12 h-12` (Hero/Cards).
*   **Custom Icons**: If 3rd party icons are needed (e.g. brand logos), they must:
    1.  Be SVG format.
    2.  Use `currentColor` for fill/stroke.
    3.  Match the 2px stroke weight of Lucide.

---

## 4. Spacing & Layout
We utilize the Tailwind CSS default spacing scale based on a **4px grid**.

*   **Containers**:
    *   `container mx-auto px-4`: Standard wrapper.
    *   Prioritize `max-w-7xl` (1280px) for wide dashboard views.
    *   Prioritize `max-w-2xl` (672px) for reading text (blogs, docs).

*   **Border Radius**:
    *   `rounded-md` (0.5rem / 8px): Standard for buttons, inputs, cards.
    *   `rounded-xl` (0.75rem / 12px): Large cards, modals.
    *   `rounded-full`: Pills, badges, avatars.

---

## 5. Components

### Buttons
| Variant | Usage |
| :--- | :--- |
| **Default** (Primary) | Main CTAs (e.g., "Analyze Email"). Solid background (Cyan). |
| **Secondary** | Alternative actions (e.g., "Export PDF"). Muted background. |
| **Destructive** | Dangerous actions (e.g., "Clear History"). Red background. |
| **Ghost** | Low priority (e.g., "Cancel", "Dashboard" link). Transparent. |

### Inputs & Forms
*   **Default State**: Border `border-input` (Slate-800), Bg `bg-background`.
*   **Focus State**: Ring `ring-2 ring-primary/50`, Border `border-primary`.
*   **Error State**: Border `border-destructive`, Ring `ring-destructive/50`.

### Cards
*   **Glassmorphism**: A key brand element.
    *   Class: `bg-card/50 backdrop-blur-sm border border-border/50`.
    *   Hover: `hover:border-cyan-500/30 hover:shadow-lg`.

---

## 6. UI States

### Empty States
Used when a list or dashboard view has no data.
*   **Pattern**:
    1.  Centered Icon (Muted, `w-12 h-12`).
    2.  Title ("No emails found").
    3.  Description ("Upload a .eml file to start").
    4.  Primary CTA Button ("Upload").

### Loading States
*   **Skeleton**: Use `animate-pulse bg-muted rounded` placeholders creating a wireframe of the content.
*   **Spinner**: For actions, use a `Loader2` icon with `animate-spin` class.

### Error States
*   **Global**: Full screen 404/500 page with links home.
*   **Inline**: Red text (#F43F5E) below input fields.
*   **Alerts**: Top-banner alerts for system connection issues.
