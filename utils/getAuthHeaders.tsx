import invariant from "tiny-invariant"

export async function getAuthHeaders() {
  const data = await chrome.runtime.sendMessage({
    message: "getAuthHeaders",
  })

  invariant(data.authorization, 'missing "authorization" header')
  invariant(data["x-csrf-token"], 'missing "x-csrf-token" header')

  return {
    authorization: data.authorization as string,
    ["x-csrf-token"]: data["x-csrf-token"] as string,
  }
}
