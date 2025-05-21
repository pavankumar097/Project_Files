import OverviewSection from "@/components/overview-section"
import PlayerStatsSection from "@/components/player-stats-section"
import IPLSquadsSection from "@/components/ipl-squads-section"
import SquadSelectionSection from "@/components/squad-selection-section"
import MatchPredictionSection from "@/components/match-prediction-section"
// import SquadFormationSummary from "@/components/squad-formation-summary"

export default function Home() {
  return (
    <div className="pb-20">
      <section id="hero" className="relative">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-[50vh] flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">CricSquad</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              Advanced cricket analytics for IPL teams, player stats, and match predictions
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      <OverviewSection />
      <PlayerStatsSection />
      <IPLSquadsSection />
      <SquadSelectionSection />
      <MatchPredictionSection />
      {/* <SquadFormationSummary /> */}
    </div>
  )
}

