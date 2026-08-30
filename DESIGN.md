---
name: KBS AI Education Brief
description: A print-first visual system for KBS Cheongju's practical AI education communications.
colors:
  ink: "#17212b"
  muted: "#5f6971"
  paper: "#f7f4ed"
  rule: "#c8c7c0"
  signal: "#df5a2a"
  signal-dark: "#b9411a"
  broadcast-blue: "#244c68"
typography:
  display:
    fontFamily: "KBS Display, sans-serif"
    fontSize: "29px"
    fontWeight: 900
    lineHeight: 1.21
    letterSpacing: "-0.065em"
  outcome:
    fontFamily: "KBS Display, sans-serif"
    fontSize: "17px"
    fontWeight: 900
    lineHeight: 1.35
    letterSpacing: "-0.052em"
  section:
    fontFamily: "KBS Display, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.045em"
  title:
    fontFamily: "KBS Display, sans-serif"
    fontSize: "14px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.045em"
  course:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  route-title:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "12.3px"
    fontWeight: 900
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  outcome-label:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "10.5px"
    fontWeight: 900
    lineHeight: 1.45
    letterSpacing: "0.035em"
  outcome-body:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "10.8px"
    fontWeight: 500
    lineHeight: 1.55
  closing:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "11.3px"
    fontWeight: 800
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  closing-note:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "9.8px"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "10.7px"
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "10px"
    fontWeight: 900
    lineHeight: 1.5
    letterSpacing: "0.03em"
  seal:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "9.2px"
    fontWeight: 900
    lineHeight: 1.28
    letterSpacing: "-0.025em"
  footer:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "9px"
    fontWeight: 600
    lineHeight: 1.45
  mobile-masthead:
    fontFamily: "KBS Sans, sans-serif"
    fontSize: "8px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.065em"
  mobile-display:
    fontFamily: "KBS Display, sans-serif"
    fontSize: "clamp(27px, 8.2vw, 40px)"
    fontWeight: 900
    lineHeight: 1.21
    letterSpacing: "-0.065em"
spacing:
  compact: "2.5mm"
  row: "4mm"
  section: "7mm"
components:
  document-row:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    padding: "4mm 0"
  signal-seal:
    backgroundColor: "transparent"
    textColor: "{colors.signal-dark}"
    typography: "{typography.label}"
    rounded: "50%"
    size: "22mm"
---

# Design System: KBS AI Education Brief

## Overview

**Creative North Star: "The Practical Broadcast Brief"**

This is a print-first education communication system for internal readers deciding whether to join a hands-on AI workshop. It borrows the clarity and calm authority of a production call sheet: facts are ruled into place, the learning path is sequential, and the promised result arrives before supporting detail.

The system is editorial rather than presentational. A page should feel like one carefully composed working document, never a slide divided into decorative card modules. Warm paper keeps the document approachable; broadcast blue carries institutional trust; signal orange marks action, sequence, and input required from the reader.

**Key Characteristics:**

- A single reading path from promised outcome to participation details.
- Fine rules and measured whitespace instead of container cards.
- Strong Korean display type, supported by compact, legible running copy.
- Print-safe placeholders that remain visibly unfinished until logistics are confirmed.

## Colors

The palette uses an off-white paper ground with near-black document ink; blue establishes identity and orange is reserved for navigation and annotations.

### Primary

- **Signal Orange:** Used for sequence numbers, outcomes, date/location placeholders, and the participation seal. Its scarcity keeps action points easy to find.

### Secondary

- **Broadcast Blue:** Used for the masthead, institutional labels, major rules, and primary factual emphasis.

### Neutral

- **Document Ink:** The default high-contrast reading color for headings and critical information.
- **Quiet Copy:** Used for explanations that should support, not compete with, the headline.
- **Warm Paper:** The page field for both screen preview and A4 output.
- **Document Rule:** Separates facts and steps without creating boxed modules.

**The Signal-Only Rule.** Use signal orange only when content changes the reader's action or place in the flow; never use it as a general decoration.

## Typography

**Display Font:** KBS Display (self-hosted NanumGothic Bold, with sans-serif fallback)
**Body Font:** KBS Sans (self-hosted NanumGothic Regular, with sans-serif fallback)

**Character:** The display voice is compact, heavy, and direct so the first promise reads at a glance. The body voice is unembellished and slightly smaller, allowing detailed internal information to remain clear in print.

### Hierarchy

- **Display** (900, 29px, 1.21): The one page-level promise; use at most once per A4 surface.
- **Headline** (900, 17px, 1.35): The tangible learning outcome.
- **Section** (900, 16px, 1.25): Major document sections.
- **Title** (900, 14px, 1.2): Detail section headings.
- **Course** (800, 13px, 1.5): The course name below the page-level promise.
- **Route Title** (900, 12.3px, 1.35): The practical name of each learning stage.
- **Outcome Label / Body** (900 or 500, 10.5–10.8px): The compact result annotation and supporting outcome explanation.
- **Closing** (800, 11.3px, 1.55): The final participation invitation.
- **Closing Note** (500, 9.8px, 1.45): The short instruction beneath the final invitation.
- **Body** (500, 10.7–11px, 1.54–1.66): Supporting explanations and descriptions.
- **Label** (900, 10px, tracked): Compact factual labels and masthead information.
- **Seal / Footer** (900 or 600, 9–9.2px): Small utility information and the closing seal.

**The Two-Voice Rule.** Do not add a third decorative font. Hierarchy comes from scale, weight, alignment, and rule placement.

## Layout

The reference surface is a 210mm × 297mm A4 page with 14mm side insets, a 12mm top inset, and a 10mm bottom inset. A subtle left document guide aligns the entire reading flow. Use 7mm gaps between major sections, 4mm row rhythm for sequential content, and 2.5mm for paired factual details.

On narrow screens, preserve the document reading order: the two-column introductory and detail blocks stack, the route becomes a numbered two-column list with detail below its title, and the seal may disappear. Never convert the route or attendance information into cards at the mobile breakpoint.

## Elevation & Depth

The system is flat by default. The page itself may have a soft ambient preview shadow on a gray workspace, but the printed document has no shadow. Depth comes from ruled hierarchy, paper tone, and spacing rather than elevated modules.

**The Paper-Not-Card Rule.** Use lines to divide information; do not place individual facts or learning steps in rounded containers.

## Shapes

Rules are straight and fine: 1px for normal divisions, 1.5–2px for major section breaks. The only recurring curved form is the circular participation seal, outlined in orange and slightly rotated. Do not introduce generic rounded cards, pills, or soft panels.

## Components

### Document Rows

- **Character:** A restrained ruled row that carries a number, title, and explanation without visual boxing.
- **Shape:** No radius; a bottom document rule separates each row.
- **Color:** Sequence is signal orange, title is broadcast blue, and explanatory copy is quiet copy.

### Fact List

- **Character:** A two-column print ledger for participation information.
- **Shape:** No container or radius; each fact is separated by a thin rule.
- **State:** Unconfirmed logistics use underlined signal-orange text, not gray placeholder copy.

### Participation Seal

- **Character:** A small orange outlined proof mark that anchors the call to action.
- **Shape:** Circular (50%) at 22mm; slight negative rotation is the only intentional asymmetry.

## Do's and Don'ts

### Do:

- **Do** lead with the practical output before describing the curriculum.
- **Do** preserve confirmed facts and make unknown logistics visibly replaceable.
- **Do** use one uninterrupted sequence for multi-step learning.
- **Do** keep Korean font assets self-hosted for reliable offline printing.

### Don't:

- **Don't** structure an A4 education brief as equal-sized benefit cards.
- **Don't** place a small label above a heading to simulate hierarchy.
- **Don't** use gradients, emoji, generic icons, or heavy shadows as a stand-in for content.
- **Don't** turn date, location, or contact placeholders into invented facts.
