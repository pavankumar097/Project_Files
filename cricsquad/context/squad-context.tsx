"use client"

import { createContext, useState, ReactNode, useEffect } from "react"
import { getAllTeams } from "@/lib/data"

type SquadContextType = {
  selectedTeam: any | null
  setSelectedTeam: (team: any | null) => void
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
  finalSquad: any[]
  setFinalSquad: (squad: any[]) => void
  recommendedSquad: any[]
  setRecommendedSquad: (squad: any[]) => void
  remainingPlayers: any[]
  setRemainingPlayers: (players: any[]) => void
  consistency: number
  setConsistency: (value: number) => void
  form: number
  setForm: (value: number) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string
  setError: (error: string) => void
  regenerateSquad: () => Promise<void>
}

export const SquadContext = createContext<SquadContextType>({
  selectedTeam: null,
  setSelectedTeam: () => {},
  selectedTeamId: null,
  setSelectedTeamId: () => {},
  finalSquad: [],
  setFinalSquad: () => {},
  recommendedSquad: [],
  setRecommendedSquad: () => {},
  remainingPlayers: [],
  setRemainingPlayers: () => {},
  consistency: 30,
  setConsistency: () => {},
  form: 70,
  setForm: () => {},
  loading: false,
  setLoading: () => {},
  error: "",
  setError: () => {},
  regenerateSquad: async () => {},
})

export const SquadProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [finalSquad, setFinalSquad] = useState<any[]>([])
  const [recommendedSquad, setRecommendedSquad] = useState<any[]>([])
  const [remainingPlayers, setRemainingPlayers] = useState<any[]>([])
  const [consistency, setConsistency] = useState(30)
  const [form, setForm] = useState(70)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Function to get team by ID
  const getTeamById = (id: string) => {
    const teams = getAllTeams()
    return teams.find(team => team.id === id) || null
  }

  // Update selectedTeam when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      const team = getTeamById(selectedTeamId)
      setSelectedTeam(team)
    } else {
      setSelectedTeam(null)
    }
  }, [selectedTeamId])

  // Regenerate squad when parameters change
  useEffect(() => {
    if (selectedTeam) {
      regenerateSquad()
    }
  }, [selectedTeam, consistency, form])

  const regenerateSquad = async () => {
    if (!selectedTeam) return
    
    setLoading(true)
    setError("")
    
    try {
      const formDecimal = form / 100
      const consistencyDecimal = consistency / 100
      
      console.log("Sending request with:", {
        form_weight: formDecimal,
        consistency_weight: consistencyDecimal,
        team_name: selectedTeam.shortName,
      })
      
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
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`Failed to fetch squad data: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log("API Response:", data)
      
      if (!data.squads || !data.squads[0] || !data.squads[0].players) {
        throw new Error("Invalid response format from API")
      }
      
      const squadPlayers = data.squads[0].players
      
      // Map API player IDs to match your static data format
      const squadPlayersWithFixedIds = squadPlayers.map((player: any) => ({
        ...player,
        id: `${selectedTeam.shortName.toLowerCase()}-${player.id}`
      }))
      
      setRecommendedSquad(squadPlayersWithFixedIds)
      setFinalSquad(squadPlayersWithFixedIds)
      
      // Calculate remaining players
      const allPlayers = selectedTeam.players || []
      const recommendedIds = new Set(squadPlayersWithFixedIds.map((p: any) => p.id))
      const remainingPlayersList = allPlayers.filter((p: any) => !recommendedIds.has(p.id))
      setRemainingPlayers(remainingPlayersList)
      
    } catch (error: any) {
      console.error("Error generating squad:", error)
      setError(error.message || "Failed to generate squad")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SquadContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam,
        selectedTeamId,
        setSelectedTeamId,
        finalSquad,
        setFinalSquad,
        recommendedSquad,
        setRecommendedSquad,
        remainingPlayers,
        setRemainingPlayers,
        consistency,
        setConsistency,
        form,
        setForm,
        loading,
        setLoading,
        error,
        setError,
        regenerateSquad,
      }}
    >
      {children}
    </SquadContext.Provider>
  )
}
