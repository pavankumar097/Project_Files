"use client"

import { useEffect, useState } from "react"
import { Users, BoltIcon as Bat, IceCreamBowlIcon as Bowling, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { teams as localTeamsData, Team, Player } from "@/lib/data"

const teamColors: { [key: string]: string } = {
  csk: "#FFD700", // Chennai Super Kings - Gold
  dc: "#1E90FF", // Delhi Capitals - Dodger Blue
  gt: "#4682B4", // Gujarat Titans - Steel Blue
  kkr: "#800080", // Kolkata Knight Riders - Purple
  lsg: "#00CED1", // Lucknow Super Giants - Dark Turquoise
  mi: "#0000FF", // Mumbai Indians - Blue
  pbks: "#FF4500", // Punjab Kings - Orange Red
  rcb: "#FF0000", // Royal Challengers Bangalore - Red
  rr: "#FF69B4", // Rajasthan Royals - Hot Pink
  srh: "#FF8C00", // Sunrisers Hyderabad - Dark Orange
}

export default function IPLSquadsSection() {
  const [teams, setTeams] = useState<Team[]>(localTeamsData)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  // 2. Handlers
  const handleTeamClick = (teamId: string) => {
    const newSelected = teamId === selectedTeamId ? null : teamId;
    console.log("Selected team id:", newSelected); // Debug log here
    setSelectedTeamId(newSelected);
  }

  // 3. Helper: get the currently selected team
  const getSelectedTeam = () => {
    return teams.find((team) => team.id === selectedTeamId)
  }

  // 4. Helper: icon for role
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

  // 5. Render
  return (
    <section id="ipl-squads" className="section-container">
      <h2 className="section-title">IPL Squads</h2>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-center text-muted-foreground mb-6">
            Click on a team to view their complete squad
          </p>

          {/* Show team buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {teams.map((team) => (
              <Button
                key={team.id}
                variant={selectedTeamId === team.id ? "default" : "outline"}
                className="h-auto py-3 px-4 font-bold"
                onClick={() => handleTeamClick(team.id)}
                style={{ backgroundColor: teamColors[team.id], color: "#fff" }}
              >
                {team.name}
              </Button>
            ))}
          </div>
        </div>

        {/* If a team is selected, show its squad */}
        {selectedTeamId && (
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{getSelectedTeam()?.name} Squad</h3>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Form</TableHead>
                      <TableHead className="hidden md:table-cell">Consistency</TableHead>
                      <TableHead className="hidden md:table-cell">Bowler Type</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSelectedTeam()?.players.map((player, index) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{player.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(player.role)}
                            <span className="hidden sm:inline">{player.role}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{player.form}</TableCell>
                        <TableCell className="hidden md:table-cell">{player.consistency}</TableCell>
                        <TableCell className="hidden md:table-cell">{player.bowlerType}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {player.arType && (
                              <Badge variant="outline" className="text-xs">
                                {player.arType}
                              </Badge>
                            )}
                            {player.isOverseasPlayer && (
                              <Badge className="bg-blue-500 text-xs">OS</Badge>
                            )}
                            {player.isCaptain && (
                              <Badge className="bg-green-500 text-xs">Captain</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* If no team selected */}
        {!selectedTeamId && (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Team Selected</h3>
              <p className="text-muted-foreground max-w-md">
                Click on a team button above to view their complete squad
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
