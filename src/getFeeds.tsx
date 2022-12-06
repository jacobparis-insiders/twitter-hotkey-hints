import { Feed } from "./root"

export type Feed = {
  id: number
  title: string
  queries: string[]
  filters: string[]
}

export function getFeeds() {
  const serverFeeds: Feed[] = [
    {
      id: 1,
      title: "Popular",
      queries: [
        "filter:follows min_faves:10",
        "filter:verified -filter:verified_blue min_faves:1000",
      ],
      filters: [`"bitcoin" OR "crypto" OR "🧵"`],
    },
    {
      id: 2,
      title: "Greatest Hits",
      queries: ["from:jacobmparis min_faves:100"],
      filters: [],
    },
    {
      id: 3,
      title: "Mrs. Thankful",
      queries: ["from:mrs_carm to:jacobmparis thank"],
      filters: [],
    },
  ]

  return serverFeeds
}
