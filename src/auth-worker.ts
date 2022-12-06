import "chrome-types"

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (!details.requestHeaders) return

    const authorization = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === "authorization"
    )

    if (authorization) {
      chrome.storage.local.set({
        authorization: authorization.value,
      })
    }

    const xCsrfToken = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === "x-csrf-token"
    )

    if (xCsrfToken) {
      chrome.storage.local.set({
        "x-csrf-token": xCsrfToken.value,
      })
    }

    return {
      requestHeaders: details.requestHeaders,
    }
  },
  {
    urls: ["<all_urls>"],
  },
  ["requestHeaders"]
)

chrome.runtime.onMessage.addListener(
  (data, sender, sendResponse: (arg) => void) => {
    console.info("💬", data.message)
    switch (data.message) {
      case "getAuthHeaders":
        chrome.storage.local
          .get(["authorization", "x-csrf-token"])
          .then((data) => {
            sendResponse(data)
          })

        return true
      case "getUserInfo":
        chrome.storage.local.get("userInfo").then((data) => {
          sendResponse(data)
        })

        return true
      case "setUserInfo":
        chrome.storage.local.set({
          userInfo: data.userInfo,
        })

        return false
      case "getSessionToken":
        chrome.storage.local.get("sessionToken").then((data) => {
          sendResponse(data)
        })

        return true
      case "setSessionToken":
        chrome.storage.local.set({
          sessionToken: data.sessionToken,
        })

        return false
      case "writeCache":
        chrome.storage.local.set({
          [`cache:${data.key}`]: data.value,
        })

        return false
      case "readCache":
        chrome.storage.local.get(`cache:${data.key}`).then((cacheData) => {
          if (cacheData && cacheData[`cache:${data.key}`]) {
            sendResponse(cacheData[`cache:${data.key}`])
          }

          sendResponse(null)
        })

        return true
      default:
        console.error("💬 Unknown message", data)
        return false
    }
  }
)
