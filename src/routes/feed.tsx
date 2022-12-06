import { PlusIcon } from "@heroicons/react/24/solid"
import {
  Link,
  LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router-dom"
import { getSessionHeaders } from "../../utils/getSessionHeaders"
export async function loader(args: LoaderFunctionArgs) {
  const { feeds } = await fetch("http://127.0.0.1:3000/api/feeds", {
    method: "GET",
    headers: await getSessionHeaders(),
  }).then((response) => response.json())

  return {
    feeds: feeds.data.map((feed) => ({
      ...feed,
    })),
  }
}
export default function FeedList() {
  const { feeds } = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const params = useParams()
  const feedId = params.feedId
  const feed = feeds.find((feed) => feed.index === Number(feedId))

  const navigate = useNavigate()

  async function deleteFeed(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    console.log(data)

    const response = await fetch(
      `http://127.0.0.1:3000/api/feeds/${data.feedId}`,
      {
        method: "DELETE",
        headers: await getSessionHeaders(),
      }
    ).then((response) => response.json())

    console.log(response)
    navigate("/super/feed")
  }
  return (
    <>
      <div className="w-[600px] border-x border-gray-100 min-h-screen">
        <div className="px-4 flex py-1">
          <div className="flex flex-1 justify-center flex-col">
            <h2 className="leading-6 text-xl font-bold whitespace-nowrap text-ellipsis overflow-hidden">
              Supertwitter
            </h2>
            <div className="text-sm text-gray-500"> Last 24 hours </div>
          </div>
        </div>
        <header>
          <div className="overflow-x-auto">
            <nav>
              <ul className="flex border-b border-gray-100">
                {feeds.map((feed) => (
                  <li className="flex-grow-1 w-full text-center">
                    <Link
                      className={`block border border-transparent px-6 py-4 font-medium  hover:bg-gray-200 hover:text-gray-700 whitespace-nowrap ${
                        feed.index === Number(feedId)
                          ? "font-bold text-black"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      key={feed.index}
                      to={`/super/feed/${String(feed.index)}`}
                    >
                      <span
                        className={`py-4 ${
                          feed.index === Number(feedId)
                            ? "border-b-4 border-sky-500"
                            : ""
                        }`}
                      >
                        {feed.name}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="text-center">
                  <Link
                    className={`block border border-transparent px-6 py-4 font-medium  hover:bg-gray-200 text-gray-500 hover:text-gray-700`}
                    to="/super/feed"
                  >
                    <span className="sr-only"> New Feed </span>
                    <span
                      aria-hidden
                      className={`p-4 ${
                        feed ? "" : "border-b-4 border-sky-500"
                      }`}
                    >
                      +
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <div className="w-full">
          {feed ? (
            <div className="py-2 px-4">
              <div className="mt-1">
                <input
                  id="query"
                  name="query"
                  type="text"
                  disabled
                  defaultValue={feed.searchString}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>
          ) : null}
          <div>
            <Outlet />
          </div>
        </div>
      </div>
      <div className="w-[350px] mr-[10px] py-8">
        <div className="rounded-[36px] bg-gray-100 px-4 py-4">
          <form onSubmit={deleteFeed}>
            <input type="hidden" name="feedId" value={feedId} />

            <h3 className="text-2xl font-bold mb-4 px-4"> Feed settings </h3>

            <div className="mt-4">
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-transparent bg-rose-500 px-4 py-2 font-bold text-white hover:bg-rose-600 hover:ring-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-600 focus:ring-offset-4"
              >
                Delete feed
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
