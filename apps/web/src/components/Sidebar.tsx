"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Recipes", href: "/recipes" },
  { label: "Ingredients", href: "/ingredients" },
  { label: "Categories", href: "/categories" },
  { label: "Tags", href: "/tags" },
  { label: "Meal Plans", href: "/meal-plans" },
  { label: "Users", href: "/users" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-olive-800 text-white flex flex-col">
      <div className="p-6">
        <h1 className="font-[family-name:var(--font-manrope)] text-lg font-bold">
          DNS Admin
        </h1>
      </div>
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-olive-600 text-white"
                      : "text-olive-100 hover:bg-olive-600/50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
