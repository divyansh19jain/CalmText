// ── Feature flags (code-level switches, not env vars) ───────────────────
// STRIPE_ENABLED
//   true  = Stripe is live: upgrade buttons/popups, checkout return
//           handling, and the free-trial paywall are shown.
//   false = Stripe fully hidden: no upgrade prompts anywhere and the
//           free trial never blocks or upsells.
export const STRIPE_ENABLED = false;
