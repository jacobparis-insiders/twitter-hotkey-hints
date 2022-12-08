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

import { findAllByTestId, findByRole, queryByText } from "@testing-library/dom"
import invariant from "tiny-invariant"
import { friendlyFetch } from "../utils/friendlyFetch"

function useFeedButtonInjector() {
  useEffect(() => {
    let feedElement: HTMLLinkElement | null

    let throttleLimit = 0
    const observer = new MutationObserver(() => {
      if (throttleLimit > 1000) {
        observer.disconnect()
      }

      injectButton()
    })

    findByRole(document.body, "navigation", { name: /primary/i }).then(
      (nav) => {
        findByRole(nav, "link", { name: /home/i }).then((homeElement) => {
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

function useTweetObserver(callback: (tweets: Node[]) => void) {
  useEffect(() => {
    let previousCanonicalHref = ""

    const titleObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!isElement(mutation.target)) return

        const canonicalLink = mutation.target.querySelector(
          'link[rel="canonical"]'
        ) as HTMLLinkElement | null

        if (canonicalLink) {
          if (canonicalLink.href !== previousCanonicalHref) {
            previousCanonicalHref = canonicalLink.href
            setupTweetObserver()
          }
        } else {
          previousCanonicalHref = ""
          setupTweetObserver()
        }
      })
    })

    let throttleLimit = 0
    const observer = new MutationObserver((records) => {
      if (throttleLimit > 1000) {
        observer.disconnect()
      }

      callback(
        records.flatMap((record) => Array.from(record.addedNodes)).flat()
      )
    })

    titleObserver.observe(document.head, {
      attributes: false,
      subtree: false,
      childList: true,
    })

    return function cleanup() {
      titleObserver.disconnect()
      observer.disconnect()
    }

    function setupTweetObserver() {
      return findByRole(
        document.body,
        "region",
        {
          name: /(bookmarks|conversation|notifications|timeline|list|(s tweets))/i,
        },
        {
          timeout: 10000,
        }
      ).then(
        (conversationRegion) => {
          // wait for tweets to load
          findAllByTestId(conversationRegion, "tweet").then(() => {
            const container = conversationRegion.lastChild?.firstChild

            if (container) {
              observer.observe(container, {
                childList: true,
                attributes: true,
                attributeFilter: ["__refresh__"],
              })
              // Need this for first page load
              callback(Array.from(container.childNodes))
            }
          })
        },
        () => console.error("Could not find conversation region")
      )
    }
  }, [])
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1
}

function useHideDismissedTweetPages() {
  useTweetObserver((tweets) => {
    tweets.forEach(updateDismissClassOnChildren)
  })
}

function updateDismissClassOnChildren(element: Node) {
  if (!isElement(element)) return

  const promoPixel = element.querySelector('[data-testid="placementTracking"]')
  if (promoPixel) {
    element.classList.add("dismissed")
    return
  }

  const tweetLink = element.querySelector(
    "a:has(time)"
  ) as HTMLLinkElement | null
  if (tweetLink) {
    const id = getTweetId(tweetLink.href)
    console.log("Checking tweet id", id, "for dismissal")
    const dismissedTweets = new Set(
      JSON.parse(localStorage.getItem("dismissedTweets") || "[]")
    )

    if (dismissedTweets.has(id)) {
      element.classList.add("dismissed")
    }
  }
}

function useDismissTweetHotkey() {
  useEffect(() => {
    const listener = document.addEventListener("keyup", (event) => {
      if (event.key === "e") {
        if (
          document.activeElement &&
          document.activeElement.tagName.toUpperCase() === "ARTICLE"
        ) {
          const tweetLink = document.activeElement.querySelector(
            "a:has(time)"
          ) as HTMLLinkElement | null
          if (tweetLink) {
            const nearestParent = document.activeElement.closest(
              '[data-testid="cellInnerDiv"]'
            )
            const isDismissed = nearestParent?.classList.contains("dismissed")
            if (isDismissed) {
              nearestParent?.classList.remove("dismissed")
              markTweetUndismissed(getTweetId(tweetLink.href))
            } else {
              nearestParent?.classList.add("dismissed")
              markTweetDismissed(getTweetId(tweetLink.href))
            }

            return
          }
        }

        const url = window.location.href
        if (url.includes("status")) {
          if (!isTyping(document)) {
            markTweetDismissed(url.split("/").pop())
            const mainTweet = document.querySelector('article[tabindex="-1"]')
            if (mainTweet) {
              const closestParent = mainTweet.closest(
                '[data-testid="cellInnerDiv"]'
              )

              closestParent?.classList.add("dismissed")
            }
          }
        }
      }
    })

    return function cleanup() {
      document.removeEventListener("keyup", listener)
    }

    function markTweetDismissed(id) {
      console.info("🗑 Dismissed tweet", id)

      const dismissedTweets = new Set(
        JSON.parse(localStorage.getItem("dismissedTweets") || "[]")
      )

      dismissedTweets.add(id)
      localStorage.setItem(
        "dismissedTweets",
        JSON.stringify([...dismissedTweets])
      )
    }

    function markTweetUndismissed(id) {
      console.info("🗑 Restored tweet", id)

      const dismissedTweets = new Set(
        JSON.parse(localStorage.getItem("dismissedTweets") || "[]")
      )

      dismissedTweets.delete(id)
      localStorage.setItem(
        "dismissedTweets",
        JSON.stringify([...dismissedTweets])
      )
    }
  }, [])
}

function NavHotkeyHints() {
  useEffect(() => {
    const downListener = window.addEventListener("keydown", (event) => {
      if (isTyping(document)) return
      if (event.key !== "g") {
        document.body.classList.remove("show-go-hotkeys")
        return
      }

      document.body.classList.add("show-go-hotkeys")
    })

    const upListener = window.addEventListener("keyup", (event) => {
      if (isTyping(document)) return
      if (event.key !== "g") return

      setTimeout(() => {
        document.body.classList.remove("show-go-hotkeys")
      }, 1000)
    })

    return function cleanup() {
      window.removeEventListener("keydown", downListener)
      window.removeEventListener("keyup", upListener)
    }
  }, [])

  return (
    <style>
      {
        /* css */ `
      [data-testid^="AppTabBar_"],
        [aria-label="Bookmarks"],
        [aria-label="Top Articles"] {
          position: relative;
        }
        
        [data-testid^="AppTabBar_"]:after,
        [aria-label="Bookmarks"]:after,
        [aria-label="Top Articles"]:after {
          display: inline-flex;
          align-items: center;
          border-radius: 0.25rem;
          border: 1px solid #e2e8f0;
          padding: 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #418066;
          position: absolute;
          background: #fff;
          opacity: 0.99;
          top: 50%;
          bottom: 0;
          left: 50%;
          height: 2em;
          margin: auto;
          justify-content: center;
          box-shadow: 0 1px 2px 0 #0000000d
        }

        [aria-label^="New Tweets are available"] {
          flex-direction: column;
        }
        [aria-label^="New Tweets are available"]:after {
          content: '.';
          display: inline-flex;
          align-items: center;
          border-radius: 0.25rem;
          border: 1px solid #e2e8f0;
          padding: 0 0.5rem;
          font-weight: 500;
          color: #fff;
          opacity: 0.8;
          top: 50%;
          bottom: 0;
          left: 50%;
          height: 2em;
          margin: auto 0.5rem;
          justify-content: center;
        }

        .show-go-hotkeys [data-testid="AppTabBar_Home_Link"]:after {
          content: 'H';
        }

        .show-go-hotkeys [data-testid="AppTabBar_Explore_Link"]:after {
          content: 'E';
        }

        .show-go-hotkeys [data-testid="AppTabBar_Notifications_Link"]:after {
          content: 'N';
        }

        .show-go-hotkeys [data-testid="AppTabBar_DirectMessage_Link"]:after {
          content: 'M';
        }

        .show-go-hotkeys [data-testid="AppTabBar_Profile_Link"]:after {
          content: 'P';
        }

        .show-go-hotkeys [aria-label="Bookmarks"]:after {
          content: 'B';
        }

        .show-go-hotkeys [aria-label="Top Articles"]:after {
          content: 'A';
        }
        `
      }
    </style>
  )
}

function Empty() {
  useHideDismissedTweetPages()
  // useFeedButtonInjector()
  useScrapeTwitterUserInfo()
  useDismissTweetHotkey()

  return (
    <>
      <style>
        {
          /* css */ `
        .dismissed:has(article[tabindex="-1"]) {
          opacity: 0.5;
        }

        .dismissed {
          // display: none;
          opacity: 0.8;
        }

        .dismissed:has(article[tabindex="0"]) article *:not([data-testid="User-Names"]):not(:has([data-testid="User-Names"])) {
          display: none;
        }

        .dismissed:has(article[tabindex="0"]) article * {
          padding: 0;
        }

        .dismissed:has(article[tabindex="0"]) article [data-testid="User-Names"] * {
          display: initial !important;
        }

        
      `.trim()
        }
      </style>
      <NavHotkeyHints />
    </>
  )
}

async function loader(args: LoaderFunctionArgs) {
  console.log("Root loader")

  return null
}

function getTweetId(url) {
  return url.split("/").pop()
}

function isTyping(document) {
  if (!document.activeElement) return false

  if (document.activeElement.tagName === "TEXTAREA") return true
  if (document.activeElement.tagName === "INPUT") return true
  if (document.activeElement.getAttribute("contenteditable")) return true

  return false
}

// add a listener to see when we navigate to a tweet page, then console log whether the tweet is dismissed or not

function Main() {
  useFeedButtonInjector()
  useScrapeTwitterUserInfo()

  const navigate = useNavigate()
  useEffect(() => {
    const listener = window.addEventListener(
      "hashchange",
      () => {
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

        .dismissed {
          opacity: 0.5;
        }
      `.trim()}
      </style>
      <div className="flex justify-between items-stretch">
        <Outlet />
      </div>
    </div>
  )
}
