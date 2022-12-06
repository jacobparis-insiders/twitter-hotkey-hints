import "chrome-types"

import * as ReactDOM from "react-dom/client"
import "./index.css"
import {
  createHashRouter,
  createRoutesFromElements,
  HashRouter,
  Link,
  LoaderFunctionArgs,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useParams,
  useRouteError,
  useRoutes,
} from "react-router-dom"
import { StrictMode, useEffect, useState } from "react"

function ErrorBoundary() {
  let error = useRouteError()
  console.error(error)
  return null
}

type Route = {
  path: string
  element: JSX.Element
  loader?: (args: LoaderFunctionArgs) => Promise<any>
  children?: Route[]
}

const ROUTES = import.meta.globEager("./routes/**/*.tsx")
const routes: Route[] = Object.entries(ROUTES)
  .map(([path, route]) => ({
    ...route,
    path: path
      .replace("./routes/", "")
      .replace(".tsx", "")
      .replace("$", ":")
      .split("."),
  }))
  .sort((a, b) => a.path.length - b.path.length)

function processRoute(routes, route) {
  const [first, ...rest] = route.path
  const child = routes.find((child) => child.path === first)

  // This is a leaf node
  if (!rest.length) {
    const Element = route.default

    if (first === "_index") {
      routes.push({
        path: first,
        element: <Element />,
        index: true,
      })
    } else {
      routes.push({
        path: first,
        element: Element ? <Element /> : null,
        loader: route.loader,
        children: [],
      })
    }

    return routes
  }

  if (child) {
    processRoute(child.children, { ...route, path: rest })

    return routes
  }

  return routes
}

const children = [] as Route[]

for (const route of routes) {
  processRoute(children, route)
}

function recursivelySetIndexes(children) {
  return children.map((child) => {
    const { children, index, path, ...props } = child

    if (index) {
      return {
        index: true,
        ...props,
      }
    }

    return {
      path: `${path}/*`,
      ...props,
      children: children ? recursivelySetIndexes(children) : undefined,
    }
  })
}

findByRole(document.body, "main").then((main) => {
  console.log({ main })
  const root = document.createElement("div")
  root.id = "crx-root"

  main.insertAdjacentElement("afterend", root)

  ReactDOM.createRoot(root).render(
    <StrictMode>
      <RouterProvider
        router={createHashRouter([
          {
            path: "/super",
            element: <Main />,
            loader,
            errorElement: <ErrorBoundary />,
            children: recursivelySetIndexes(children),
          },
          {
            element: <Empty />,
            index: true,
            errorElement: <ErrorBoundary />,
          },
        ])}
      />
    </StrictMode>
  )
})

import {
  findByRole,
  findByText,
  getByRole,
  queryByText,
} from "@testing-library/dom"
import invariant from "tiny-invariant"
import { getFeeds } from "./getFeeds"
import { PlusIcon } from "@heroicons/react/24/solid"
import { getSessionHeaders } from "../utils/getSessionHeaders"
import { friendlyFetch } from "../utils/friendlyFetch"

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[1.75rem] h-[1.75rem]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
</svg>
`

function useFeedButtonInjector() {
  useEffect(() => {
    let feedElement: HTMLLinkElement | null

    let throttleLimit = 0
    const observer = new MutationObserver(() => {
      console.log("Observer triggered", throttleLimit++)
      if (throttleLimit > 1000) {
        observer.disconnect()
      }

      injectButton()
    })

    findByRole(document.body, "navigation", { name: /primary/i }).then(
      (nav) => {
        findByRole(nav, "link", { name: /home/i }).then((homeElement) => {
          console.log("Found home, setting observer")
          observer.observe(homeElement, { childList: true, subtree: true })
        })
      }
    )

    injectButton()

    return function cleanup() {
      observer.disconnect()
      if (feedElement) {
        invariant(feedElement.parentElement)
        feedElement.parentElement.removeChild(feedElement)
      }
    }

    function injectButton() {
      findByRole(document.body, "navigation", { name: /primary/i }).then(
        (nav) => {
          findByRole(nav, "link", { name: /home/i }).then((homeElement) => {
            if (feedElement) {
              invariant(feedElement.parentElement)
              feedElement.parentElement.removeChild(feedElement)
            }

            ;(homeElement as HTMLLinkElement).href = "/home#"
            feedElement = homeElement.cloneNode(true) as HTMLLinkElement
            const spanText = queryByText(feedElement, "Home")
            feedElement.ariaLabel = "Feeds"
            feedElement.href = "/birdfeeder#/super/feed"
            feedElement.dataset.testid = "AppTabBar_Feed_Link"

            if (spanText) {
              spanText.innerText = "Feeds"
              console.log(window.location.pathname)
              // if the url is /birdfeeder then we want this bold
              spanText.style.fontWeight =
                window.location.pathname === "/birdfeeder" ? "bold" : "normal"
            }

            const div = feedElement.querySelector("div")
            if (div) {
              div.style.backgroundColor = "transparent"
              div.classList.add("rounded-full", "hover:!bg-gray-200")
            }

            const icon = feedElement.querySelector("svg")
            invariant(icon)
            invariant(icon.parentElement)

            icon.parentElement.innerHTML =
              window.location.pathname === "/birdfeeder"
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-[1.75rem] h-[1.75rem]">
                    <path d="M15 3.75H9v16.5h6V3.75zM16.5 20.25h3.375c1.035 0 1.875-.84 1.875-1.875V5.625c0-1.036-.84-1.875-1.875-1.875H16.5v16.5zM4.125 3.75H7.5v16.5H4.125a1.875 1.875 0 01-1.875-1.875V5.625c0-1.036.84-1.875 1.875-1.875z" />
                  </svg>
                `
                : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[1.75rem] h-[1.75rem]">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                `

            homeElement.insertAdjacentElement("afterend", feedElement)
          })
        }
      )
    }
  }, [])
}

function useScrapeTwitterUserInfo() {
  useEffect(() => {
    chrome.runtime
      .sendMessage({ message: "getUserInfo" })
      .then((data) => {
        if (
          data.cacheTime &&
          data.cacheTime > Date.now() - 1000 * 60 * 60 * 24
        ) {
          throw new Error()
        }

        const html = document.body.innerHTML
        const matchRegex = /"users":{"entities":{"(\d+)"/
        const matches = matchRegex.exec(html)
        const userId = matches ? matches[1] : null

        if (!userId) throw new Error()

        return friendlyFetch(
          "userInfo",
          `https://api.twitter.com/1.1/users/show.json?user_id=${userId}`
        )
          .then((data) => {
            console.log({ data })
            chrome.runtime.sendMessage({
              message: "setUserInfo",
              data: {
                id: userId,
                img: data.profile_image_url_https,
                name: data.name,
                username: data.screen_name,
              },
            })
          })
          .catch(console.error)
      })
      .catch(console.error)
  }, [])
}

function Empty() {
  useFeedButtonInjector()
  useScrapeTwitterUserInfo()

  return null
}

async function loader(args: LoaderFunctionArgs) {
  console.log("Root loader")

  return null
}

function Main() {
  useFeedButtonInjector()
  useScrapeTwitterUserInfo()

  const navigate = useNavigate()
  useEffect(() => {
    const listener = window.addEventListener(
      "hashchange",
      () => {
        console.log("Hash changed", window.location.hash)
        if (window.location.hash.length < 2) {
          navigate("/")
        }
      },
      false
    )

    return function cleanup() {
      window.removeEventListener("hashchange", listener)
    }
  }, [])

  return (
    <div className="w-[990px] text-[15px]">
      <style>
        {`
        main {
          display: none !important;
        }

        #crx-root {
          flex-grow: 1;
          width: 990px;
        }
      `.trim()}
      </style>
      <div className="flex justify-between items-stretch">
        <Outlet />
      </div>
    </div>
  )
}
