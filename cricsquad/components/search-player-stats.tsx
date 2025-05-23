"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield } from "lucide-react"

interface PlayerData {
  Player: string;
  [key: string]: any;
}

export function SearchPlayerStats() {
  const [searchQuery, setSearchQuery] = useState("")
  const [playerType, setPlayerType] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<PlayerData[]>([])
  const [filteredData, setFilteredData] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (playerType) {
      loadPlayerData(playerType);
    }
  }, [playerType]);

  useEffect(() => {
    if (playerData.length > 0) {
      const filtered = playerData.filter(player =>
        player.Player.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, playerData]);

  const loadPlayerData = async (playerType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/player-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_type: playerType,
          season: 'overall'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlayerData(data.stats);
      setFilteredData(data.stats);
    } catch (error) {
      console.error("Failed to load player data:", error);
      setPlayerData(generatePlaceholderData(playerType));
      setFilteredData(generatePlaceholderData(playerType));
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlaceholderData = (playerType: string): PlayerData[] => {
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
    if (!filteredData.length) return null;
    const headers = Object.keys(filteredData[0]);
    
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
    if (!filteredData.length) return null;
    
    return (
      <TableBody>
        {filteredData.map((player, index) => (
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-8 w-8" />}
          title="Allrounder Stats"
          onClick={() => setPlayerType("Allrounder")}
          isSelected={playerType === "Allrounder"}
        />
        <StatCard
          icon={<Bat className="h-8 w-8" />}
          title="Batsman Stats"
          onClick={() => setPlayerType("Batsman")}
          isSelected={playerType === "Batsman"}
        />
        <StatCard
          icon={<Bowling className="h-8 w-8" />}
          title="Bowler Stats"
          onClick={() => setPlayerType("Bowler")}
          isSelected={playerType === "Bowler"}
        />
        <StatCard
          icon={<Shield className="h-8 w-8" />}
          title="Wicketkeeper Stats"
          onClick={() => setPlayerType("Wicketkeeper")}
          isSelected={playerType === "Wicketkeeper"}
        />
      </div>

      {playerType && (
        <div className="space-y-4">
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted/50 border-b">
              <h3 className="text-lg font-medium">{playerType} Statistics</h3>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">Loading statistics...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  {renderTableHeaders()}
                  {renderTableRows()}
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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