import { LoaderFunctionArgs, useLoaderData } from "react-router-dom"
import invariant from "tiny-invariant"
import { MinimalTweet, Tweet } from "../components/Tweet"
import { getFeeds } from "../getFeeds"
import { getAuthHeaders } from "../../utils/getAuthHeaders"
import { getSessionHeaders } from "../../utils/getSessionHeaders"

export async function loader({ params }: LoaderFunctionArgs) {
  console.log({ params })
  const { feedId } = params

  if (feedId == undefined) {
    return {
      tweets: [],
    }
  }

  const response = await fetch("http://127.0.0.1:3000/api/feeds", {
    method: "GET",
    headers: await getSessionHeaders(),
  }).then((response) => response.json())

  const feeds = response.feeds.data.map((feed) => ({
    ...feed,
    queries: feed.searchString.split("OR").map((query) => query.trim()),
  }))

  const feed = feeds.find((feed) => feed.index === Number(feedId))
  invariant(feed?.index != undefined, "Feed not found")

  // Optimize call
  feed.queries = [feed.queries.join(" OR ")]

  const whenTweets = feed.queries.flatMap(async (query) => {
    const firstFeed = await searchTweets({ query })
    const newTweets = Object.values(firstFeed.tweets)

    return newTweets.map((tweet) => ({
      ...tweet,
      html: tweet.full_text,
      author: firstFeed.users[tweet.user_id_str],
    }))
  })

  return {
    tweets: (await Promise.all(whenTweets)).flat(),
  }

  async function searchTweets({ query }) {
    const baseUrl = "https://api.twitter.com/2/search/adaptive.json"
    const url = new URL(baseUrl)
    url.searchParams.append("include_profile_interstitial_type", "1")
    url.searchParams.append("include_blocking", "1")
    url.searchParams.append("include_blocked_by", "1")
    url.searchParams.append("include_followed_by", "1")
    url.searchParams.append("include_want_retweets", "1")
    url.searchParams.append("include_mute_edge", "1")
    url.searchParams.append("include_can_dm", "1")
    url.searchParams.append("include_can_media_tag", "1")
    url.searchParams.append("include_ext_has_nft_avatar", "1")
    url.searchParams.append("include_ext_is_blue_verified", "1")
    url.searchParams.append("skip_status", "1")
    url.searchParams.append("cards_platform", "Web-12")
    url.searchParams.append("include_cards", "1")
    url.searchParams.append("include_ext_alt_text", "true")
    url.searchParams.append("include_ext_limited_action_results", "false")
    url.searchParams.append("include_quote_count", "true")
    url.searchParams.append("include_reply_count", "1")
    url.searchParams.append("tweet_mode", "extended")
    url.searchParams.append("include_ext_collab_control", "true")
    url.searchParams.append("include_entities", "true")
    url.searchParams.append("include_user_entities", "true")
    url.searchParams.append("include_ext_media_color", "true")
    url.searchParams.append("include_ext_media_availability", "true")
    url.searchParams.append("include_ext_sensitive_media_warning", "true")
    url.searchParams.append("include_ext_trusted_friends_metadata", "true")
    url.searchParams.append("send_error_codes", "true")
    url.searchParams.append("simple_quoted_tweet", "true")
    url.searchParams.append("q", query)
    url.searchParams.append("tweet_search_mode", "live")
    url.searchParams.append("count", "20")
    url.searchParams.append("query_source", "typed_query")
    url.searchParams.append("pc", "1")
    url.searchParams.append("spelling_corrections", "1")
    url.searchParams.append("include_ext_edit_control", "true")
    url.searchParams.append(
      "ext",
      "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,enrichments,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe"
    )

    const headers = await getAuthHeaders()

    type Response = {
      globalObjects: {
        tweets: Record<string, any>
        users: Record<string, any>
      }
    }

    const data: Response = await fetch(url.toString(), {
      headers,
      credentials: "include",
    }).then((response) => response.json())

    console.log({ data })
    invariant(data.globalObjects, "missing globalObjects")
    invariant(data.globalObjects.tweets, "missing tweets")

    return {
      tweets: data.globalObjects.tweets,
      users: data.globalObjects.users,
    }
  }
}

export default function Feed() {
  const { tweets } = useLoaderData() as Awaited<ReturnType<typeof loader>>

  return (
    <div>
      {tweets.map((tweet) => (
        <MinimalTweet key={tweet.id_str} tweet={tweet} />
      ))}
    </div>
  )
}
