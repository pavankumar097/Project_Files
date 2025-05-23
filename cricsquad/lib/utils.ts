import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePlayerScore(player: any, consistencyWeight: number, formWeight: number) {
  // Normalize weights to sum to 100
  const totalWeight = consistencyWeight + formWeight
  const normalizedConsistencyWeight = (consistencyWeight / totalWeight) * 100
  const normalizedFormWeight = (formWeight / totalWeight) * 100

  // Calculate base score based on role
  let baseScore = 0

  // Check if required stats are available
  const hasBattingStats = typeof player.battingAvg === 'number' && typeof player.strikeRate === 'number';
  const hasBowlingStats = typeof player.bowlingAvg === 'number' && typeof player.economyRate === 'number';

  if (player.role === "Batsman" && hasBattingStats) {
    baseScore = player.battingAvg * 0.6 + player.strikeRate * 0.4
  } else if (player.role === "Bowler" && hasBowlingStats) {
    // Lower bowling average is better, so we invert it
    const invertedBowlingAvg = 50 - player.bowlingAvg
    // Lower economy is better, so we invert it
    const invertedEconomy = 12 - player.economyRate
    baseScore = invertedBowlingAvg * 0.6 + invertedEconomy * 0.4
  } else if (player.role === "Allrounder") {
    let battingScore = 0;
    let bowlingScore = 0;
    
    if (hasBattingStats) {
      battingScore = player.battingAvg * 0.6 + player.strikeRate * 0.4
    }
    
    if (hasBowlingStats) {
      const invertedBowlingAvg = 50 - player.bowlingAvg
      const invertedEconomy = 12 - player.economyRate
      bowlingScore = invertedBowlingAvg * 0.6 + invertedEconomy * 0.4
    }
    
    baseScore = battingScore * 0.5 + bowlingScore * 0.5
  } else if (player.role === "Wicketkeeper" && hasBattingStats) {
    baseScore = player.battingAvg * 0.7 + player.strikeRate * 0.3
  }

  // If we couldn't calculate a base score from stats, use form and consistency directly
  if (baseScore === 0) {
    // Apply consistency and form weights directly
    const consistencyScore = typeof player.consistency === 'number' ? player.consistency : 0
    const formScore = typeof player.form === 'number' ? player.form : 0
    
    return (consistencyScore * (normalizedConsistencyWeight / 100)) + 
           (formScore * (normalizedFormWeight / 100))
  }

  // Apply consistency and form weights
  const consistencyScore = typeof player.consistency === 'number' ? 
    player.consistency * (normalizedConsistencyWeight / 100) : 0
  const formScore = typeof player.form === 'number' ? 
    player.form * (normalizedFormWeight / 100) : 0

  // Calculate final score
  const finalScore = baseScore * 0.6 + consistencyScore + formScore

  // Always round to 2 decimal places
  return Number(finalScore.toFixed(2));
}

export function generateRecommendedSquad(players: any[], consistencyWeight: number, formWeight: number) {
  // Calculate scores for all players
  const playersWithScores = players.map((player) => ({
    ...player,
    score: calculatePlayerScore(player, consistencyWeight, formWeight),
  }))

  // Sort players by score in descending order
  const sortedPlayers = [...playersWithScores].sort((a, b) => b.score - a.score)

  // Initialize squad with empty arrays
  const squad: any = {
    batsmen: [],
    bowlers: [],
    allrounders: [],
    wicketkeeper: null,
    captain: null,
  }

  // First, find captain and wicketkeeper
  const captain = sortedPlayers.find((player) => player.isCaptain)
  if (captain) {
    squad.captain = captain
  }

  const wicketkeeper = sortedPlayers.find((player) => player.isKeeper)
  if (wicketkeeper) {
    squad.wicketkeeper = wicketkeeper
  }

  // Then, select the best players for each role
  // Ensure we don't exceed 4 overseas players
  let overseasCount = 0
  if (squad.captain?.isOverseasPlayer) overseasCount++
  if (squad.wicketkeeper?.isOverseasPlayer) overseasCount++

  // Add batsmen (aim for 3-4)
  const batsmen = sortedPlayers
    .filter(
      (player) => player.role === "Batsman" && player.id !== squad.captain?.id && player.id !== squad.wicketkeeper?.id,
    )
    .slice(0, 4)

  batsmen.forEach((player) => {
    if (player.isOverseasPlayer && overseasCount >= 4) return
    if (player.isOverseasPlayer) overseasCount++
    squad.batsmen.push(player)
  })

  // Add bowlers (aim for 3-4)
  const bowlers = sortedPlayers
    .filter((player) => player.role === "Bowler" && player.id !== squad.captain?.id)
    .slice(0, 4)

  bowlers.forEach((player) => {
    if (player.isOverseasPlayer && overseasCount >= 4) return
    if (player.isOverseasPlayer) overseasCount++
    squad.bowlers.push(player)
  })

  // Add allrounders (aim for 2-3)
  const allrounders = sortedPlayers
    .filter((player) => player.role === "Allrounder" && player.id !== squad.captain?.id)
    .slice(0, 3)

  allrounders.forEach((player) => {
    if (player.isOverseasPlayer && overseasCount >= 4) return
    if (player.isOverseasPlayer) overseasCount++
    squad.allrounders.push(player)
  })

  // If we don't have a wicketkeeper yet, add one
  if (!squad.wicketkeeper) {
    const bestWicketkeeper = sortedPlayers.find(
      (player) => player.role === "Wicketkeeper" && (!player.isOverseasPlayer || overseasCount < 4),
    )

    if (bestWicketkeeper) {
      squad.wicketkeeper = bestWicketkeeper
      if (bestWicketkeeper.isOverseasPlayer) overseasCount++
    }
  }

  // Flatten the squad into a single array
  const recommendedSquad = [
    ...(squad.captain ? [squad.captain] : []),
    ...(squad.wicketkeeper ? [squad.wicketkeeper] : []),
    ...squad.batsmen,
    ...squad.bowlers,
    ...squad.allrounders,
  ]

  // Ensure we have 11 players by adding the best remaining players
  const remainingPlayers = sortedPlayers.filter((player) => !recommendedSquad.some((p) => p.id === player.id))

  while (recommendedSquad.length < 11 && remainingPlayers.length > 0) {
    const nextBestPlayer = remainingPlayers.shift()
    if (nextBestPlayer) {
      if (nextBestPlayer.isOverseasPlayer && overseasCount >= 4) continue
      if (nextBestPlayer.isOverseasPlayer) overseasCount++
      recommendedSquad.push(nextBestPlayer)
    }
  }

  return {
    recommendedSquad,
    remainingPlayers,
  }
}

export function predictMatchOutcome(team1: any, team2: any) {
  // Calculate team strengths
  const calculateTeamStrength = (team: any) => {
    const players = team.players || []

    // Calculate batting strength
    const battingStrength =
      players.reduce((total: number, player: any) => {
        if (player.role === "Batsman" || player.role === "Wicketkeeper") {
          return total + player.battingAvg * 0.7 + player.strikeRate * 0.3
        } else if (player.role === "Allrounder") {
          return total + (player.battingAvg * 0.7 + player.strikeRate * 0.3) * 0.6
        }
        return total
      }, 0) / players.length

    // Calculate bowling strength (lower is better for bowling avg and economy)
    const bowlingStrength =
      players.reduce((total: number, player: any) => {
        if (player.role === "Bowler") {
          const invertedBowlingAvg = player.bowlingAvg ? 50 - player.bowlingAvg : 0
          const invertedEconomy = player.economyRate ? 12 - player.economyRate : 0
          return total + invertedBowlingAvg * 0.6 + invertedEconomy * 0.4
        } else if (player.role === "Allrounder") {
          const invertedBowlingAvg = player.bowlingAvg ? 50 - player.bowlingAvg : 0
          const invertedEconomy = player.economyRate ? 12 - player.economyRate : 0
          return total + (invertedBowlingAvg * 0.6 + invertedEconomy * 0.4) * 0.6
        }
        return total
      }, 0) / players.length

    // Calculate form and consistency
    const formStrength =
      players.reduce((total: number, player: any) => {
        return total + (player.form || 0)
      }, 0) / players.length

    const consistencyStrength =
      players.reduce((total: number, player: any) => {
        return total + (player.consistency || 0)
      }, 0) / players.length

    return {
      batting: battingStrength,
      bowling: bowlingStrength,
      form: formStrength,
      consistency: consistencyStrength,
      overall: battingStrength * 0.4 + bowlingStrength * 0.4 + formStrength * 0.1 + consistencyStrength * 0.1,
    }
  }

  const team1Strength = calculateTeamStrength(team1)
  const team2Strength = calculateTeamStrength(team2)

  // Calculate win probability
  const team1WinProb = team1Strength.overall / (team1Strength.overall + team2Strength.overall)
  const team2WinProb = 1 - team1WinProb

  // Generate projected scores
  const generateScore = (battingStrength: number, bowlingStrengthAgainst: number) => {
    // Base score between 140-180
    const baseScore = 140 + Math.random() * 40

    // Adjust based on batting strength and opponent's bowling strength
    const adjustedScore = baseScore * (battingStrength / 30) * (1 - bowlingStrengthAgainst / 100)

    // Calculate wickets (more random)
    const wickets = Math.min(10, Math.floor(Math.random() * 10))

    return {
      runs: Math.round(adjustedScore),
      wickets,
    }
  }

  const team1Score = generateScore(team1Strength.batting, team2Strength.bowling)
  const team2Score = generateScore(team2Strength.batting, team1Strength.bowling)

  // Determine winner based on scores
  let winner
  if (team1Score.runs > team2Score.runs) {
    winner = team1.name
  } else if (team2Score.runs > team1Score.runs) {
    winner = team2.name
  } else {
    // In case of a tie, use win probability
    winner = team1WinProb > 0.5 ? team1.name : team2.name
  }

  // Find key players
  const findKeyPlayers = (team: any) => {
    const players = team.players || []
    return players
      .map((player: any) => ({
        ...player,
        score: calculatePlayerScore(player, 50, 50), // Equal weights for simplicity
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
  }

  const team1KeyPlayers = findKeyPlayers(team1)
  const team2KeyPlayers = findKeyPlayers(team2)

  return {
    team1: {
      name: team1.name,
      winProbability: Math.round(team1WinProb * 100),
      projectedScore: team1Score,
      strengths: {
        batting: Math.round(team1Strength.batting),
        bowling: Math.round(team1Strength.bowling),
        form: Math.round(team1Strength.form),
        consistency: Math.round(team1Strength.consistency),
      },
      keyPlayers: team1KeyPlayers,
    },
    team2: {
      name: team2.name,
      winProbability: Math.round(team2WinProb * 100),
      projectedScore: team2Score,
      strengths: {
        batting: Math.round(team2Strength.batting),
        bowling: Math.round(team2Strength.bowling),
        form: Math.round(team2Strength.form),
        consistency: Math.round(team2Strength.consistency),
      },
      keyPlayers: team2KeyPlayers,
    },
    winner,
    margin: Math.abs(team1Score.runs - team2Score.runs),
  }
}

