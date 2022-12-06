import "chrome-types"

import * as ReactDOM from "react-dom/client"
import "./index.css"
import {
  createHashRouter,
  json,
  LoaderFunctionArgs,
  Outlet,
  redirect,
  Route,
  RouterProvider,
  useLoaderData,
  useMatches,
} from "react-router-dom"
import { StrictMode } from "react"

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

    if (first === "index") {
      routes.push({
        path: "",
        element: Element ? <Element /> : null,
        loader: route.loader,
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

console.log({ children })
const root = document.getElementById("root")
invariant(root)
ReactDOM.createRoot(root).render(
  <StrictMode>
    <RouterProvider
      router={createHashRouter([
        {
          path: "*",
          element: <Main />,
          loader,
          children: recursivelySetIndexes(children),
        },
      ])}
    />
  </StrictMode>
)
import React from "react"
import invariant from "tiny-invariant"
import { getAuthHeaders } from "../utils/getAuthHeaders"

export async function loader({ request }: LoaderFunctionArgs) {}

function Main() {
  const matches = useMatches()
  console.log({ matches })
  return (
    <div>
      <Outlet />
    </div>
  )
}
