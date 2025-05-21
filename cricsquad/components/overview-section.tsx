"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, BarChart3, Users, TrendingUp, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OverviewSection() {
  const [expandedGuide, setExpandedGuide] = useState(false)

  return (
    <section id="overview" className="section-container">
      <h2 className="section-title">Welcome to CricSquad</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Your Cricket Analytics Hub</h3>
          <p className="text-muted-foreground">
            CricSquad provides comprehensive cricket analytics for IPL teams and players. Our platform offers detailed
            player statistics, intelligent squad recommendations, and match outcome predictions based on advanced
            algorithms and historical data.
          </p>
          <p className="text-muted-foreground">
            Whether you're a cricket enthusiast, fantasy league player, or team analyst, CricSquad gives you the
            insights you need to make informed decisions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Player Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Comprehensive statistics for all IPL players</CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Squad Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Create optimal team compositions</CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Track player form and consistency</CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <Trophy className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Match outcome forecasting</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">How to Use CricSquad</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedGuide(!expandedGuide)}
            className="flex items-center gap-1"
          >
            {expandedGuide ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Expand</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {expandedGuide && (
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="flex justify-between mb-8">
              <TabsTrigger value="stats" className="flex-1 text-center">Player Stats</TabsTrigger>
              <TabsTrigger value="ipl-squads" className="flex-1 text-center">IPL Squads</TabsTrigger>
              <TabsTrigger value="squad" className="flex-1 text-center">Squad Selection</TabsTrigger>
              <TabsTrigger value="prediction" className="flex-1 text-center">Match Prediction</TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 text-center">Squad Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4">
              <h4 className="text-xl font-medium">Accessing Player Statistics</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Navigate to the Player Stats section</li>
                <li>Choose between Overall Stats or Last Season Stats</li>
                <li>Select the player type (Allrounder, Batsman, Bowler, or Wicketkeeper)</li>
                <li>Download the Excel file with comprehensive statistics</li>
              </ol>
            </TabsContent>

            <TabsContent value="ipl-squads" className="space-y-4">
              <h4 className="text-xl font-medium">Exploring IPL Squads</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click on the IPL Squads section</li>
                <li>Choose a team to view its complete squad</li>
                <li>Review player roles, positions, and performance metrics</li>
                <li>Use this information for team analysis and strategy development</li>
              </ol>
            </TabsContent>

            <TabsContent value="squad" className="space-y-4">
              <h4 className="text-xl font-medium">Building Your Squad</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to the Squad Selection section</li>
                <li>Select your IPL team from the 10 available options</li>
                <li>Adjust the Consistency and Form parameters as needed</li>
                <li>Click "Generate Recommended Squad" to see optimal player selection</li>
                <li>
                  Drag and drop players between the recommended squad and remaining players to customize your team
                </li>
              </ol>
            </TabsContent>

            <TabsContent value="prediction" className="space-y-4">
              <h4 className="text-xl font-medium">Predicting Match Outcomes</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Navigate to the Match Prediction section</li>
                <li>Select an opponent team from the dropdown menu</li>
                <li>View the detailed comparison between your team and the opponent</li>
                <li>Check the predicted match outcome, including projected scores and key player performances</li>
              </ol>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <h4 className="text-xl font-medium">Reviewing Squad Formation</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Scroll to the Squad Formation Summary section</li>
                <li>Review your finalized team composition</li>
                <li>Note the 5 key players highlighted for special attention</li>
                <li>Use this information for strategic planning and team management</li>
              </ol>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  )
}

