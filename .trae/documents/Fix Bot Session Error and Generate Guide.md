I have successfully started the bot, but it encountered a runtime error immediately: `TypeError: Cannot read properties of undefined (reading 'language')`. This indicates that `ctx.session` is undefined when the language middleware runs, causing the bot to crash when processing updates.

I will fix this issue and then proceed to generate the comprehensive guide requested.

## 1. Fix Session Middleware Issue
-   **Action**: Modify `apps/telegram-service/src/bot.ts` to add a safety check for `ctx.session`.
-   **Reason**: The `session()` middleware might not be initializing the session object for some updates, or there's a timing issue. I will ensure `ctx.session` is defined before accessing properties on it.

## 2. Re-build and Restart
-   **Action**: Run `npm run build` for the telegram service.
-   **Action**: Restart the bot (`node apps/telegram-service/dist/bot.js`) to verify the fix.

## 3. Generate Comprehensive Guide (Uzbek)
-   **Action**: Create the detailed guide as requested in the user's prompt ("Terminal#1-487").
-   **Context**: I will use "Master Prompt" as the product name, with the goal of "Professional AI Prompt Engineering" and target audience of "AI Users & Developers".
-   **Structure**: I will strictly follow the 7-section format provided in the prompt.

I will proceed with the code fix first to ensure the bot is actually working while the user reads the guide.
