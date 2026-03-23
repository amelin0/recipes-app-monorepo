"use client"

import { useLoginPage } from "./useLoginPage"
import { Input } from "@/shared/ui/components/input"
import { Button } from "@/shared/ui/components/button"

export function LoginPage() {
  const { email, setEmail, password, setPassword, error, isLoading, handleSubmit } = useLoginPage()

  return (
    <div className="flex min-h-screen">
      {/* Left — brand image */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-inverse items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-[118px] h-[118px] rounded-[32px] bg-gradient-to-t from-black to-[#666] flex items-center justify-center">
            <span className="font-[family-name:var(--font-heading)] text-white text-lg font-bold tracking-wide">
              DNS
            </span>
          </div>
        </div>
      </div>

      {/* Right — sign in form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-[328px] flex flex-col gap-8">
          <h1 className="font-[family-name:var(--font-heading)] text-[32px] font-bold leading-[40px] text-text-primary">
            Sign In
          </h1>

          <div className="flex flex-col gap-5">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="flex flex-col gap-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="text-xs text-text-tertiary text-left hover:text-text-link">
                Forgot password?
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-text-error">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full h-12">
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
