"use client"

import { useState, useEffect, useContext } from "react"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield, Star, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getAllTeams } from "@/lib/data"
import { SquadContext } from "@/context/squad-context"

export default function SquadFormationSummary() {
  const [teams] = useState(getAllTeams())
  const [keyPlayers, setKeyPlayers] = useState<any[]>([])
  
  const {
    selectedTeam,
    selectedTeamId,
    setSelectedTeamId,
    finalSquad,
    consistency,
    form,
    loading,
    error,
    regenerateSquad,
    setError
  } = useContext(SquadContext)

  const handleRegenerateSquad = () => {
    regenerateSquad()
  }

  useEffect(() => {
    if (finalSquad.length > 0) {
      // Identify key players (top 5 by score)
      const playersWithScores = finalSquad.map((player: any) => ({
        ...player,
        score: calculatePlayerScore(player),
      }))

      const sortedPlayers = [...playersWithScores].sort((a, b) => b.score - a.score)
      setKeyPlayers(sortedPlayers.slice(0, 5))
    }
  }, [finalSquad])

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    // Clear any existing error when changing teams
    if (error) {
      setError("")
    }
  }

  const calculatePlayerScore = (player: any) => {
    if (!player || typeof player.consistency !== 'number' || typeof player.form !== 'number') {
      return 0
    }

    // Simple scoring algorithm for demonstration
    let score = 0

    if (player.role === "Batsman") {
      score = player.consistency * 0.6 + player.form * 0.4
    } else if (player.role === "Bowler") {
      // For bowlers, we want lower consistency and form values
      const invertedConsistency = 100 - player.consistency
      const invertedForm = 100 - player.form
      score = invertedConsistency * 0.6 + invertedForm * 0.4
    } else if (player.role === "Allrounder") {
      // For allrounders, we balance both aspects
      const battingScore = player.consistency * 0.6 + player.form * 0.4
      const invertedConsistency = 100 - player.consistency
      const invertedForm = 100 - player.form
      const bowlingScore = invertedConsistency * 0.6 + invertedForm * 0.4
      score = battingScore * 0.5 + bowlingScore * 0.5
    } else if (player.role === "Wicketkeeper") {
      score = player.consistency * 0.7 + player.form * 0.3
    }

    // Add bonus for experience (matches)
    if (typeof player.mat === 'number') {
      score += player.mat / 10
    }

    return Math.round(score)
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

  const isKeyPlayer = (playerId: string) => {
    return keyPlayers.some((player) => player.id === playerId)
  }

  const getTeamComposition = () => {
    if (!finalSquad.length) return null

    const batsmen = finalSquad.filter((p: any) => p.role === "Batsman").length
    const bowlers = finalSquad.filter((p: any) => p.role === "Bowler").length
    const allrounders = finalSquad.filter((p: any) => p.role === "Allrounder").length
    const wicketkeepers = finalSquad.filter((p: any) => p.role === "Wicketkeeper").length
    const overseas = finalSquad.filter((p: any) => p.isOverseasPlayer).length

    return {
      batsmen,
      bowlers,
      allrounders,
      wicketkeepers,
      overseas,
    }
  }

  const composition = getTeamComposition()

  return (
    <section id="squad-formation" className="section-container">
      <h2 className="section-title">Squad Formation Summary</h2>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Select Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select onValueChange={handleTeamChange} value={selectedTeamId || undefined}>
                  <SelectTrigger className="w-full md:w-[300px]">
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

                {selectedTeam && (
                  <Button 
                    onClick={handleRegenerateSquad}
                    className="flex-1 md:w-auto"
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
                        Generate Squad
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading squad data...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-red-50">
            <div className="text-center">
              <p className="text-red-500 font-medium mb-2">Error</p>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && selectedTeam && finalSquad.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="section-subtitle">Final Squad Composition</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {finalSquad.map((player) => (
                      <div
                        key={player.id}
                        className={`p-4 border rounded-md ${
                          isKeyPlayer(player.id) ? "border-primary/50 bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-full ${isKeyPlayer(player.id) ? "bg-primary/20" : "bg-muted"}`}
                            >
                              {getRoleIcon(player.role)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center">
                                {player.name}
                                {isKeyPlayer(player.id) && (
                                  <Star className="h-4 w-4 text-yellow-500 ml-1 fill-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                {player.role}
                                {player.isOverseasPlayer && <Badge className="bg-blue-500 text-xs">OS</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>C: {player.consistency}</div>
                            <div>F: {player.form}</div>
                            <div>Score: {calculatePlayerScore(player)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="section-subtitle">Team Insights</h3>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Composition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {composition && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Bat className="h-4 w-4 mr-2" />
                            <span>Batsmen</span>
                          </div>
                          <Badge variant="outline">{composition.batsmen}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Bowling className="h-4 w-4 mr-2" />
                            <span>Bowlers</span>
                          </div>
                          <Badge variant="outline">{composition.bowlers}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Allrounders</span>
                          </div>
                          <Badge variant="outline">{composition.allrounders}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            <span>Wicketkeepers</span>
                          </div>
                          <Badge variant="outline">{composition.wicketkeepers}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Overseas Players</span>
                          <Badge variant="outline">{composition.overseas}/4</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {keyPlayers.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground">{player.role}</div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <Badge>Score: {player.score}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {composition && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Batting Strength</span>
                            <span>
                              {Math.round(
                                ((composition.batsmen + composition.wicketkeepers + composition.allrounders * 0.5) /
                                  finalSquad.length) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.round(((composition.batsmen + composition.wicketkeepers + composition.allrounders * 0.5) / finalSquad.length) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Bowling Strength</span>
                            <span>
                              {Math.round(
                                ((composition.bowlers + composition.allrounders * 0.5) / finalSquad.length) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.round(((composition.bowlers + composition.allrounders * 0.5) / finalSquad.length) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Experience</span>
                            <span>
                              {Math.round(
                                finalSquad.reduce((sum, player) => sum + player.mat, 0) / finalSquad.length / 2,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.round(finalSquad.reduce((sum, player) => sum + player.mat, 0) / finalSquad.length / 2)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {!selectedTeam && (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Team Selected</h3>
              <p className="text-muted-foreground max-w-md">
                Select an IPL team from the dropdown above to view your squad formation summary
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

