import invariant from "tiny-invariant"

export async function getSessionHeaders() {
  const data = await chrome.runtime.sendMessage({
    message: "getSessionToken",
  })

  invariant(data.sessionToken, 'missing "sessionToken"')

  return {
    authorization: `Bearer ${data.sessionToken}`,
  }
}
