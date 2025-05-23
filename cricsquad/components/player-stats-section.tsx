"use client"

import { useState, useEffect } from "react"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

interface PlayerData {
  Player: string;
  [key: string]: any;
}

export default function PlayerStatsSection() {
  const [selectedTab, setSelectedTab] = useState("overall")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedType) {
      loadPlayerData(selectedType, selectedTab);
    }
  }, [selectedType, selectedTab]);

  const loadPlayerData = async (playerType: string, season: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/player-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_type: playerType,
          season: season
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlayerData(data.stats);
    } catch (error) {
      console.error("Failed to load player data:", error);
      setPlayerData(generatePlaceholderData(playerType));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="player-stats" className="section-container bg-muted/30">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="section-title mb-4">Player Statistics</h2>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Explore comprehensive statistics for batsmen, bowlers, and all-rounders. Get detailed insights into player performances, match statistics, and career highlights.
        </p>
        <Link href="/players" className="w-full max-w-md">
          <Button variant="outline" className="w-full h-14 text-lg flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-colors">
            <Users className="w-5 h-5" />
            View Detailed Statistics
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Bat className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="font-semibold">Batsmen</h3>
                  <p className="text-sm text-muted-foreground">View batting averages, strike rates, and centuries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Bowling className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Bowlers</h3>
                  <p className="text-sm text-muted-foreground">Check economy rates, wickets taken, and bowling averages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">All-rounders</h3>
                  <p className="text-sm text-muted-foreground">Analyze both batting and bowling performances</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* <Tabs defaultValue="overall" className="w-full" onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overall">Overall Stats</TabsTrigger>
            <TabsTrigger value="recent">Recent Form</TabsTrigger>
            <TabsTrigger value="career">Career Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Runs/Wickets</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Strike Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading player statistics...
                      </TableCell>
                    </TableRow>
                  ) : playerData.length > 0 ? (
                    playerData.map((player, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{player.Player}</TableCell>
                        <TableCell>{player.Matches || '-'}</TableCell>
                        <TableCell>{player.Runs || player.Wickets || '-'}</TableCell>
                        <TableCell>{player.Average || '-'}</TableCell>
                        <TableCell>{player.StrikeRate || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Select a player type to view statistics
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              Recent form statistics will be displayed here
            </div>
          </TabsContent>

          <TabsContent value="career" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              Career statistics will be displayed here
            </div>
          </TabsContent>
        </Tabs> */}
      </div>
    </section>
  )
}

const generatePlaceholderData = (playerType: string): PlayerData[] => {
  return [
    {
      Player: "Sample Player 1",
      Matches: 10,
      Runs: 250,
      Average: 25.00,
      StrikeRate: 120.50
    },
    {
      Player: "Sample Player 2",
      Matches: 8,
      Runs: 180,
      Average: 22.50,
      StrikeRate: 115.75
    }
  ];
}; 