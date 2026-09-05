# Workspace Rules & Coding Guidelines

## Typography & Formatting Constraints
- **NEVER use em dashes ("—")**: Always use standard hyphens ("-") with space padding instead. Do NOT emit the em dash character anywhere in code, copy, user-facing text, comments, or documentation.
- **NO emojis**: Use Lucide React icons exclusively across the application UI.

## Code Standards
- Always verify TypeScript compiles cleanly with `npx tsc --noEmit` before finishing tasks.
- Keep the Executive Overview high-density and fit for a single desktop viewport.
- Never display mock/placeholder logistics or supply chain data until real telemetry routes are implemented.
- **ALWAYS use stylized custom dropdowns**: Never use raw, unstyled native HTML `<select>` elements. Dropdowns must be beautifully styled, theme-aware, custom popover components with search filtering where appropriate.
- **Always follow the facts when building something that relates to data, dont guess anything**: Never substitute synthetic constants, hardcoded guesses, or arbitrary fallbacks when real telemetry is missing or being calculated. Ground calculations strictly on recorded facts and historical data.

## Git & Deployment Rules
- **NEVER run `git push` under any circumstances unless the user explicitly tells you to push**: Commits and pushes to remote repositories (GitHub/Vercel) must strictly be requested by the user. Do NOT push proactively.

