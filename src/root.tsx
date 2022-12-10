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
import { StrictMode, useEffect, useRef, useState } from "react"

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

const ROUTES = import.meta.globEager("./routes/**/*.tsx") as Record<
  string,
  object
>
const routes = Object.entries(ROUTES)
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

import {
  findAllByTestId,
  findByRole,
  findByTestId,
  getByTestId,
  queryByRole,
  queryByTestId,
  queryByText,
} from "@testing-library/dom"
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

function useUrlObserver(callback: (url: string) => MutationObserver | null) {
  useEffect(() => {
    let previousCanonicalHref = ""
    let targetObserver: MutationObserver | null = null
    const urlObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!isElement(mutation.target)) return

        const canonicalLink = mutation.target.querySelector(
          'link[rel="canonical"]'
        ) as HTMLLinkElement | null

        if (canonicalLink) {
          if (canonicalLink.href !== previousCanonicalHref) {
            previousCanonicalHref = canonicalLink.href
            targetObserver = callback(canonicalLink.href)
          }
        } else {
          previousCanonicalHref = ""
          targetObserver = callback("")
        }
      })
    })

    urlObserver.observe(document.head, {
      attributes: false,
      subtree: false,
      childList: true,
    })

    return function cleanup() {
      urlObserver.disconnect()
      if (targetObserver) {
        targetObserver.disconnect()
      }
    }
  }, [])
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1
}

function useTweetObserver(callback: (nodes: Node[]) => void) {
  useUrlObserver(() => {
    let throttleLimit = 0
    const observer = new MutationObserver((records) => {
      if (throttleLimit > 1000) {
        observer.disconnect()
      }

      callback(
        records.flatMap((record) => Array.from(record.addedNodes)).flat()
      )
    })

    findByRole(
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
        findAllByTestId(conversationRegion, "tweet").then(
          () => {
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
          },
          () => console.error("Could not find tweets")
        )
      },
      () => console.error("Could not find conversation region")
    )

    return observer
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
    const listener = (event) => {
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
    }

    document.addEventListener("keyup", listener)
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

function useNavHotkeyHints() {
  const homeTabHint = useRef<HTMLDivElement>(generateHint("G+H"))
  const exploreTabHint = useRef<HTMLDivElement>(generateHint("G+E"))
  const notificationsTabHint = useRef<HTMLDivElement>(generateHint("G+N"))
  const messagesTabHint = useRef<HTMLDivElement>(generateHint("G+M"))
  const bookmarksTabHint = useRef<HTMLDivElement>(generateHint("G+B"))
  const articlesTabHint = useRef<HTMLDivElement>(generateHint("G+A"))
  const profileTabHint = useRef<HTMLDivElement>(generateHint("G+P"))

  useEffect(() => {
    findByTestId(document.body, "AppTabBar_Home_Link").then(
      (tab) => tab.appendChild(homeTabHint.current),
      () => console.error("Could not find home tab")
    )

    findByTestId(document.body, "AppTabBar_Explore_Link").then(
      (tab) => tab.appendChild(exploreTabHint.current),
      () => console.error("Could not find explore tab")
    )

    findByTestId(document.body, "AppTabBar_Notifications_Link").then(
      (tab) => tab.appendChild(notificationsTabHint.current),
      () => console.error("Could not find notifications tab")
    )

    findByTestId(document.body, "AppTabBar_DirectMessage_Link").then(
      (tab) => tab.appendChild(messagesTabHint.current),
      () => console.error("Could not find direct message tab")
    )

    findByRole(document.body, "link", { name: /bookmarks/i }).then(
      (tab) => tab.appendChild(bookmarksTabHint.current),
      () => console.error("Could not find bookmarks tab")
    )

    findByRole(document.body, "link", { name: /top articles/i }).then(
      (tab) => tab.appendChild(articlesTabHint.current),
      () => console.error("Could not find articles tab")
    )

    findByTestId(document.body, "AppTabBar_Profile_Link").then(
      (tab) => tab.appendChild(profileTabHint.current),
      () => console.error("Could not find profile tab")
    )

    window.addEventListener("keydown", downListener)
    window.addEventListener("keyup", upListener)

    return function cleanup() {
      homeTabHint.current.remove()
      exploreTabHint.current.remove()
      notificationsTabHint.current.remove()
      messagesTabHint.current.remove()
      bookmarksTabHint.current.remove()
      articlesTabHint.current.remove()
      profileTabHint.current.remove()

      window.removeEventListener("keydown", downListener)
      window.removeEventListener("keyup", upListener)
    }

    function downListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") {
        homeTabHint.current.classList.add("opacity-0")
        exploreTabHint.current.classList.add("opacity-0")
        notificationsTabHint.current.classList.add("opacity-0")
        messagesTabHint.current.classList.add("opacity-0")
        bookmarksTabHint.current.classList.add("opacity-0")
        articlesTabHint.current.classList.add("opacity-0")
        profileTabHint.current.classList.add("opacity-0")

        return
      }

      homeTabHint.current.classList.remove("opacity-0")
      exploreTabHint.current.classList.remove("opacity-0")
      notificationsTabHint.current.classList.remove("opacity-0")
      messagesTabHint.current.classList.remove("opacity-0")
      bookmarksTabHint.current.classList.remove("opacity-0")
      articlesTabHint.current.classList.remove("opacity-0")
      profileTabHint.current.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") return

      setTimeout(() => {
        homeTabHint.current.classList.add("opacity-0")
        exploreTabHint.current.classList.add("opacity-0")
        notificationsTabHint.current.classList.add("opacity-0")
        messagesTabHint.current.classList.add("opacity-0")
        bookmarksTabHint.current.classList.add("opacity-0")
        articlesTabHint.current.classList.add("opacity-0")
        profileTabHint.current.classList.add("opacity-0")
      }, 1000)
    }
  }, [])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "absolute",
      "bottom-0",
      "left-0",
      "flex",
      "pl-6",
      "pb-1",
      "opacity-0",
      "transition-opacity",
      "duration-100"
    )
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useNotificationsPageHotkeys() {
  const [url, setUrl] = useState<string>()
  const mentionsTabHint = useRef<HTMLDivElement>(generateHint("G+R"))
  const notificationsTabHint = useRef<HTMLDivElement>(generateHint("G+N"))

  useUrlObserver((url) => {
    setUrl(url)

    return null
  })

  useEffect(() => {
    cleanup()

    const url = new URL(window.location.href)
    if (!url.pathname.startsWith("/notifications")) return

    findByTestId(document.body, "primaryColumn").then((column) => {
      const mentionsTab = column.querySelector(
        'a[href="/notifications/mentions"]'
      )

      const notificationsTab = column.querySelector('a[href="/notifications"]')

      mentionsTab?.appendChild(mentionsTabHint.current)
      notificationsTab?.appendChild(notificationsTabHint.current)

      window.addEventListener("keydown", downListener)
      window.addEventListener("keyup", upListener)
    })

    function cleanup() {
      mentionsTabHint.current.remove()
      notificationsTabHint.current.remove()

      window.removeEventListener("keydown", downListener)
      window.removeEventListener("keyup", upListener)
    }

    return cleanup

    function downListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") {
        mentionsTabHint.current.classList.add("opacity-0")
        notificationsTabHint.current.classList.add("opacity-0")

        return
      }

      mentionsTabHint.current.classList.remove("opacity-0")
      notificationsTabHint.current.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") return

      setTimeout(() => {
        mentionsTabHint.current.classList.add("opacity-0")
        notificationsTabHint.current.classList.add("opacity-0")
      }, 1000)
    }
  }, [url])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "absolute",
      "inset-y-0",
      "right-0",
      "flex",
      "items-center",
      "pr-6",
      "pb-1",
      "opacity-0",
      "transition-opacity",
      "duration-100"
    )
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useDraftScheduledTabHotkeys() {
  const [url, setUrl] = useState<string>()
  const draftsButtonHint = useRef<HTMLDivElement>(generateHint("G+F"))
  const scheduledButtonHint = useRef<HTMLDivElement>(generateHint("G+T"))

  useUrlObserver((url) => {
    setUrl(url)

    return null
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    console.log({ url })
    if (!url.pathname.startsWith("/compose/tweet/unsent")) return

    findByTestId(document.body, "ScrollSnap-List").then(
      (column) => {
        const draftsButton = column.querySelector(
          'a[href="/compose/tweet/unsent/drafts"]'
        )
        const scheduledButton = column.querySelector(
          'a[href="/compose/tweet/unsent/scheduled"]'
        )

        if (draftsButton && scheduledButton) {
          draftsButton.appendChild(draftsButtonHint.current)
          scheduledButton.appendChild(scheduledButtonHint.current)

          window.addEventListener("keydown", downListener)
          window.addEventListener("keyup", upListener)
        }
      },
      () => console.error("Failed to find Drafts or Scheduled tabs")
    )

    return function cleanup() {
      draftsButtonHint.current.remove()
      scheduledButtonHint.current.remove()

      window.removeEventListener("keydown", downListener)
      window.removeEventListener("keyup", upListener)
    }

    function downListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") {
        draftsButtonHint.current.classList.add("opacity-0")
        scheduledButtonHint.current.classList.add("opacity-0")

        return
      }

      draftsButtonHint.current.classList.remove("opacity-0")
      scheduledButtonHint.current.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") return

      setTimeout(() => {
        draftsButtonHint.current.classList.add("opacity-0")
        scheduledButtonHint.current.classList.add("opacity-0")
      }, 1000)
    }
  }, [url])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "absolute",
      "inset-y-0",
      "right-0",
      "flex",
      "items-center",
      "pr-6",
      "pb-1",
      "opacity-0",
      "transition-opacity",
      "duration-100"
    )
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useComposerHotkeys() {
  const [url, setUrl] = useState<string>()
  const draftsButtonHint = useRef<HTMLDivElement>(generateHint("G+F"))
  const closeButtonHint = useRef<HTMLDivElement>(generateHint("ESC"))
  const tweetButtonHint = useRef<HTMLDivElement>(
    generateInlineHint("CMD+ENTER")
  )

  useUrlObserver((url) => {
    setUrl(url)

    return null
  })

  useEffect(() => {
    cleanup()

    const url = new URL(window.location.href)
    if (url.pathname !== "/compose/tweet") return

    findByTestId(document.body, "tweetButton").then(
      (tweetButton) => {
        tweetButton.style.flexDirection = "row"
        tweetButton.appendChild(tweetButtonHint.current)
      },
      () => console.error("Failed to find tweet button")
    )

    findByTestId(document.body, "unsentButton").then(
      (draftsButton) => {
        draftsButton.appendChild(draftsButtonHint.current)
        findByTestId(document.body, "app-bar-close").then((closeButton) => {
          closeButton.appendChild(closeButtonHint.current)
        })

        window.addEventListener("keydown", downListener)
        window.addEventListener("keyup", upListener)
      },
      () => console.error("Failed to find drafts button")
    )

    function cleanup() {
      draftsButtonHint.current.remove()
      closeButtonHint.current.remove()
      tweetButtonHint.current.remove()

      window.removeEventListener("keydown", downListener)
      window.removeEventListener("keyup", upListener)
    }

    return cleanup

    function downListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") {
        draftsButtonHint.current.classList.add("opacity-0")
        closeButtonHint.current.classList.add("opacity-0")

        return
      }

      draftsButtonHint.current.classList.remove("opacity-0")
      closeButtonHint.current.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") return

      setTimeout(() => {
        draftsButtonHint.current.classList.add("opacity-0")
        closeButtonHint.current.classList.add("opacity-0")
      }, 1000)
    }
  }, [url])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "absolute",
      "inset-y-0",
      "right-0",
      "flex",
      "items-center",
      "pl-6",
      "pt-4",
      "opacity-0",
      "transition-opacity",
      "duration-100"
    )
    hintWrapper.appendChild(hint)

    return hintWrapper
  }

  function generateInlineHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add("flex", "items-center", "mx-2")
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useNewTweetHotkeys() {
  const [url, setUrl] = useState<number>()
  const newTweetButtonHint = useRef<HTMLElement>(generateHint("."))

  useTweetObserver((tweets) => {
    setUrl(tweets.length)

    return null
  })

  useEffect(() => {
    findByRole(document.body, "button", {
      name: /new tweets/i,
      hidden: true,
    }).then(
      (newTweetPrompt) => {
        newTweetPrompt.style.flexDirection = "row"
        newTweetPrompt.appendChild(newTweetButtonHint.current)
      },
      () => console.error("Failed to find new tweets button")
    )

    return function cleanup() {
      newTweetButtonHint.current.remove()
      newTweetButtonHint.current.innerHTML = ""
    }
  }, [url])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "shadow-sm",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add("flex", "items-center", "mx-2")
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useTweetHotkeys() {
  const likeButtonHint = useRef<HTMLElement>(generateHint("L"))
  const retweetButtonHint = useRef<HTMLElement>(generateHint("T"))
  const replyButtonHint = useRef<HTMLElement>(generateHint("R"))
  const shareButtonHint = useRef<HTMLElement>(generateHint("S"))
  const additionalActionsHint = useRef<HTMLElement>(
    document.createElement("div")
  )
  const muteActionHint = useRef<HTMLElement>(generateActionHint("Mute", "U"))
  const blockActionHint = useRef<HTMLElement>(generateActionHint("Block", "X"))
  const bookmarkActionHint = useRef<HTMLElement>(
    generateActionHint("Bookmark", "B")
  )
  useEffect(() => {
    const focusListener = ({ target }) => {
      if (!(target instanceof HTMLElement)) return
      if (target.tagName !== "ARTICLE") return
      if (target.dataset.testid !== "tweet") return

      console.log("Focused on tweet")

      const likeButton = queryByTestId(target, "like")
      likeButton?.appendChild(likeButtonHint.current)

      const unlikeButton = queryByTestId(target, "unlike")
      unlikeButton?.appendChild(likeButtonHint.current)

      const retweetButton = queryByTestId(target, "retweet")
      retweetButton?.appendChild(retweetButtonHint.current)

      const unretweetButton = queryByTestId(target, "unretweet")
      unretweetButton?.appendChild(retweetButtonHint.current)

      const replyButton = queryByTestId(target, "reply")
      replyButton?.appendChild(replyButtonHint.current)

      const shareButton = queryByRole(target, "button", {
        name: /share tweet/i,
      })
      shareButton?.appendChild(shareButtonHint.current)

      const header = getByTestId(document.body, "primaryColumn")
      header?.firstElementChild?.firstElementChild?.appendChild(
        additionalActionsHint.current
      )
      additionalActionsHint.current.classList.add(
        "flex",
        "absolute",
        "right-0",
        "bottom-0",
        "px-1",
        "translate-y-1/2",
        "gap-x-1"
      )

      additionalActionsHint.current.appendChild(bookmarkActionHint.current)
      additionalActionsHint.current.appendChild(muteActionHint.current)
      additionalActionsHint.current.appendChild(blockActionHint.current)
    }

    const blurListener = ({ target }) => {
      if (!(target instanceof HTMLElement)) return
      if (target.tagName !== "ARTICLE") return
      if (target.dataset.testid !== "tweet") return

      likeButtonHint.current.remove()
      retweetButtonHint.current.remove()
      replyButtonHint.current.remove()
      shareButtonHint.current.remove()
      additionalActionsHint.current.remove()
      muteActionHint.current.remove()
      blockActionHint.current.remove()
    }

    document.addEventListener("focusin", focusListener)
    document.addEventListener("focusout", blurListener)

    return function cleanup() {
      document.removeEventListener("focusin", focusListener)
      document.removeEventListener("focusout", blurListener)
    }
  }, [])

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-sans",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-white/95"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "px-1",
      "flex",
      "absolute",
      "left-0",
      "-translate-x-full"
    )
    hintWrapper.appendChild(hint)

    return hintWrapper
  }

  function generateActionHint(label: string, key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "font-medium",
      "font-sans"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "pl-2",
      "py-1",
      "pr-1",
      "text-sm",
      "text-gray-500",
      "bg-white/95",
      "gap-x-2"
    )
    hintWrapper.textContent = label
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function Empty() {
  useTweetObserver((tweets) => {
    tweets.forEach(updateDismissClassOnChildren)
  })

  // useFeedButtonInjector()
  useScrapeTwitterUserInfo()
  useDismissTweetHotkey()
  useNavHotkeyHints()
  useNotificationsPageHotkeys()
  useDraftScheduledTabHotkeys()
  useComposerHotkeys()
  useNewTweetHotkeys()
  useTweetHotkeys()

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
    const listener = () => {
      if (window.location.hash.length < 2) {
        navigate("/")
      }
    }

    window.addEventListener("hashchange", listener, false)
    return function cleanup() {
      window.removeEventListener("hashchange", listener, false)
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
