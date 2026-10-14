# Marketing Site Expansion Plan

## 🎯 Objective
Transform the single-page landing site into a comprehensive, multi-page marketing platform to build trust, improve SEO, and drive conversions for different buyer personas (SOC Analysts, CISOs, Freelancers).

## 🏗 Architecture & Routing
We will use Next.js App Router to create dedicated pages.

| Page URL | Source File | Purpose |
| :--- | :--- | :--- |
| `/pricing` | `src/app/pricing/page.tsx` | **Critical Conversion Point**. Clear tier differentiation. |
| `/features` | `src/app/features/page.tsx` | Deep dive into technical capabilities (Headers, SPF/DKIM, Malware). |
| `/security` | `src/app/security/page.tsx` | Build trust. Explain "Zero Data Retention" architecture in detail. |
| `/use-cases` | `src/app/use-cases/page.tsx` | SEO lands for specific problems (e.g., "Analyze Phishing Email"). |
| `/docs` | `src/app/docs/page.tsx` | Help center & knowledge base. |
| `/about` | `src/app/about/page.tsx` | Company mission, team, and story. |
| `/blog` | `src/app/blog/page.tsx` | Content marketing & industry updates. |

---

## 🎨 Design Strategy
*   **Aesthetic**: Maintain the current "Dark Mode / Cyber / Glassmorphism" vibe.
    *   Colors: Black/Slate backgrounds, Cyan/Electric Blue accents.
    *   UI: Glass cards (`backdrop-blur`), subtle gradients, mono-spaced fonts for technical data.
*   **Reusable Components**:
    *   `PageHeader`: Consistent hero section for internal pages.
    *   `ContentBlock`: Standardized text + image layouts.
    *   `CTASection`: Reusable "Start Analyzing" band at the bottom of pages.

---

## 📝 Detailed Execution Plan

### 1. Pricing Page (`/pricing`)
*   **Structure**:
    *   Toggle: Monthly / Yearly.
    *   **3 Tiers**:
        *   **Guest (Free)**: No login, limited daily basic analysis.
        *   **Analyst (Pro)**: Enhanced analysis, unlimited history (local), API access.
        *   **Team (Enterprise)**: SSO, Centralized logging, Priority support.
*   **FAQ Section**: Specific to billing and limits.

### 2. Features Detail (`/features`)
*   **Sections**:
    *   **Deep Header Analysis**: Visual explanation of SPF/DKIM/DMARC checks.
    *   **attachment Sandboxing**: How we handle potentially malicious files safely.
    *   **Link Explosion**: Expanding shortened URLs (bit.ly, etc.) invisibly.
    *   **Verdict Engine**: Explanation of the scoring algorithm.

### 3. Security & Privacy (`/security`)
*   **"The Promise"**: We store NOTHING.
*   **Architecture Diagram**: A visual showing client-side processing vs server-side lookups.
*   **Compliance**: GDPR readiness explanation.
*   **Bug Bounty**: Invitation for researchers.

### 4. Use Cases (`/use-cases`)
*   **Format**: Problem -> Solution columns.
*   **Specific Scenarios**:
    *   SOC Automation.
    *   Phishing Simulation Training.
    *   Incident Response Forensics.

### 5. Documentation / Help (`/docs`)
*   *Note: Keeping this simple for V1.*
*   **Categories**: "Getting Started", "Interpreting Results", "Troubleshooting".
*   Search bar functionality.

### 6. About / Team (`/about`)
*   **Mission**: "Democratizing Email Forensics".
*   **Team Grid**: Founders & Core contributors.
*   **Join Us**: Career CTA.

### 7. Blog (`/blog`)
*   **Structure**:
    *   Main listing page with featured article.
    *   Individual post layout (`/blog/[slug]`).
*   **Tech**: Use simple MDX or local markdown files for V1 to avoid CMS complexity initially.

---

## ✅ Action Items & Approval
1.  **Approve Hierarchy**: Does this sitemap look correct?
2.  **Priorities**: Should we build **Pricing** and **Features** first?
3.  **Content**: Do you have specific copy for these pages, or should I generate placeholder "lorem ipsum" / draft copy?

**Ready to start?**
