import invariant from "tiny-invariant"
import { getAuthHeaders } from "./getAuthHeaders"

export async function friendlyFetch(key, url, options = {}) {
  const headers = await getAuthHeaders()

  const cachedData = await chrome.runtime.sendMessage({
    message: "readCache",
    key,
  })

  console.log({ cachedData })

  if (cachedData) {
    const { cacheTime, ...data } = cachedData

    const cacheRemaining = cacheTime - Date.now() + 1000 * 60
    console.info(`📦 ${key} is cached, ${cacheRemaining}ms remaining`)
    if (cacheRemaining > 0) {
      console.info(`  Returning from cache`)
      return data
    }
  } else {
    console.info(`📦 ${key} is not cached`)
  }

  const headResponse = await fetch(url, {
    method: "HEAD",
    headers,
  }).then((response) => response.headers)

  if (headResponse.get("x-rate-limit-remaining") === "0") {
    const cacheReset = headResponse.get("x-rate-limit-reset")
    invariant(cacheReset)

    console.error(
      `  Rate limit exceeded, check back at ${new Date(
        Number(cacheReset) * 1000
      )}. Returning from cache`
    )

    return cachedData
  }

  console.info(`  Fetching fresh data,`)
  const response = await fetch(url, {
    headers,
    ...options,
  }).then((response) => response.json())

  const cacheReset = headResponse.get("x-rate-limit-reset")
  invariant(cacheReset)

  const cacheRemaining = Number(cacheReset) * 1000 - Date.now()
  console.info(`  Saving data to cache, ${cacheRemaining}ms remaining`)

  console.log({ response })
  chrome.runtime.sendMessage({
    message: "writeCache",
    key,
    value: {
      ...response,
      cacheTime: Number(cacheReset) * 1000,
    },
  })

  return response
}
