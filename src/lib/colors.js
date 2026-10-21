// ─── Canonical brand colors (JS side) ───────────────────────────────────
// These mirror the CSS vars in src/index.css. When you change a token in
// index.css, update the matching entry here so JSX-driven colors (toast
// icon themes, beam gradients, glow washes) stay in family.

export const BRAND = {
  primary: 'hsl(215 68% 58%)',     // = --primary (blue on dark navy)
  success: 'hsl(145 28% 56%)',     // = --success (sage)
  warning: 'hsl(38 90% 60%)',      // = --warning (amber)
  destructive: 'hsl(8 62% 55%)',   // = --destructive

  // BorderBeam gradient pairs (brightened tints of the tokens)
  blueBeamFrom: 'hsl(215 75% 62%)',   // blue beam start
  blueBeamTo: 'hsl(215 50% 87%)',     // blue beam glow
  sageBeamFrom: 'hsl(138 26% 60%)',
  sageBeamTo: 'hsl(106 26% 91%)',

  // LoginPage ambient glow wash
  loginGlow: 'hsl(218 55% 11%)',      // navy-tinted dark
  loginGlowWash: 'hsl(218 55% 11% / 0.4)',
};
