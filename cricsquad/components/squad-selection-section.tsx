"use client"

import { useState, useEffect } from "react"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllTeams, getTeamById } from "@/lib/data"
import { calculatePlayerScore } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

// Create a context to share the selected squad with other components
import { createContext } from "react"
export const SquadContext = createContext<any>({
  selectedTeam: null,
  finalSquad: [],
  setFinalSquad: () => {},
})

export default function SquadSelectionSection() {
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [consistency, setConsistency] = useState(30)
  const [form, setForm] = useState(70)
  const [recommendedSquad, setRecommendedSquad] = useState<any[]>([])
  const [teams] = useState(getAllTeams())
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [finalSquad, setFinalSquad] = useState<any[]>([])
  const [playersByPosition, setPlayersByPosition] = useState<{ [key: string]: any[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Update selectedTeam when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      const team = getTeamById(selectedTeamId)
      setSelectedTeam(team)
    }
  }, [selectedTeamId])

  // Fetch squad data when selectedTeam, consistency, or form changes
  useEffect(() => {
    if (selectedTeam) {
      handleRegenerateSquad()
    }
  }, [selectedTeam, consistency, form])

  // Update the final squad whenever the recommended squad changes
  useEffect(() => {
    setFinalSquad(recommendedSquad)
    
    // Group players by role for position-based view
    if (recommendedSquad.length > 0) {
      const positionGroups: { [key: string]: any[] } = {
        Batsman: [],
        Bowler: [],
        Allrounder: [],
        Wicketkeeper: [],
      }
      
      recommendedSquad.forEach((player) => {
        if (player.role && positionGroups[player.role]) {
          positionGroups[player.role].push(player)
        }
      })
      
      setPlayersByPosition(positionGroups)
    }
  }, [recommendedSquad])

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
  }

  const handleConsistencyChange = (value: number[]) => {
    setConsistency(value[0])
  }

  const handleFormChange = (value: number[]) => {
    setForm(value[0])
  }

  const handleRegenerateSquad = async () => {
    setLoading(true);
    setError("");
    try {
      const formDecimal = form / 100;
      const consistencyDecimal = consistency / 100;
      
      const response = await fetch("http://localhost:8000/api/generate-squad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_weight: formDecimal,
          consistency_weight: consistencyDecimal,
          team_name: selectedTeam.shortName,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to fetch squad data");
      
      const data = await response.json();
      const squadPlayers = data.squads[0].players;
      
      // Map API player IDs to match your static data format
      const squadPlayersWithFixedIds = squadPlayers.map((player: any) => ({
        ...player,
        id: `${selectedTeam.shortName.toLowerCase()}-${player.id}`
      }));
      
      setRecommendedSquad(squadPlayersWithFixedIds);
    } catch (err) {
      setError((err as Error).message);
      setRecommendedSquad([]);
    } finally {
      setLoading(false);
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Batsman":
        return <Bat className="h-4 w-4" />
      case "Bowler":
        return <Bowling className="h-4 w-4" />
      case "Wicketkeeper":
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getSquadStats = () => {
    if (!recommendedSquad.length) return null

    const roles = {
      Batsman: recommendedSquad.filter((p) => p.role === "Batsman").length,
      Bowler: recommendedSquad.filter((p) => p.role === "Bowler").length,
      Allrounder: recommendedSquad.filter((p) => p.role === "Allrounder").length,
      Wicketkeeper: recommendedSquad.filter((p) => p.role === "Wicketkeeper").length,
    }

    const overseas = recommendedSquad.filter((p) => p.isOverseasPlayer).length

    return {
      roles,
      overseas,
    }
  }

  const stats = getSquadStats()

  return (
    <SquadContext.Provider value={{ selectedTeam, finalSquad, setFinalSquad }}>
      <section id="squad-selection" className="section-container">
        <h2 className="section-title">Squad Selection</h2>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Select Team</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleTeamChange} value={selectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an IPL team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consistency Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button onClick={() => {
                      setConsistency((prev) => Math.max(prev - 5, 0));
                      setForm((prev) => Math.min(prev + 5, 100));
                    }}>-</Button>
                    <span className="font-medium">{consistency}%</span>
                    <Button onClick={() => {
                      setConsistency((prev) => Math.min(prev + 5, 100));
                      setForm((prev) => Math.max(prev - 5, 0));
                    }}>+</Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Low</span>
                    <span className="text-sm text-muted-foreground">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button onClick={() => {
                      setForm((prev) => Math.max(prev - 5, 0));
                      setConsistency((prev) => Math.min(prev + 5, 100));
                    }}>-</Button>
                    <span className="font-medium">{form}%</span>
                    <Button onClick={() => {
                      setForm((prev) => Math.min(prev + 5, 100));
                      setConsistency((prev) => Math.max(prev - 5, 0));
                    }}>+</Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Low</span>
                    <span className="text-sm text-muted-foreground">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight Balance Visualization */}
            <Card className="col-span-1 md:col-span-3">
              <CardHeader>
                <CardTitle>Weight Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Consistency</span>
                        <span>{consistency}%</span>
                      </div>
                      <Progress value={consistency} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Form</span>
                        <span>{form}%</span>
                      </div>
                      <Progress value={form} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedTeam && (
            <div className="mb-8">
              <Button 
                onClick={() => {
                  handleRegenerateSquad();
                }} 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Recommended Squad
                  </>
                )}
              </Button>
            </div>
          )}

          {selectedTeam && (
            <>
              {stats && (
                <div className="mb-8">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-2 p-2">
                          <Bat className="h-5 w-5 text-primary" />
                          <span>Batsmen: {stats.roles.Batsman}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <Bowling className="h-5 w-5 text-primary" />
                          <span>Bowlers: {stats.roles.Bowler}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span>Allrounders: {stats.roles.Allrounder}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span>Wicketkeepers: {stats.roles.Wicketkeeper}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <Badge className="bg-blue-500">OS: {stats.overseas}/4</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <h3 className="section-subtitle">Recommended Squad ({recommendedSquad.length})</h3>
                <Card className="h-[600px] overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                    {recommendedSquad.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No players selected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recommendedSquad.map((player) => (
                          <div
                            key={player.id}
                            className="bg-card border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                  {getRoleIcon(player.role)}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {player.name}
                                    {player.isCaptain && (
                                      <Badge variant="outline" className="text-xs">
                                        Captain
                                      </Badge>
                                    )}
                                    {player.role === "Wicketkeeper" && (
                                      <Badge variant="outline" className="text-xs">
                                        Keeper
                                      </Badge>
                                    )}
                                    {player.isOverseasPlayer && (
                                      <Badge className="bg-blue-500 text-xs">Overseas</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{player.role}</div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-sm">
                                  <span className="font-medium">C: {player.consistency}</span>
                                  <span className="mx-1">|</span>
                                  <span className="font-medium">F: {player.form}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Score: {calculatePlayerScore(player, consistency, form)}
                                </div>
                                {player.bowlerType && (
                                  <div className="text-xs text-muted-foreground">
                                    {player.bowlerType} Bowler
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {!selectedTeam && (
            <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Team Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select an IPL team from the dropdown above to view and customize your squad
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </SquadContext.Provider>
  )
}