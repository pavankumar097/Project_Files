"use client"

import { useState, useEffect } from "react"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

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
      // For demo, show some placeholder data
      setPlayerData(generatePlaceholderData(playerType));
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlaceholderData = (playerType: string): PlayerData[] => {
    // Generate placeholder data based on player type
    const baseData = { Player: "", Consistency: 0, Form: 0 };
    
    if (playerType === "Batsman") {
      return Array(10).fill(0).map((_, i) => ({
        ...baseData,
        Player: `Batsman ${i+1}`,
        Runs: Math.floor(Math.random() * 500),
        Average: (Math.random() * 50).toFixed(2),
        StrikeRate: (Math.random() * 150).toFixed(2),
      }));
    } else if (playerType === "Bowler") {
      return Array(10).fill(0).map((_, i) => ({
        ...baseData,
        Player: `Bowler ${i+1}`,
        Wickets: Math.floor(Math.random() * 30),
        Economy: (Math.random() * 10).toFixed(2),
        BowlingAverage: (Math.random() * 30).toFixed(2),
      }));
    } else if (playerType === "Wicketkeeper") {
      return Array(10).fill(0).map((_, i) => ({
        ...baseData,
        Player: `Wicketkeeper ${i+1}`,
        Dismissals: Math.floor(Math.random() * 20),
        Catches: Math.floor(Math.random() * 15),
        Stumpings: Math.floor(Math.random() * 5),
      }));
    } else {
      return Array(10).fill(0).map((_, i) => ({
        ...baseData,
        Player: `Allrounder ${i+1}`,
        Runs: Math.floor(Math.random() * 300),
        Wickets: Math.floor(Math.random() * 15),
        BattingAverage: (Math.random() * 30).toFixed(2),
        BowlingAverage: (Math.random() * 30).toFixed(2),
      }));
    }
  };

  const renderTableHeaders = () => {
    if (!playerData.length) return null;
    
    // Get all keys from the first data item
    const headers = Object.keys(playerData[0]);
    
    return (
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
    );
  };

  const renderTableRows = () => {
    if (!playerData.length) return null;
    
    return (
      <TableBody>
        {playerData.map((player, index) => (
          <TableRow key={index}>
            {Object.values(player).map((value, i) => (
              <TableCell key={i}>{value}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <section id="player-stats" className="section-container bg-muted/30">
      <h2 className="section-title">Player Statistics</h2>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="overall" className="w-full" onValueChange={(value) => {
          setSelectedTab(value);
          setSelectedType(null); // Reset selected type when changing tabs
        }}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overall">Overall Stats</TabsTrigger>
            <TabsTrigger value="lastseason">Last Season Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <p className="text-center text-muted-foreground mb-8">
              View comprehensive statistics for all IPL players across all seasons
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="h-8 w-8" />}
                title="Allrounder Stats"
                onClick={() => setSelectedType("Allrounder")}
                isSelected={selectedType === "Allrounder"}
              />
              <StatCard
                icon={<Bat className="h-8 w-8" />}
                title="Batsman Stats"
                onClick={() => setSelectedType("Batsman")}
                isSelected={selectedType === "Batsman"}
              />
              <StatCard
                icon={<Bowling className="h-8 w-8" />}
                title="Bowler Stats"
                onClick={() => setSelectedType("Bowler")}
                isSelected={selectedType === "Bowler"}
              />
              <StatCard
                icon={<Shield className="h-8 w-8" />}
                title="Wicketkeeper Stats"
                onClick={() => setSelectedType("Wicketkeeper")}
                isSelected={selectedType === "Wicketkeeper"}
              />
            </div>
          </TabsContent>

          <TabsContent value="lastseason" className="space-y-4">
            <p className="text-center text-muted-foreground mb-8">
              View statistics for all IPL players from the most recent season
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="h-8 w-8" />}
                title="Allrounder Stats"
                onClick={() => setSelectedType("Allrounder")}
                isSelected={selectedType === "Allrounder"}
              />
              <StatCard
                icon={<Bat className="h-8 w-8" />}
                title="Batsman Stats"
                onClick={() => setSelectedType("Batsman")}
                isSelected={selectedType === "Batsman"}
              />
              <StatCard
                icon={<Bowling className="h-8 w-8" />}
                title="Bowler Stats"
                onClick={() => setSelectedType("Bowler")}
                isSelected={selectedType === "Bowler"}
              />
              <StatCard
                icon={<Shield className="h-8 w-8" />}
                title="Wicketkeeper Stats"
                onClick={() => setSelectedType("Wicketkeeper")}
                isSelected={selectedType === "Wicketkeeper"}
              />
            </div>
          </TabsContent>
        </Tabs>

        {selectedType && (
          <div className="mt-8 border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted/50 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedType} Statistics</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                Close
              </Button>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">Loading statistics...</div>
            ) : (
              <div className="overflow-x-auto max-h-[400px]">

                  <Table >
                    {renderTableHeaders()}
                    {renderTableRows()}
                  </Table>

              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
  isSelected?: boolean
}

function StatCard({ icon, title, onClick, isSelected }: StatCardProps) {
  return (
    <Card className={`overflow-hidden card-hover ${isSelected ? 'border-primary' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
          <h3 className="font-medium">{title}</h3>
          <Button 
            onClick={onClick} 
            className="w-full" 
            variant={isSelected ? "default" : "outline"}
          >
            View Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

