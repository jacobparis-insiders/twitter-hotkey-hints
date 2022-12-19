import "./index.css"
import "chrome-types"

import {
  findAllByTestId,
  findByRole,
  findByTestId,
  getByTestId,
  queryByRole,
  queryByTestId,
} from "@testing-library/dom"

function logVerboseError(...args: any[]) {
  return

  console.error(...args)
}

chrome.storage.local
  .get([
    "tweetHotkeyHintsDisabled",
    "navigationHotkeyHintsDisabled",
    "minimizeTweetsDisabled",
  ])
  .then((flags) => {
    return Object.fromEntries(
      Object.entries(flags).map(([key, value]) => [key, JSON.parse(value)])
    )
  })
  .then((flags) => {
    if (!flags.navigationHotkeyHintsDisabled) {
      useNavHotkeyHints()
      useNotificationsPageHotkeys()
      useDraftScheduledTabHotkeys()
      useComposerHotkeys()
      useNewTweetHotkeys()
    }

    if (!flags.minimizeTweetsDisabled) {
      useMinimizeTweetHotkey()
      useTweetObserver((tweets) => {
        tweets.forEach(updateMinimizeClassOnChildren)
        tweets.forEach(async (tweet) => {
          if (!isElement(tweet)) return
          const existingMinimizeButton = queryByTestId(tweet, "minimize")
          if (!existingMinimizeButton) {
            queryByTestId(tweet, "reply")
              ?.closest('[role="group"]')
              ?.appendChild(createMinimizeButton())
          }

          const article = tweet.querySelector("article")
          if (article) {
            const existingUnminimizeButton = queryByTestId(tweet, "unminimize")
            if (!existingUnminimizeButton) {
              article.appendChild(createUnminimizeButton())
            }
          }
        })
      })

      function createMinimizeButton() {
        const minimizeButton = document.createElement("div")
        minimizeButton.classList.add("inline-grid")
        minimizeButton.addEventListener("click", (event) => {
          const target = event.target as HTMLDivElement
          if (!target) return

          const article = target.closest("article")
          if (!article) return

          const tweetLink: HTMLLinkElement = article.querySelector(
            "a:has(time)"
          ) as HTMLLinkElement
          if (!tweetLink) return

          const nearestParent = article.closest('[data-testid="cellInnerDiv"]')

          nearestParent?.classList.add("minimized")
          markTweetMinimized(getTweetId(tweetLink.href))
        })
        minimizeButton.innerHTML = /* html */ `
          <button
            class="group focus:outline-none inline-grid justify-center items-center relative"
            data-testid="minimize"
            aria-label="Minimize tweet"
            title="Minimize"
            tabindex="0"
            type="button"
          >
          <div class="relative inline-grid justify-center text-[#536471] items-center group-hover:text-[#1d9bf0] group-focus:text-[#1d9bf0] transition-colors duration-200">
              <div class="opacity-0 rounded-full group-hover:opacity-100 group-focus:opacity-100 group-focus:ring-2 transition-opacity  [[data-focusvisible-polyfill][data-testid='tweet']_&]:focus:ring-blue-300 duration-200 bg-[#1d9bf01a] absolute inset-0 -m-2" ></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </div>
          </button>`

        return minimizeButton
      }

      function createUnminimizeButton() {
        const unminimizeButton = document.createElement("div")
        unminimizeButton.classList.add("absolute", "inset-0", "hidden")
        unminimizeButton.dataset.testid = "unminimize"
        unminimizeButton.addEventListener("click", (event) => {
          event.preventDefault()

          const target = event.target as HTMLDivElement
          if (!target) return

          const article = target.closest("article")
          if (!article) return

          const tweetLink: HTMLLinkElement = article.querySelector(
            "a:has(time)"
          ) as HTMLLinkElement
          if (!tweetLink) return

          const nearestParent = article.closest('[data-testid="cellInnerDiv"]')

          nearestParent?.classList.remove("minimized")
          markTweetUnminimized(getTweetId(tweetLink.href))
        })

        return unminimizeButton
      }
    }

    if (!flags.navigationHotkeyHintsDisabled) {
      useTweetHotkeys()
    }
  })

function useUrlObserver(callback: (url: string) => void) {
  let previousCanonicalHref = ""
  const urlObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (!isElement(mutation.target)) return

      const canonicalLink = mutation.target.querySelector(
        'link[rel="canonical"]'
      ) as HTMLLinkElement | null

      if (canonicalLink) {
        if (canonicalLink.href !== previousCanonicalHref) {
          previousCanonicalHref = canonicalLink.href
          callback(canonicalLink.href)
        }
      } else {
        previousCanonicalHref = ""
        callback("")
      }
    })
  })

  urlObserver.observe(document.head, {
    attributes: false,
    subtree: false,
    childList: true,
  })
}

function isElement(node: Node): node is HTMLElement {
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
          () => logVerboseError("Could not find tweets")
        )
      },
      () => logVerboseError("Could not find conversation region")
    )
  })
}

function updateMinimizeClassOnChildren(element: Node) {
  if (!isElement(element)) return

  // Auto minimize ads
  const promoPixel = element.querySelector('[data-testid="placementTracking"]')
  if (promoPixel) {
    element.classList.add("minimized")
    return
  }

  const tweetText = element.querySelector('[data-testid="tweetText"]')
  if (tweetText) {
    const emojiAlts = Array.from(tweetText.querySelectorAll("img[alt]")).map(
      (img) => img.alt
    )

    const fullText = [tweetText.textContent, ...emojiAlts]
      .join(" ")
      .toLowerCase()
    chrome.storage.local.get("mutedWords", ({ mutedWords }) => {
      const parsedMutedWords = JSON.parse(mutedWords)

      if (parsedMutedWords.some((word) => fullText.includes(word))) {
        element.classList.add("minimized")
        return
      }
    })
  }

  // Minimize from list
  const tweetLink = element.querySelector(
    "a:has(time)"
  ) as HTMLLinkElement | null
  if (tweetLink) {
    const id = getTweetId(tweetLink.href)
    const minimizedTweets = new Set(
      JSON.parse(localStorage.getItem("minimizedTweets") || "[]")
    )

    if (minimizedTweets.has(id)) {
      element.classList.add("minimized")
    }
  }
}

function useMinimizeTweetHotkey() {
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
          const isMinimized = nearestParent?.classList.contains("minimized")
          if (isMinimized) {
            nearestParent?.classList.remove("minimized")
            markTweetUnminimized(getTweetId(tweetLink.href))
          } else {
            nearestParent?.classList.add("minimized")
            markTweetMinimized(getTweetId(tweetLink.href))
          }

          return
        }
      }

      const url = window.location.href
      if (url.includes("status")) {
        if (!isTyping(document)) {
          markTweetMinimized(url.split("/").pop())
          const mainTweet = document.querySelector('article[tabindex="-1"]')
          if (mainTweet) {
            const closestParent = mainTweet.closest(
              '[data-testid="cellInnerDiv"]'
            )

            closestParent?.classList.add("minimized")
          }
        }
      }
    }
  }

  document.addEventListener("keyup", listener)
}
function markTweetMinimized(id) {
  console.info("🗑 Minimized tweet", id)

  const minimizedTweets = new Set(
    JSON.parse(localStorage.getItem("minimizedTweets") || "[]")
  )

  minimizedTweets.add(id)
  localStorage.setItem("minimizedTweets", JSON.stringify([...minimizedTweets]))
}

function markTweetUnminimized(id) {
  console.info("🗑 Restored tweet", id)

  const minimizedTweets = new Set(
    JSON.parse(localStorage.getItem("minimizedTweets") || "[]")
  )

  minimizedTweets.delete(id)
  localStorage.setItem("minimizedTweets", JSON.stringify([...minimizedTweets]))
}

function useNavHotkeyHints() {
  const homeTabHint = generateHint("G+H")
  const exploreTabHint = generateHint("G+E")
  const notificationsTabHint = generateHint("G+N")
  const messagesTabHint = generateHint("G+M")
  const bookmarksTabHint = generateHint("G+B")
  const articlesTabHint = generateHint("G+A")
  const profileTabHint = generateHint("G+P")

  findByTestId(document.body, "AppTabBar_Home_Link").then(
    (tab) => tab.appendChild(homeTabHint),
    () => logVerboseError("Could not find home tab")
  )

  findByTestId(document.body, "AppTabBar_Explore_Link").then(
    (tab) => tab.appendChild(exploreTabHint),
    () => logVerboseError("Could not find explore tab")
  )

  findByTestId(document.body, "AppTabBar_Notifications_Link").then(
    (tab) => tab.appendChild(notificationsTabHint),
    () => logVerboseError("Could not find notifications tab")
  )

  findByTestId(document.body, "AppTabBar_DirectMessage_Link").then(
    (tab) => tab.appendChild(messagesTabHint),
    () => logVerboseError("Could not find direct message tab")
  )

  findByRole(document.body, "link", { name: /bookmarks/i }).then(
    (tab) => tab.appendChild(bookmarksTabHint),
    () => logVerboseError("Could not find bookmarks tab")
  )

  findByRole(document.body, "link", { name: /top articles/i }).then(
    (tab) => tab.appendChild(articlesTabHint),
    () => logVerboseError("Could not find articles tab")
  )

  findByTestId(document.body, "AppTabBar_Profile_Link").then(
    (tab) => tab.appendChild(profileTabHint),
    () => logVerboseError("Could not find profile tab")
  )

  window.addEventListener("keydown", downListener)
  window.addEventListener("keyup", upListener)

  function downListener(event) {
    if (isTyping(document)) return
    if (event.key !== "g") {
      homeTabHint.classList.add("opacity-0")
      exploreTabHint.classList.add("opacity-0")
      notificationsTabHint.classList.add("opacity-0")
      messagesTabHint.classList.add("opacity-0")
      bookmarksTabHint.classList.add("opacity-0")
      articlesTabHint.classList.add("opacity-0")
      profileTabHint.classList.add("opacity-0")

      return
    }

    homeTabHint.classList.remove("opacity-0")
    exploreTabHint.classList.remove("opacity-0")
    notificationsTabHint.classList.remove("opacity-0")
    messagesTabHint.classList.remove("opacity-0")
    bookmarksTabHint.classList.remove("opacity-0")
    articlesTabHint.classList.remove("opacity-0")
    profileTabHint.classList.remove("opacity-0")
  }

  function upListener(event) {
    if (isTyping(document)) return
    if (event.key !== "g") return

    setTimeout(() => {
      homeTabHint.classList.add("opacity-0")
      exploreTabHint.classList.add("opacity-0")
      notificationsTabHint.classList.add("opacity-0")
      messagesTabHint.classList.add("opacity-0")
      bookmarksTabHint.classList.add("opacity-0")
      articlesTabHint.classList.add("opacity-0")
      profileTabHint.classList.add("opacity-0")
    }, 1000)
  }

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-[#f7f9f9]",
      "shadow-crisp"
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
  const mentionsTabHint = generateHint("G+R")
  const notificationsTabHint = generateHint("G+N")

  useUrlObserver((url) => {
    if (!url.startsWith("/notifications")) return null

    findByTestId(document.body, "primaryColumn").then((column) => {
      const mentionsTab = column.querySelector(
        'a[href="/notifications/mentions"]'
      )

      const notificationsTab = column.querySelector('a[href="/notifications"]')

      mentionsTab?.appendChild(mentionsTabHint)
      notificationsTab?.appendChild(notificationsTabHint)

      window.addEventListener("keydown", downListener)
      window.addEventListener("keyup", upListener)
    })

    return null

    function downListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") {
        mentionsTabHint.classList.add("opacity-0")
        notificationsTabHint.classList.add("opacity-0")

        return
      }

      mentionsTabHint.classList.remove("opacity-0")
      notificationsTabHint.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") return

      setTimeout(() => {
        mentionsTabHint.classList.add("opacity-0")
        notificationsTabHint.classList.add("opacity-0")
      }, 1000)
    }
  })

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",

      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-[#f7f9f9]",
      "shadow-crisp"
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
  const draftsButtonHint = generateHint("G+F")
  const scheduledButtonHint = generateHint("G+T")

  useUrlObserver(() => {
    const url = new URL(window.location.href)
    if (!url.pathname.startsWith("/compose/tweet/unsent")) return null

    findByTestId(document.body, "ScrollSnap-List").then(
      (column) => {
        const draftsButton = column.querySelector(
          'a[href="/compose/tweet/unsent/drafts"]'
        )
        const scheduledButton = column.querySelector(
          'a[href="/compose/tweet/unsent/scheduled"]'
        )

        if (draftsButton && scheduledButton) {
          draftsButton.appendChild(draftsButtonHint)
          scheduledButton.appendChild(scheduledButtonHint)

          window.addEventListener("keydown", downListener)
          window.addEventListener("keyup", upListener)
        }
      },
      () => logVerboseError("Failed to find Drafts or Scheduled tabs")
    )

    return null

    function downListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") {
        draftsButtonHint.classList.add("opacity-0")
        scheduledButtonHint.classList.add("opacity-0")

        return
      }

      draftsButtonHint.classList.remove("opacity-0")
      scheduledButtonHint.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return
      if (event.key !== "g") return

      setTimeout(() => {
        draftsButtonHint.classList.add("opacity-0")
        scheduledButtonHint.classList.add("opacity-0")
      }, 1000)
    }
  })

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",

      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-[#f7f9f9]",
      "shadow-crisp"
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
  const draftsButtonHint = generateHint("G+F")
  const closeButtonHint = generateHint("ESC")
  const tweetButtonHint = generateInlineHint("CMD+ENTER")

  useUrlObserver(() => {
    const url = new URL(window.location.href)
    if (url.pathname !== "/compose/tweet") return null

    findByTestId(document.body, "tweetButton").then(
      (tweetButton) => {
        tweetButton.style.flexDirection = "row"
        tweetButton.appendChild(tweetButtonHint)
      },
      () => logVerboseError("Failed to find tweet button")
    )

    findByTestId(document.body, "unsentButton").then(
      (draftsButton) => {
        draftsButton.appendChild(draftsButtonHint)
        findByTestId(document.body, "app-bar-close").then((closeButton) => {
          closeButton.appendChild(closeButtonHint)
        })

        window.addEventListener("keydown", downListener)
        window.addEventListener("keyup", upListener)
      },
      () => logVerboseError("Failed to find drafts button")
    )

    return null

    function downListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") {
        draftsButtonHint.classList.add("opacity-0")
        closeButtonHint.classList.add("opacity-0")

        return
      }

      draftsButtonHint.classList.remove("opacity-0")
      closeButtonHint.classList.remove("opacity-0")
    }

    function upListener(event) {
      if (isTyping(document)) return

      if (event.key !== "g") return

      setTimeout(() => {
        draftsButtonHint.classList.add("opacity-0")
        closeButtonHint.classList.add("opacity-0")
      }, 1000)
    }
  })

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",

      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-[#f7f9f9]",
      "shadow-crisp"
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
      "px-2",
      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-white"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add("flex", "items-center", "mx-2")
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useNewTweetHotkeys() {
  const newTweetButtonHint = generateHint(".")

  findByTestId(document.body, "primaryColumn").then((primaryColumn) => {
    const newTweetBar =
      primaryColumn.firstElementChild?.firstElementChild?.lastElementChild
    if (!(newTweetBar instanceof HTMLElement)) return

    if (newTweetBar) {
      const observer = new MutationObserver(() => {
        findByRole(newTweetBar, "button", {
          name: /new tweets/i,
          hidden: true,
        }).then(
          (newTweetPrompt) => {
            newTweetPrompt.style.flexDirection = "row"
            newTweetPrompt.appendChild(newTweetButtonHint)
          },
          () => logVerboseError("Failed to find new tweets button")
        )
      })

      observer.observe(newTweetBar, { childList: true })
    }
  })

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-200",
      "px-2",

      "text-sm",
      "font-medium",
      "text-gray-500",
      "bg-[#f7f9f9]",
      "shadow-crisp"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add("flex", "items-center", "mx-2")
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
}

function useTweetHotkeys() {
  const likeButtonHint = generateHint("L")
  const retweetButtonHint = generateHint("T")
  const replyButtonHint = generateHint("R")
  const shareButtonHint = generateHint("S")
  const minimizeButtonHint = generateHint("E")
  const additionalActionsHint = document.createElement("div")
  const nextTweetActionHint = generateActionHint("Next", "J")
  const prevTweetActionHint = generateActionHint("Previous", "K")
  const bookmarkActionHint = generateActionHint("Bookmark", "B")
  const muteActionHint = generateActionHint("Mute", "U")
  const blockActionHint = generateActionHint("Block", "X")

  const focusListener = ({ target }) => {
    if (!(target instanceof HTMLElement)) return
    if (target.tagName !== "ARTICLE") return
    if (target.dataset.testid !== "tweet") return

    const likeButton = queryByTestId(target, "like")
    likeButton?.appendChild(likeButtonHint)

    const unlikeButton = queryByTestId(target, "unlike")
    unlikeButton?.appendChild(likeButtonHint)

    const retweetButton = queryByTestId(target, "retweet")
    retweetButton?.appendChild(retweetButtonHint)

    const unretweetButton = queryByTestId(target, "unretweet")
    unretweetButton?.appendChild(retweetButtonHint)

    const replyButton = queryByTestId(target, "reply")
    replyButton?.appendChild(replyButtonHint)

    const shareButton = queryByRole(target, "button", {
      name: /share tweet/i,
    })
    shareButton?.appendChild(shareButtonHint)

    const minimizeButton = queryByTestId(target, "minimize")
    minimizeButton?.appendChild(minimizeButtonHint)

    const header = getByTestId(document.body, "primaryColumn")
    header?.firstElementChild?.firstElementChild?.appendChild(
      additionalActionsHint
    )
    additionalActionsHint.classList.add(
      "absolute",
      "bg-white/95",
      "border-gray-200",
      "border",
      "bottom-0",
      "flex",
      "gap-x-4",
      "px-2",
      "py-1",
      "right-0",
      "rounded",
      "text-gray-500",
      "text-sm",
      "translate-y-1/2"
    )

    additionalActionsHint.appendChild(nextTweetActionHint)
    additionalActionsHint.appendChild(prevTweetActionHint)
    additionalActionsHint.appendChild(bookmarkActionHint)
    additionalActionsHint.appendChild(muteActionHint)
    additionalActionsHint.appendChild(blockActionHint)
  }

  const blurListener = ({ target }) => {
    if (!(target instanceof HTMLElement)) return
    if (target.tagName !== "ARTICLE") return
    if (target.dataset.testid !== "tweet") return

    likeButtonHint.remove()
    retweetButtonHint.remove()
    replyButtonHint.remove()
    shareButtonHint.remove()
    minimizeButtonHint.remove()
    additionalActionsHint.remove()
    nextTweetActionHint.remove()
    prevTweetActionHint.remove()
    bookmarkActionHint.remove()
    muteActionHint.remove()
    blockActionHint.remove()
  }

  document.addEventListener("focusin", focusListener)
  document.addEventListener("focusout", blurListener)

  function generateHint(key: string) {
    const hint = document.createElement("kbd")
    hint.classList.add(
      "inline-flex",
      "items-center",
      "rounded",
      "border",
      "border-gray-100",
      "px-2",
      "text-gray-500",
      "text-sm",
      "font-medium",
      "bg-white",
      "shadow-crisp"
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
      "border-gray-100",
      "px-2",
      "font-medium",
      "bg-[#f7f9f9]",
      "shadow-crisp"
    )
    hint.textContent = key
    const hintWrapper = document.createElement("div")
    hintWrapper.classList.add("inline-flex", "items-center", "gap-x-1")
    hintWrapper.textContent = label
    hintWrapper.appendChild(hint)

    return hintWrapper
  }
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
