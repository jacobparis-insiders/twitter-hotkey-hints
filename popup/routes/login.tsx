import React from "react"
import {
  LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "react-router-dom"

import { getAuthHeaders } from "../../utils/getAuthHeaders"
import { validateUser } from "../../utils/validateUser"

export async function loader({ request }: LoaderFunctionArgs) {
  const { isValid, loginUrl } = await validateUser()

  if (isValid) {
    return redirect("/")
  }

  return {
    loginUrl,
  }
}

export default function LoginPage() {
  const { loginUrl } = useLoaderData() as Exclude<
    Awaited<ReturnType<typeof loader>>,
    Response
  >

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-xl px-8">
        <h1 className="mb-8 text-center text-4xl font-bold"> SuperTwitter </h1>

        <div>
          <a
            href={loginUrl}
            target="_blank"
            className="mb-4 w-full rounded-full bg-sky-500 py-4 px-6 text-lg font-bold text-white ring-sky-500 ring-offset-4 hover:bg-sky-600 hover:ring-sky-600 focus:outline-none focus:ring-4"
          >
            Sign in with Twitter
          </a>
        </div>
      </div>
    </div>
  )
}
