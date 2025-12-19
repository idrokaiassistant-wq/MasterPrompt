I will update the application's design and color scheme to be modern, professional, and consistent.

### 1. Update Color Palette (apps/web/src/app/globals.css)
I will replace the standard neutral grayscale palette with a modern "Indigo/Violet" based theme, which is popular for AI and SaaS tools.

**New Palette Strategy:**
- **Primary:** Deep Indigo/Violet (`hsl(262 83% 58%)`). This conveys intelligence and creativity.
- **Background:**
    - **Light:** Very soft, cool blue-gray (`hsl(210 40% 98%)`) instead of plain white, to reduce eye strain and look more premium.
    - **Dark:** Rich, deep navy (`hsl(222 47% 11%)`) instead of pure black, for better depth.
- **Surface/Card:**
    - **Light:** Pure White (`hsl(0 0% 100%)`) with subtle borders.
    - **Dark:** Dark Slate (`hsl(217 33% 17%)`) to contrast with the deep background.
- **Accents:** Vibrant Pink/Fuchsia for gradients and highlights to add a "modern AI" feel.

### 2. Update Tailwind Config (apps/web/tailwind.config.ts)
I will ensure the Tailwind configuration correctly maps to these new CSS variables and remove any conflicting hardcoded colors (like the hardcoded `blue` object if it's interfering).

### 3. Refactor Components for Consistency
I will review and update key components to use these new semantic colors instead of hardcoded utility classes (e.g., changing `bg-blue-600` to `bg-primary` or using the new theme gradients).

**Target Components:**
- `TopBar`: Ensure it uses the new background/blur effects.
- `Sidebar`: Update active states to use the new primary color.
- `Button`: Ensure standard buttons use the new `primary` color.
- `PromptInput` & `OutputCard`: Update gradient borders and glows to match the new Indigo-Pink theme.

### 4. Verification
I will check that the new colors are applied consistently across light and dark modes.