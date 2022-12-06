export async function validateUser() {
  let sessionToken = null
  ;({ sessionToken } = await chrome.runtime.sendMessage({
    message: "getSessionToken",
  }))

  if (!sessionToken) {
    const { userInfo } = await chrome.runtime.sendMessage({
      message: "getUserInfo",
    })

    const form = new FormData()
    form.append("screen_name", userInfo.screen_name)
    form.append("id", userInfo.id_str)

    const { token } = await fetch("http://127.0.0.1:3000/app/actions/auth", {
      method: "POST",
      body: form,
    }).then((response) => response.json())

    sessionToken = token

    await chrome.runtime.sendMessage({
      message: "setSessionToken",
      sessionToken,
    })
  }

  const response = await fetch("http://127.0.0.1:3000/app/actions/validate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  })

  const isValid = response.status === 200

  return {
    isValid,
    loginUrl: await response.text(),
  }
}
