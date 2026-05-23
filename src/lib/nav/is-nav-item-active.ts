/**
 * Returns true when `href` is the best-matching nav target for `pathname`.
 * Prevents parent routes (e.g. /settings) from staying active on child
 * pages (e.g. /settings/team).
 */
export function isNavItemActive(
  href: string,
  pathname: string,
  base: string,
  allHrefs: readonly string[],
): boolean {
  if (href === base) return pathname === base;
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;

  return !allHrefs.some(
    (h) =>
      h !== href &&
      h.length > href.length &&
      h.startsWith(`${href}/`) &&
      (pathname === h || pathname.startsWith(`${h}/`)),
  );
}
