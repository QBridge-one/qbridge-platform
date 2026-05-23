/**
 * Theme fonts for the active shadcn/tweakcn palette.
 *
 * Active palette: clean-slate
 *
 * To swap the color palette:
 *   yarn shadcn add @tweakcn/<theme-name> --yes
 *
 * After swapping, update the imports below to match the new theme's
 * `--font-sans`, `--font-serif`, and `--font-mono` values in globals.css.
 * Color tokens are updated by the CLI; fonts are configured here.
 */
import { Inter, JetBrains_Mono, Merriweather } from "next/font/google";

const themeSans = Inter({
  subsets: ["latin"],
  variable: "--font-theme-sans",
});

const themeSerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-theme-serif",
});

const themeMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-theme-mono",
});

export const themeFontClassName = [
  themeSans.variable,
  themeSerif.variable,
  themeMono.variable,
].join(" ");
