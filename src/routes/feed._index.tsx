import { PlusCircleIcon } from "@heroicons/react/20/solid"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getSessionHeaders } from "../../utils/getSessionHeaders"
export default function NewFeed() {
  const [searchInputs, setSearchInputs] = useState(1)
  const navigate = useNavigate()

  async function onSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    console.log(data)

    const response = await fetch("http://127.0.0.1:3000/api/feeds", {
      method: "POST",
      headers: await getSessionHeaders(),
      body: formData,
    }).then((response) => response.json())

    console.log(response)
    if (response.index) {
      navigate(`/super/feed/${response.index}`)
    }
  }
  return (
    <section className="mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold drop-shadow-sm">
        Create a new tweet feed
      </h1>

      <p className="mb-4 text-lg text-gray-700">
        Combine several Twitter searches into a single feed that you can follow,
        engage with, and automate.
      </p>

      <div className="mt-8 sm:w-full sm:max-w-md">
        <form className="space-y-6" method="POST" onSubmit={onSubmit}>
          <div>
            <label htmlFor="feed" className="block text-gray-700">
              What is your feed&apos;s name?
            </label>
            <div className="mt-1">
              <input
                id="feed"
                name="feed"
                type="string"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This will display in the tab bar at the top of this window
            </p>
          </div>

          <div>
            <label htmlFor="feed-description" className="block text-gray-700">
              Search query
            </label>
            {Array(searchInputs)
              .fill(undefined)
              .map((_, i) => (
                <div className="mt-1" key={i}>
                  <input
                    id={`q-${i}`}
                    name="q"
                    type="text"
                    autoFocus={searchInputs === i && searchInputs > 1}
                    required={i === 0}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              ))}
            <p className="text-sm text-gray-500 mt-1">
              Full list of keywords available in this{" "}
              <a
                href="https://search.jacobparis.com"
                className="text-sky-500 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                reference guide
              </a>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSearchInputs((searchInputs) => searchInputs + 1)}
            className="inline-flex gap-x-2 items-center rounded-full border border-transparent bg-white px-4 py-2 font-bold text-gray-700 hover:bg-gray-200 hover:ring-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-4"
          >
            <PlusCircleIcon className="w-4 h-4" aria-hidden />
            Add another query
          </button>

          <div>
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-transparent bg-black px-4 py-2 font-bold text-white hover:bg-gray-800 hover:ring-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-800 focus:ring-offset-4"
            >
              Add feed
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
