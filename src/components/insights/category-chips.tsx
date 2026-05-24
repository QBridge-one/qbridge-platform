import Link from "next/link";
import { INSIGHT_CATEGORIES } from "@/content/insights/categories";

interface CategoryChipsProps {
  /** Pass the active category slug to highlight it, or "all" for the index. */
  active: "all" | string;
}

/** Responsive chip row. Styles in src/app/insights/insights.css. */
export function CategoryChips({ active }: CategoryChipsProps) {
  const items: Array<{ label: string; href: string; slug: string }> = [
    { label: "All", href: "/insights", slug: "all" },
    ...INSIGHT_CATEGORIES.map((c) => ({
      label: c.label,
      href: `/insights/category/${c.slug}`,
      slug: c.slug,
    })),
  ];

  return (
    <div className="qb-chips">
      {items.map((item) => {
        const isActive = item.slug === active;
        return (
          <Link
            key={item.slug}
            href={item.href}
            className={`qb-chip${isActive ? " is-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
