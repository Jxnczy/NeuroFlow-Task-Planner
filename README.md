<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HvWoRt5ZSTW_yvoG04R_O9wqnHZvo6CZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## App Entry & Onboarding Flow

The app uses a deterministic state machine (`useEntryRouting`) to decide the initial screen:

1.  **Loading**: Checks Supabase session.
2.  **Feature Overview**: Shown for **new users** (unauthenticated & haven't seen overview).
    *   *Tracking Key*: `neuroflow_onboarding_seen_v1` (localStorage). To reset onboarding, delete this key.
3.  **Login**: Shown for returning unauthenticated users.
4.  **Vault Unlock**: Shown for authenticated users with encrypted data (locked).
5.  **App Dashboard**: Shown for authenticated users with unlocked vault.

**Versioning**: Bump the key suffix (e.g., `_v2`) in `src/hooks/useEntryRouting.ts` to force-show the overview again for all users.
