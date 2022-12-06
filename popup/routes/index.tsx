import React from "react"
import { LoaderFunctionArgs, redirect, useSearchParams } from "react-router-dom"
import { validateUser } from "../../utils/validateUser"

export async function loader({ request }: LoaderFunctionArgs) {
  const { isValid, loginUrl } = await validateUser()

  if (!isValid && loginUrl) {
    return redirect("/login")
  }

  return null
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-xl px-8">
        <h1 className="mb-8 text-center text-4xl font-bold"> Logged in </h1>
      </div>
    </div>
  )
}
