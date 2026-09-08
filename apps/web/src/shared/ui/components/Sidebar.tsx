"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { normalisePath } from "@/shared/utils/utils"
import { useState } from "react"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Heart,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/components/collapsible"
import { useLogout } from "@/state/domains/auth"

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry

/**
 * Every entry here is a route that exists.
 *
 * It used to carry «Meal Plans», «Settings» and «Support» — three links to
 * pages that were never built, and one page that was built («Favourite
 * statistics») with nothing linking to it. A menu that leads to a 404 makes
 * the reader doubt the items that do work.
 */
const navigation: NavEntry[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
  {
    label: "Content",
    icon: <BookOpen size={20} />,
    items: [
      { label: "Recipes", href: "/recipes" },
      { label: "Products", href: "/products" },
      { label: "Tags", href: "/tags" },
    ],
  },
  {
    label: "Management",
    icon: <Users size={20} />,
    items: [
      { label: "Users", href: "/users" },
      { label: "Support Messages", href: "/support-messages" },
    ],
  },
  { label: "Favourites", href: "/favorite-statistics", icon: <Heart size={20} /> },
]

export function Sidebar() {
  // Normalised: with `trailingSlash: true` the raw value is `/recipes/`
  // while every href below says `/recipes`, so a raw compare never matches.
  const pathname = normalisePath(usePathname())
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useLogout()

  return (
    <aside
      className={`flex flex-col min-h-screen border-r border-border-default bg-bg-canvas transition-all ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-default flex items-center justify-center">
              <span className="text-primary-on-primary text-xs font-bold">RF</span>
            </div>
            <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-text-primary">
              Ratio Fit
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-secondary-active text-icon-default cursor-pointer"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navigation.map((entry) =>
          isGroup(entry) ? (
            <NavGroupItem
              key={entry.label}
              group={entry}
              pathname={pathname}
              collapsed={collapsed}
            />
          ) : (
            <NavLink
              key={entry.href}
              item={entry}
              isActive={pathname === entry.href}
              collapsed={collapsed}
            />
          ),
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-border-default">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-error-default hover:bg-error-subtle transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary-subtle text-primary-on-subtle"
          : "text-text-secondary hover:bg-secondary-active"
      } ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      {item.icon && <span className="shrink-0">{item.icon}</span>}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

function NavGroupItem({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup
  pathname: string
  collapsed: boolean
}) {
  const isChildActive = group.items.some((item) => pathname === item.href)
  const [open, setOpen] = useState(isChildActive)

  if (collapsed) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`p-2 rounded-lg ${isChildActive ? "text-primary-default" : "text-text-secondary"}`}
          title={group.label}
        >
          {group.icon}
        </div>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary-active transition-colors cursor-pointer">
        <span className="shrink-0">{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-8 mt-1 space-y-1">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-primary-subtle text-primary-on-subtle font-medium"
                  : "text-text-secondary hover:bg-secondary-active"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
