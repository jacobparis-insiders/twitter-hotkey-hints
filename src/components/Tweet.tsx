import { useNavigate } from "react-router-dom"
import { ExternalLink } from "./ExternalLink"

type Tweet = {
  media:
    | Array<
        | {
            alt_text: string
            height: number
            type: "photo"
            url: string
            width: number
          }
        | {
            height: number
            preview_image_url: string
            type: "animated_gif" | "video"
            variants: { url: string }[]
            width: number
          }
      >
    | undefined
  referenced_tweets: Tweet[] | undefined
  type: "quoted" | null
  author: { name: string; screen_name: string; profile_image_url: string }
  attachments: {
    media_key: string
    height: number
    width: number
    type: string
    preview_image_url: string
  }[]
  replyingTo: string[]
  html: string
  id: string
  created_at: string
}

export function Tweet({ tweet }: { tweet: Tweet }) {
  let grid = tweet.media
    ? {
        4: `
    "media-0 media-1" 10rem
    "media-2 media-3" 10rem
    / 50% 50%;
    `,
        3: `
    "media-0 media-1" 10rem
    "media-0 media-2" 10rem
    / 1fr 1fr;
    `,
        2: `
    "media-0 media-1" 20rem
    / 50% 50%
    `,
        1: `"media-0" 100% / 100%`,
      }[tweet.media?.length]
    : undefined

  const quotedTweet = tweet.referenced_tweets?.find(
    (tweet) => tweet.type === "quoted"
  )

  return (
    <article
      className={`pt-4 hover:bg-gray-50 cursor-pointer px-4`}
      tabIndex={0}
      onClick={(e) => {
        window.location.assign(
          `/${tweet.author.screen_name}/status/${tweet.id_str}`
        )
      }}
    >
      <div className="border-b border-gray-100">
        <header className="mb-6">
          <TweetAuthor
            name={tweet.author.name}
            screen_name={tweet.author.screen_name}
            profile_image_url={tweet.author.profile_image_url}
          />
        </header>

        {tweet.in_reply_to_screen_name ? (
          <p className=" mb-3 text-sm text-gray-600">
            Replying to{" "}
            {/* {tweet.replyingTo.map((username, i) => (
              <span key={username}>
                {i !== 0 && i === tweet.replyingTo.length - 1 ? (
                  <span> and </span>
                ) : null} */}
            <a
              href={`/${tweet.in_reply_to_screen_name}`}
              className="text-sky-500"
            >
              @{tweet.in_reply_to_screen_name}{" "}
            </a>
            {/* </span> */}
            {/* ))} */}
          </p>
        ) : null}

        <div className={`mb-4 text-lg`}>
          <div dangerouslySetInnerHTML={{ __html: tweet.html }}></div>
        </div>

        {tweet.media?.length ? (
          <div
            className="mt-2 mb-4 grid gap-1 overflow-hidden rounded-2xl border border-solid border-gray-300 "
            style={{ grid: grid }}
          >
            {tweet.media.map((media, i) => {
              if (media.type === "photo") {
                return (
                  <div className="relative">
                    <img
                      key={i}
                      className="h-full w-full object-cover"
                      style={{ gridArea: `media-${i}` }}
                      alt={media.alt_text}
                      src={media.url}
                      width={media.width}
                      height={media.height}
                    />
                    <div className="absolute left-0 bottom-0 p-3">
                      {media.alt_text ? (
                        <div
                          className="rounded bg-black px-1 text-sm font-bold text-white"
                          title={media.alt_text}
                        >
                          ALT
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              }

              if (media.type === "animated_gif") {
                return (
                  <div className="relative">
                    <video
                      key={i}
                      src={media.variants[0].url}
                      poster={media.preview_image_url}
                      preload="none"
                      autoPlay
                      loop
                    />
                    <div className="absolute left-0 bottom-0 p-3">
                      <div className="rounded bg-black px-1 text-sm font-bold text-white">
                        GIF
                      </div>
                    </div>
                  </div>
                )
              }

              if (media.type === "video") {
                return (
                  <div className="relative bg-black">
                    <video
                      key={i}
                      controls
                      src={media.variants.at(-1).url}
                      poster={media.preview_image_url}
                      autoPlay
                      muted
                      className="h-full"
                      preload="none"
                    />
                  </div>
                )
              }

              throw new Error(`Unsupported media type ${media.type}`)
            })}
          </div>
        ) : null}

        {tweet.card ? (
          tweet.card.name === "summary_large_image" ? (
            <div className="">
              <div
                aria-labelledby="id__w0owps3m05 id__fh11r8w6j57"
                className="mt-3"
                id="id__aqglmsewaow"
              >
                <div
                  aria-labelledby="id__8vkqruv7794 id__xqd9cq4nc"
                  className="rounded-2xl overflow-hidden border border-gray-200 hover:bg-gray-100 bg-white transition-colors duration-200"
                >
                  <div
                    aria-hidden="true"
                    className="rounded-t-2xl overflow-hidden border-b border-gray-200 relative"
                  >
                    <a
                      href="https://t.co/k5lfnKrk8K"
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      role="link"
                      tabIndex={-1}
                      className=""
                    >
                      <div className="overflow-hidden">
                        <div className="pb-[52.356%] w-full" />
                        <div className="absolute inset-0 h-full w-full">
                          <div
                            aria-label="A gate at a Duke Energy substation in Moore County, N.C., on Sunday. Customers in the county lost power starting on Saturday night."
                            className="absolute inset-0 overflow-hidden"
                          >
                            <div
                              className="bg-cover"
                              style={{
                                backgroundImage:
                                  "url(&quot;https://pbs.twimg.com/card_img/1599508068567506946/9ps-KYrA?format=jpg&amp;name=900x900&quot;)",
                              }}
                            ></div>
                            <img
                              alt="A gate at a Duke Energy substation in Moore County, N.C., on Sunday. Customers in the county lost power starting on Saturday night."
                              draggable="true"
                              src="https://pbs.twimg.com/card_img/1599508068567506946/9ps-KYrA?format=jpg&amp;name=900x900"
                              className="inset-0 h-full w-full "
                            />
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="">
                    <a
                      href="https://t.co/k5lfnKrk8K"
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      role="link"
                      className=""
                    >
                      <div className="flex gap-[2px] p-3 flex-col justify-center shrink grow  leading-5">
                        <div className="text-gray-600">nytimes.com</div>
                        <div className="">
                          North Carolina Power Outages Caused by Gunfire at
                          Substations, Officials Say
                        </div>
                        <div className="text-gray-600">
                          About 45,000 customers were without power in Moore
                          County after what an official described as an
                          “intentional, willful and malicious” attack on two
                          substations.
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : null
        ) : null}
        {quotedTweet ? <MinimalTweet tweet={quotedTweet} /> : null}
        <div className="my-4 flex flex-col ">
          <span className="text-gray-600 ">
            <time
              title={`Time Posted: ${new Date(tweet.created_at).toUTCString()}`}
              dateTime={new Date(tweet.created_at).toISOString()}
            >
              {new Date(tweet.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </span>
        </div>

        <div role="group" className="px-2 py-4 flex border-t border-gray-100 ">
          {tweet.retweet_count ? (
            <div className="mr-5">
              <a
                href={`/${tweet.author.screen_name}/status/${tweet.id_str}/retweets`}
                className="hover:underline text-gray-600"
              >
                <strong className="font-bold text-black">
                  {tweet.retweet_count}
                </strong>{" "}
                Retweets
              </a>
            </div>
          ) : null}

          {tweet.quote_count ? (
            <div className="mr-5">
              <a
                href={`/${tweet.author.screen_name}/status/${tweet.id_str}/retweets/with_comments`}
                className="hover:underline text-gray-600"
              >
                <strong className="font-bold text-black">
                  {tweet.quote_count}
                </strong>{" "}
                Quote tweets
              </a>
            </div>
          ) : null}

          {tweet.favorite_count ? (
            <div className="mr-5">
              <a
                href={`/${tweet.author.screen_name}/status/${tweet.id_str}/likes`}
                className="hover:underline text-gray-600"
              >
                <strong className="font-bold text-black">
                  {tweet.favorite_count}
                </strong>{" "}
                Likes
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function MinimalTweet({ tweet }: { tweet: Tweet }) {
  let grid = tweet.media
    ? {
        4: `
    "media-0 media-1" 10rem
    "media-2 media-3" 10rem
    / 50% 50%;
    `,
        3: `
    "media-0 media-1" 10rem
    "media-0 media-2" 10rem
    / 1fr 1fr;
    `,
        2: `
    "media-0 media-1" 20rem
    / 50% 50%
    `,
        1: `"media-0" 100% / 100%`,
      }[tweet.media?.length]
    : undefined

  const quotedTweet = tweet.referenced_tweets?.find(
    (tweet) => tweet.type === "quoted"
  )

  return (
    <article
      className={`pt-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer px-3`}
      tabIndex={0}
      onClick={(e) => {
        window.location.assign(
          `/${tweet.author.screen_name}/status/${tweet.id_str}`
        )
      }}
    >
      <div className="border-b border-gray-100 flex">
        <div className="flex flex-col mr-3 basis-12 shrink-0 items-center gap-1">
          <img
            alt={tweet.author.name}
            src={tweet.author.profile_image_url}
            decoding="async"
            className="h-fit rounded-full"
          />
          <div className="w-[2px] bg-gray-200 grow" />
          <div className="p-2">
            <img
              alt={tweet.author.name}
              src={tweet.author.profile_image_url}
              decoding="async"
              className="h-8 w-8 rounded-full"
            />
          </div>
        </div>
        <div className="pb-3">
          <header className="mb-[2px]">
            <div className="flex gap-x-2">
              <div className="font-bold" title={tweet.author.name}>
                {tweet.author.name}
              </div>
              <div className="text-gray-600" title={tweet.author.screen_name}>
                @{tweet.author.screen_name}
              </div>
              <span className="text-gray-600 hover:text-gray-500 hover:underline">
                <time
                  title={`Time Posted: ${new Date(
                    tweet.created_at
                  ).toUTCString()}`}
                  dateTime={new Date(tweet.created_at).toISOString()}
                >
                  {new Date(tweet.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </span>
            </div>
          </header>

          {tweet.in_reply_to_screen_name ? (
            <p className="text-sm text-gray-600">
              Replying to{" "}
              {/* {tweet.replyingTo.map((username, i) => (
              <span key={username}>
                {i !== 0 && i === tweet.replyingTo.length - 1 ? (
                  <span> and </span>
                ) : null} */}
              <a
                href={`/${tweet.in_reply_to_screen_name}`}
                className="text-sky-500"
              >
                @{tweet.in_reply_to_screen_name}{" "}
              </a>
              {/* </span> */}
              {/* ))} */}
            </p>
          ) : null}

          <div className={`mb-4 `}>
            <div dangerouslySetInnerHTML={{ __html: tweet.html }}></div>
          </div>

          {tweet.media?.length ? (
            <div
              className="mt-2 mb-4 grid gap-1 overflow-hidden rounded-2xl border border-solid border-gray-300 "
              style={{ grid: grid }}
            >
              {tweet.media.map((media, i) => {
                if (media.type === "photo") {
                  return (
                    <div className="relative">
                      <img
                        key={i}
                        className="h-full w-full object-cover"
                        style={{ gridArea: `media-${i}` }}
                        alt={media.alt_text}
                        src={media.url}
                        width={media.width}
                        height={media.height}
                      />
                      <div className="absolute left-0 bottom-0 p-3">
                        {media.alt_text ? (
                          <div
                            className="rounded bg-black px-1 text-sm font-bold text-white"
                            title={media.alt_text}
                          >
                            ALT
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                }

                if (media.type === "animated_gif") {
                  return (
                    <div className="relative">
                      <video
                        key={i}
                        src={media.variants[0].url}
                        poster={media.preview_image_url}
                        preload="none"
                        autoPlay
                        loop
                      />
                      <div className="absolute left-0 bottom-0 p-3">
                        <div className="rounded bg-black px-1 text-sm font-bold text-white">
                          GIF
                        </div>
                      </div>
                    </div>
                  )
                }

                if (media.type === "video") {
                  return (
                    <div className="relative bg-black">
                      <video
                        key={i}
                        controls
                        src={media.variants.at(-1).url}
                        poster={media.preview_image_url}
                        autoPlay
                        muted
                        className="h-full"
                        preload="none"
                      />
                    </div>
                  )
                }

                throw new Error(`Unsupported media type ${media.type}`)
              })}
            </div>
          ) : null}

          {tweet.card ? (
            tweet.card.name === "summary_large_image" ? (
              <div className="">
                <div
                  aria-labelledby="id__w0owps3m05 id__fh11r8w6j57"
                  className="mt-3"
                  id="id__aqglmsewaow"
                >
                  <div
                    aria-labelledby="id__8vkqruv7794 id__xqd9cq4nc"
                    className="rounded-2xl overflow-hidden border border-gray-200 hover:bg-gray-100 bg-white transition-colors duration-200"
                  >
                    <div
                      aria-hidden="true"
                      className="rounded-t-2xl overflow-hidden border-b border-gray-200 relative"
                    >
                      <a
                        href="https://t.co/k5lfnKrk8K"
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        role="link"
                        tabIndex={-1}
                        className=""
                      >
                        <div className="overflow-hidden">
                          <div className="pb-[52.356%] w-full" />
                          <div className="absolute inset-0 h-full w-full">
                            <div
                              aria-label="A gate at a Duke Energy substation in Moore County, N.C., on Sunday. Customers in the county lost power starting on Saturday night."
                              className="absolute inset-0 overflow-hidden"
                            >
                              <div
                                className="bg-cover"
                                style={{
                                  backgroundImage:
                                    "url(&quot;https://pbs.twimg.com/card_img/1599508068567506946/9ps-KYrA?format=jpg&amp;name=900x900&quot;)",
                                }}
                              ></div>
                              <img
                                alt="A gate at a Duke Energy substation in Moore County, N.C., on Sunday. Customers in the county lost power starting on Saturday night."
                                draggable="true"
                                src="https://pbs.twimg.com/card_img/1599508068567506946/9ps-KYrA?format=jpg&amp;name=900x900"
                                className="inset-0 h-full w-full "
                              />
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                    <div className="">
                      <a
                        href="https://t.co/k5lfnKrk8K"
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        role="link"
                        className=""
                      >
                        <div className="flex gap-[2px] p-3 flex-col justify-center shrink grow leading-5">
                          <div className="text-gray-600">nytimes.com</div>
                          <div className="">
                            North Carolina Power Outages Caused by Gunfire at
                            Substations, Officials Say
                          </div>
                          <div className="text-gray-600">
                            About 45,000 customers were without power in Moore
                            County after what an official described as an
                            “intentional, willful and malicious” attack on two
                            substations.
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ) : null}
          {quotedTweet ? <MinimalTweet tweet={quotedTweet} /> : null}

          <div>
            <div
              aria-label="2 likes"
              role="group"
              className="flex justify-between gap-2 mt-3 max-w-[425px]"
            >
              <div className="flex justify-start">
                <div
                  aria-label="0 Replies. Reply"
                  role="button"
                  tabIndex={0}
                  data-testid="reply"
                  className="flex justify-center select-none group text-gray-700 hover:text-sky-600 transition-colors duration-200"
                >
                  <div className="flex  leading-5 justify-start items-center  whitespace-nowrap">
                    <div className="inline-flex relative">
                      <div className="absolute inset-0 z-0 -m-2 rounded-full bg-transparent group-hover:bg-sky-100 transition-colors duration-200"></div>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="w-5 h-5 fill-current z-0"
                      >
                        <g>
                          <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                        </g>
                      </svg>
                    </div>
                    <div className="px-3">
                      {tweet.reply_count ? (
                        <span className="">{tweet.reply_count}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  aria-expanded="false"
                  aria-haspopup="menu"
                  aria-label="0 Retweets. Retweet"
                  role="button"
                  tabIndex={0}
                  className="flex justify-center select-none group text-gray-700 hover:text-green-600 transition-colors duration-200"
                  data-testid="retweet"
                >
                  <div className="flex  leading-5 justify-start items-center  whitespace-nowrap">
                    <div className="inline-flex relative">
                      <div className="absolute inset-0 z-0 -m-2 rounded-full bg-transparent group-hover:bg-green-100 transition-colors duration-200"></div>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="w-5 h-5 fill-current z-0"
                      >
                        <g>
                          <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                        </g>
                      </svg>
                    </div>
                    <div className="px-3">
                      {(tweet.retweet_count || 0) + (tweet.quote_count || 0) ? (
                        <span className="">
                          {(tweet.retweet_count || 0) +
                            (tweet.quote_count || 0)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  aria-label="2 Likes. Like"
                  role="button"
                  tabIndex={0}
                  className="flex justify-center select-none group text-gray-700 hover:text-rose-600 transition-colors duration-200"
                  data-testid="like"
                >
                  <div className="flex  leading-5 justify-start items-center  whitespace-nowrap ">
                    <div className="inline-flex relative">
                      <div className="absolute inset-0 z-0 -m-2 rounded-full bg-transparent group-hover:bg-rose-100 transition-colors duration-200"></div>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="w-5 h-5 fill-current z-0"
                      >
                        <g>
                          <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                        </g>
                      </svg>
                    </div>
                    <div className="px-3">
                      {tweet.favorite_count ? (
                        <span className="">{tweet.favorite_count}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="">
                  <div
                    aria-expanded="false"
                    aria-haspopup="menu"
                    aria-label="Share Tweet"
                    role="button"
                    tabIndex={0}
                    className="flex justify-center select-none group text-gray-700 hover:text-sky-600 transition-colors duration-200"
                  >
                    <div className="flex leading-5 justify-start items-center  whitespace-nowrap">
                      <div className="inline-flex relative">
                        <div className="absolute inset-0 z-0 -m-2 rounded-full bg-transparent group-hover:bg-sky-100 transition-colors duration-200"></div>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="w-5 h-5 fill-current z-0"
                        >
                          <g>
                            <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 mt-3 max-w-[425px]">
            <div className=" text-sky-500">Show this thread</div>
          </div>
        </div>
      </div>
    </article>
  )
}

function TweetAuthor({ screen_name, name, profile_image_url, className = "" }) {
  return (
    <a href={`/intent/follow?screen_name=${screen_name}`} className={className}>
      <div className="flex gap-x-4">
        <img
          alt={name}
          src={profile_image_url}
          decoding="async"
          className="h-fit rounded-full"
        />
        <div>
          <div className="text-lg font-bold" title={name}>
            {name}
          </div>
          <div className="text-gray-600" title={screen_name}>
            @{screen_name}
          </div>
        </div>
      </div>
    </a>
  )
}
