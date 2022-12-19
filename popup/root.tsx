import "chrome-types"

import * as ReactDOM from "react-dom/client"
import "./index.css"
import { StrictMode, useState, createContext } from "react"
import { Switch } from "@headlessui/react"
import { PlusCircleIcon } from "@heroicons/react/20/solid"
const root = document.getElementById("root")
invariant(root)

type FlagContextValue = {
  tweetHotkeyHintsDisabled: boolean
  navigationHotkeyHintsDisabled: boolean
  dismissTweetsDisabled: boolean
  mutedWords: string
} | null

const FlagContext = createContext<FlagContextValue>(null)

chrome.storage.local
  .get([
    "tweetHotkeyHintsDisabled",
    "navigationHotkeyHintsDisabled",
    "dismissTweetsDisabled",
    "mutedWords",
  ])
  .then((flags) => {
    ReactDOM.createRoot(root).render(
      <StrictMode>
        <FlagContext.Provider
          value={{
            tweetHotkeyHintsDisabled: flags.tweetHotkeyHintsDisabled,
            navigationHotkeyHintsDisabled: flags.navigationHotkeyHintsDisabled,
            dismissTweetsDisabled: flags.dismissTweetsDisabled,
            mutedWords: flags.mutedWords,
          }}
        >
          <Main />
        </FlagContext.Provider>
      </StrictMode>
    )
  })

import React from "react"
import invariant from "tiny-invariant"
import { useContext } from "react"
import { getSessionHeaders } from "../utils/getSessionHeaders"

function Main() {
  const [tweetHotkeyHintsDisabled, setTweetHotkeyHintsDisabled] =
    useChromeStorage("tweetHotkeyHintsDisabled", false)
  const [navigationHotkeyHintsDisabled, setNavigationHotkeyHintsDisabled] =
    useChromeStorage("navigationHotkeyHintsDisabled", false)
  const [dismissTweetsDisabled, setDismissTweetsDisabled] = useChromeStorage(
    "dismissTweetsDisabled",
    false
  )
  const [mutedWords, setMutedWords] = useChromeStorage("mutedWords", [])
  const [searchInputs, setSearchInputs] = useState(mutedWords.length + 1)

  async function onSubmit(event) {
    const formData = new FormData(event.currentTarget)
    const data = formData.getAll("q")
    setMutedWords(() => data.filter(Boolean))
  }

  return (
    <div className="w-96 max-w-full px-4 py-2 flex flex-col gap-4 text-[15px]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Keyboard Shortcuts
      </h1>

      <Switch.Group as="div" className="flex justify-between gap-x-8">
        <Switch
          checked={!tweetHotkeyHintsDisabled}
          onChange={(value) => setTweetHotkeyHintsDisabled(!value)}
          className={classNames(
            tweetHotkeyHintsDisabled ? "bg-gray-200" : "bg-sky-500",
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              tweetHotkeyHintsDisabled ? "translate-x-0" : "translate-x-5",
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            )}
          />
        </Switch>
        <span className="flex flex-grow flex-col">
          <Switch.Label as="span" className="font-bold text-gray-900" passive>
            Show keyboard hints on tweets
          </Switch.Label>
        </span>
      </Switch.Group>

      <Switch.Group as="div" className="flex justify-between gap-x-8">
        <Switch
          checked={!navigationHotkeyHintsDisabled}
          onChange={(value) => setNavigationHotkeyHintsDisabled(!value)}
          className={classNames(
            navigationHotkeyHintsDisabled ? "bg-gray-200" : "bg-sky-500",
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              navigationHotkeyHintsDisabled ? "translate-x-0" : "translate-x-5",
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            )}
          />
        </Switch>
        <span className="flex flex-grow flex-col max-w-xs">
          <Switch.Label as="span" className="font-bold text-gray-900" passive>
            Show keyboard hints on links
          </Switch.Label>
        </span>
      </Switch.Group>

      <section className="mx-auto py-8 sm:px-2">
        <div
          className={`mt-8 sm:w-full sm:max-w-md rounded-xl px-4 py-4 ${
            dismissTweetsDisabled ? "bg-white" : "bg-gray-100"
          }`}
        >
          <Switch.Group
            as="div"
            className="flex justify-between items-center gap-x-8 mb-4"
          >
            <span className="flex flex-grow flex-col">
              <Switch.Label
                as="span"
                className="text-2xl font-bold text-gray-900"
                passive
              >
                Minimize tweets
              </Switch.Label>
              <Switch.Description as="span" className="text-gray-500">
                Adds a minimize button to every tweet. Keyboard users can press
                <kbd className="mx-[1ch]">E</kbd>
              </Switch.Description>
            </span>
            <Switch
              checked={!dismissTweetsDisabled}
              onChange={(value) => setDismissTweetsDisabled(!value)}
              className={classNames(
                dismissTweetsDisabled ? "bg-gray-200" : "bg-sky-500",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              )}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  dismissTweetsDisabled ? "translate-x-0" : "translate-x-5",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                )}
              />
            </Switch>
          </Switch.Group>
          {dismissTweetsDisabled ? null : (
            <form className="space-y-6" method="POST" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="feed-description"
                  className="block text-gray-700"
                >
                  Auto-minimize tweets with these muted phrases
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
                        defaultValue={mutedWords[i]}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSearchInputs((searchInputs) => searchInputs + 1)
                }
                className="inline-flex gap-x-2 items-center rounded-full border border-transparent bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-300 hover:ring-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-offset-4"
              >
                <PlusCircleIcon className="w-4 h-4" aria-hidden />
                Add another muted phrase
              </button>

              <div>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full border border-transparent bg-black px-4 py-2 font-bold text-white hover:bg-gray-800 hover:ring-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-800 focus:ring-offset-4"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

function useChromeStorage(
  key: keyof Exclude<FlagContextValue, null>,
  initialValue
) {
  const flags = useContext(FlagContext)

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      // Get from local storage by key
      // Parse stored json or if none return initialValue
      return flags && flags[key]
        ? JSON.parse(flags[key] as string)
        : initialValue
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    // Allow value to be a function so we have same API as useState
    const valueToStore = value instanceof Function ? value(storedValue) : value
    // Save state
    setStoredValue(valueToStore)
    // Save to local storage
    chrome.storage.local.set({ [key]: JSON.stringify(valueToStore) })
  }
  return [storedValue, setValue]
}
