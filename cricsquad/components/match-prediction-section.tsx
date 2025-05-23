"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

const venues = [
  "Eden Gardens, Kolkata",
  "Wankhede Stadium, Mumbai",
  "Arun Jaitley Stadium",
  "Narendra Modi Stadium, Ahmedabad",
  "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
  "Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium",
  "Punjab Cricket Association IS Bindra Stadium, Mohali, Chandigarh",
  "Sawai Mansingh Stadium, Jaipur",
  "Holkar Cricket Stadium",
  "JSCA International Stadium Complex",
  "Saurashtra Cricket Association Stadium",
  "M Chinnaswamy Stadium, Bengaluru",
  "MA Chidambaram Stadium, Chepauk, Chennai",
  "Rajiv Gandhi International Stadium, Uppal",
  "Dr DY Patil Sports Academy, Mumbai",
  "Brabourne Stadium, Mumbai",
  "Maharashtra Cricket Association Stadium, Pune",
  "Himachal Pradesh Cricket Association Stadium"
]

interface PlayerData {
  Player: string
  Team: string
  Position: string
  Type: string
  Nationality: string
  Consistency_AHP?: number
  Consistency_PCA?: number
  Consistency?: number
  Form_AHP?: number
  Form_PCA?: number
  Form?: number
  Bowler_Type?: string
  'AR Type'?: string
}

interface OppositionPlayerData {
  Player: string
  Span?: string
  Position: string
  Type: string
  Consistency?: number
  Form?: number
  Team: string
  Nationality: string
}

interface PredictionResult {
  predicted_score: number;
  batting_team: string;
  bowling_team: string;
  venue: string;
  innings: number;
  current_score?: number;
  balls_left?: number;
  wickets_left?: number;
  current_run_rate?: number;
  last_five?: number;
}

export default function MatchPredictionForm() {
  const [selectedTeam, setSelectedTeam] = useState("")
  const [oppositionTeam, setOppositionTeam] = useState("")
  const [venue, setVenue] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerData[]>([])
  const [oppositionPlayers, setOppositionPlayers] = useState<OppositionPlayerData[]>([])
  const [teamOptions, setTeamOptions] = useState<string[]>([])
  const [teamPlayersData, setTeamPlayersData] = useState<Record<string, PlayerData[]>>({})
  const [oppositionTeamData, setOppositionTeamData] = useState<Record<string, OppositionPlayerData[]>>({})
  const [loading, setLoading] = useState(false)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [selectedInnings, setSelectedInnings] = useState<number>(1)

  const foreignPlayerCount = selectedPlayers.filter(
    player => player.Nationality !== "Indian"
  ).length

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true)
      try {
        const teamResponse = await fetch("/Ipl_teams.xlsx")
        if (!teamResponse.ok) throw new Error(`Failed to fetch team Excel file: ${teamResponse.status}`)
        
        const teamBlob = await teamResponse.arrayBuffer()
        const teamWorkbook = XLSX.read(teamBlob)
        const sheetNames = teamWorkbook.SheetNames
        setTeamOptions(sheetNames)

        const playersData: Record<string, PlayerData[]> = {}
        
        sheetNames.forEach(sheetName => {
          const worksheet = teamWorkbook.Sheets[sheetName]
          const rawData = XLSX.utils.sheet_to_json<PlayerData>(worksheet)
          playersData[sheetName] = rawData.map(player => ({
            ...player,
            Team: sheetName
          }))
        })

        setTeamPlayersData(playersData)

        const oppositionResponse = await fetch("/Opposition_teams.xlsx")
        if (!oppositionResponse.ok) throw new Error(`Failed to fetch opposition Excel file: ${oppositionResponse.status}`)
        
        const oppositionBlob = await oppositionResponse.arrayBuffer()
        const oppositionWorkbook = XLSX.read(oppositionBlob)
        const oppositionSheetNames = oppositionWorkbook.SheetNames

        const oppositionData: Record<string, OppositionPlayerData[]> = {}
        
        oppositionSheetNames.forEach(sheetName => {
          const worksheet = oppositionWorkbook.Sheets[sheetName]
          const rawData = XLSX.utils.sheet_to_json<OppositionPlayerData>(worksheet)
          oppositionData[sheetName] = rawData.map(player => ({
            ...player,
            Team: sheetName,
            Nationality: player.Nationality || "Indian" // Default to Indian if not specified
          }))
        })

        setOppositionTeamData(oppositionData)
      } catch (error) {
        console.error("Error loading team data:", error)
        setTeamOptions([])
        setTeamPlayersData({})
        setOppositionTeamData({})
      } finally {
        setLoading(false)
      }
    }

    loadTeamData()
  }, [])

  useEffect(() => {
    if (oppositionTeam && oppositionTeamData[oppositionTeam]) {
      setOppositionPlayers(oppositionTeamData[oppositionTeam].slice(0, 11))
    } else {
      setOppositionPlayers([])
    }
  }, [oppositionTeam, oppositionTeamData])

  const handleTeamChange = (team: string) => {
    setSelectedTeam(team)
    setSelectedPlayers([])
  }

  const handlePlayerSelection = (player: PlayerData) => {
    if (selectedPlayers.some(p => p.Player === player.Player)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.Player !== player.Player))
    } else {
      if (player.Nationality !== "Indian" && foreignPlayerCount >= 4) {
        alert("You can only select a maximum of 4 foreign players")
        return
      }
      
      if (selectedPlayers.length < 11) {
        setSelectedPlayers([...selectedPlayers, player])
      }
    }
  }

  const handlePrediction = async () => {
    if (selectedPlayers.length !== 11) {
      alert("Please select exactly 11 players");
      return;
    }

    if (!venue) {
      alert("Please select a venue");
      return;
    }

    if (!oppositionTeam) {
      alert("Please select an opposition team");
      return;
    }

    setPredictionLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/predict-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          players: selectedPlayers.map(p => p.Player),
          venue: venue,
          batting_team: selectedTeam,
          bowling_team: oppositionTeam,
          innings: selectedInnings,
          current_score: 0,
          balls_left: 120,
          wickets_left: 10,
          current_run_rate: 0,
          last_five: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get prediction: ${response.statusText}`);
      }

      const result = await response.json();
      setPredictionResult(result);
    } catch (error) {
      console.error("Failed to get prediction:", error);
      alert("Failed to get prediction. Please try again.");
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 dark:text-gray-300">Loading team data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Team Selection */}
              <div className="space-y-2 border border-blue-300 dark:border-blue-700 p-3 rounded-md bg-blue-50 dark:bg-blue-900/30">
                <Label htmlFor="select-team" className="font-bold text-blue-800 dark:text-blue-200">
                  Select Batting Team
                </Label>
                <Select value={selectedTeam} onValueChange={handleTeamChange}>
                  <SelectTrigger 
                    id="select-team" 
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {teamOptions.map((team) => (
                      <SelectItem 
                        key={team} 
                        value={team}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue Selection */}
              <div className="space-y-2 border border-purple-300 dark:border-purple-700 p-3 rounded-md bg-purple-50 dark:bg-purple-900/30">
                <Label htmlFor="venue" className="font-bold text-purple-800 dark:text-purple-200">
                  Venue
                </Label>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger 
                    id="venue" 
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {venues.map((venue) => (
                      <SelectItem 
                        key={venue} 
                        value={venue}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opposition Team Selection */}
              <div className="space-y-2 border border-red-300 dark:border-red-700 p-3 rounded-md bg-red-50 dark:bg-red-900/30">
                <Label htmlFor="opposition-team" className="font-bold text-red-800 dark:text-red-200">
                  Opposition/Bowling Team
                </Label>
                <Select value={oppositionTeam} onValueChange={setOppositionTeam}>
                  <SelectTrigger 
                    id="opposition-team" 
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <SelectValue placeholder="Select opposition" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {teamOptions
                      .filter((team) => team !== selectedTeam)
                      .map((team) => (
                        <SelectItem 
                          key={team} 
                          value={team}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {team}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Innings Selection */}
              <div className="space-y-2 border border-green-300 dark:border-green-700 p-3 rounded-md bg-green-50 dark:bg-green-900/30">
                <Label htmlFor="innings" className="font-bold text-green-800 dark:text-green-200">
                  Innings
                </Label>
                <Select value={selectedInnings.toString()} onValueChange={(value) => setSelectedInnings(parseInt(value))}>
                  <SelectTrigger 
                    id="innings" 
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <SelectValue placeholder="Select innings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Innings</SelectItem>
                    <SelectItem value="2">Second Innings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Player Selection Grid */}
            {selectedTeam && teamPlayersData[selectedTeam] && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 text-white p-3 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Select Your 11 Players ({selectedTeam})</h3>
                    <div className="flex gap-2">
                      <span className="text-sm bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {selectedPlayers.length}/11 players
                      </span>
                      <span className="text-sm bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                        {foreignPlayerCount}/4 foreign
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamPlayersData[selectedTeam].map((player) => {
                    const isSelected = selectedPlayers.some(p => p.Player === player.Player)
                    const isDisabled = 
                      (selectedPlayers.length >= 11 && !isSelected) ||
                      (player.Nationality !== "Indian" && foreignPlayerCount >= 4 && !isSelected)
                    
                    return (
                      <div 
                        key={player.Player} 
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${
                          isDisabled 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                        onClick={() => !isDisabled && handlePlayerSelection(player)}
                      >
                        <div className="flex items-start">
                          <div className={`mt-1 mr-3 h-4 w-4 rounded border flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600' 
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                          }`}>
                            {isSelected && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className={`${
                                isSelected 
                                  ? 'font-semibold text-blue-800 dark:text-blue-200' 
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}>
                                {player.Player}
                              </span>
                              {player.Nationality !== "Indian" && (
                                <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full ml-2">
                                  Foreign
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded">
                                {player.Position}
                              </span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                {player.Type}
                              </span>
                              {player.Bowler_Type && (
                                <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                                  {player.Bowler_Type}
                                </span>
                              )}
                              {player['AR Type'] && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                                  {player['AR Type']}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              {player.Consistency && (
                                <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                                  Consistency: {player.Consistency.toFixed(1)}
                                </span>
                              )}
                              {player.Form && (
                                <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                                  Form: {player.Form.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected Teams Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Team */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">
                    Your Team: {selectedTeam || "Not selected"}
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-sm bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      {selectedPlayers.length}/11 players
                    </span>
                    <span className="text-sm bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                      {foreignPlayerCount}/4 foreign
                    </span>
                  </div>
                </div>
                
                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 min-h-[300px]">
                  {selectedTeam ? (
                    selectedPlayers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedPlayers.map((player, index) => (
                          <div 
                            key={player.Player} 
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {index + 1}. {player.Player}
                                </span>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                    {player.Type}
                                  </span>
                                  {player.Bowler_Type && (
                                    <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                                      {player.Bowler_Type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {player.Nationality !== "Indian" && (
                                <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                                  Foreign
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-blue-200 dark:border-blue-800">
                        <svg className="w-10 h-10 text-blue-300 dark:text-blue-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p>Select players from your team above</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-blue-200 dark:border-blue-800">
                      <svg className="w-10 h-10 text-blue-300 dark:text-blue-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p>Please select your team first</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Opposition Team */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                  <h3 className="font-bold text-lg text-red-800 dark:text-red-200">
                    Opposition Team: {oppositionTeam || "Not selected"}
                  </h3>
                  <span className="text-sm bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                    {oppositionPlayers.length}/11 players
                  </span>
                </div>
                
                <div className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 min-h-[300px]">
                  {oppositionTeam ? (
                    oppositionPlayers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {oppositionPlayers.map((player, index) => (
                          <div 
                            key={player.Player} 
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-red-500 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {index + 1}. {player.Player}
                                </span>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded">
                                    {player.Type}
                                  </span>
                                </div>
                              </div>
                              {player.Nationality !== "India" && (
                                <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                                  Foreign
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-red-200 dark:border-red-800">
                        <svg className="w-10 h-10 text-red-300 dark:text-red-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p>Opposition team will appear here</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-red-200 dark:border-red-800">
                      <svg className="w-10 h-10 text-red-300 dark:text-red-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p>Please select opposition team</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Prediction Button and Results */}
            <div className="mt-8">
              <Button
                onClick={handlePrediction}
                disabled={predictionLoading || selectedPlayers.length !== 11 || !venue || !oppositionTeam}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 transition-all"
              >
                {predictionLoading ? "Predicting..." : "Predict Match Score"}
              </Button>

              {predictionResult && (
                <div className="mt-6 p-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                    Match Prediction
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-gray-600 dark:text-gray-300">Predicted Score:</span>
                      <span className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {Math.round(predictionResult.predicted_score)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-gray-600 dark:text-gray-300">Batting Team:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {predictionResult.batting_team}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-gray-600 dark:text-gray-300">Bowling Team:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {predictionResult.bowling_team}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-gray-600 dark:text-gray-300">Venue:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {predictionResult.venue}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-300">Innings:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {predictionResult.innings === 1 ? "First" : "Second"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}