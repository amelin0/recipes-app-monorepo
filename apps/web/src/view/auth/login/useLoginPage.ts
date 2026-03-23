"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLogin } from "@/state/domains/auth"

export const useLoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { login, isLoading } = useLogin()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await login({ email, password })
      router.push("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    }
  }

  return { email, setEmail, password, setPassword, error, isLoading, handleSubmit }
}
