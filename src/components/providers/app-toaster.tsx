"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

/** Radix Dialog/Sheet marks sibling portaled nodes (incl. Sonner) as
 *  inert while open, which blocks toast action clicks. Keep the toast
 *  host interactive so "View transaction" links work over open sheets. */
function keepSonnerInteractive() {
  document.querySelectorAll("[data-sonner-toaster], [data-sonner-toast]").forEach((el) => {
    el.removeAttribute("inert");
    if (el.getAttribute("aria-hidden") === "true") {
      el.removeAttribute("aria-hidden");
    }
  });
}

export function AppToaster() {
  useEffect(() => {
    keepSonnerInteractive();
    const observer = new MutationObserver(keepSonnerInteractive);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["inert", "aria-hidden"],
    });
    return () => observer.disconnect();
  }, []);

  return <Toaster />;
}
