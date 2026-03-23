import { Sidebar } from "@/shared/ui/components/Sidebar"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text-primary">
          Digital Nutrition Studio — Admin Panel
        </h1>
        <p className="mt-4 text-text-secondary">
          Welcome to the admin dashboard. Select a section from the sidebar to get started.
        </p>
      </main>
    </div>
  )
}
