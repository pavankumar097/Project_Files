import { Suspense } from "react"
import { SearchPlayerStats } from "@/components/search-player-stats"

export default function PlayersPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Player Statistics</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchPlayerStats />
      </Suspense>
    </div>
  )
} 