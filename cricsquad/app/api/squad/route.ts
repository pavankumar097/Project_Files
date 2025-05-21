import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { read, utils } from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, formWeight, consistencyWeight } = body;

    // Construct the absolute path to the Excel file
    const filePath = path.join(process.cwd(), "public", "ipl-teams.xlsx");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at ${filePath}`);
    }

    // Read the Excel file
    const workbook = read(filePath, { type: "buffer" });
    const worksheet = workbook.Sheets[teamName];
    
    if (!worksheet) {
      throw new Error(`Sheet for team ${teamName} not found`);
    }

    // Convert worksheet to JSON
    const players = utils.sheet_to_json(worksheet);

    // Calculate scores for each player
    const playingXI = players.map((player: any) => {
      const formScore = (player.Form || 0) * formWeight;
      const consistencyScore = (player.Consistency || 0) * consistencyWeight;
      const totalScore = formScore + consistencyScore;

      return {
        id: player.Position,
        name: player.Player,
        role: player.Type === 'BAT' ? 'Batsman' :
              player.Type === 'BOWL' ? 'Bowler' :
              player.Type === 'AR' ? 'Allrounder' :
              'Wicketkeeper',
        bowlerType: player.Bowler_Type || null,
        isOverseasPlayer: player.Nationality?.toLowerCase().trim() === 'foreginer',
        form: formScore,
        consistency: consistencyScore,
        score: totalScore,
        position: player.Position
      };
    });

    // Sort players by score
    playingXI.sort((a, b) => b.score - a.score);

    // Calculate team composition
    const composition = {
      batsmen: playingXI.filter(p => p.role === 'Batsman').length,
      bowlers: playingXI.filter(p => p.role === 'Bowler').length,
      allrounders: playingXI.filter(p => p.role === 'Allrounder').length,
      wicketkeepers: playingXI.filter(p => p.role === 'Wicketkeeper').length,
      overseas: playingXI.filter(p => p.isOverseasPlayer).length
    };

    return NextResponse.json({
      teamName,
      players: playingXI,
      composition
    });

  } catch (error) {
    console.error("Error in squad selection:", error);
    return NextResponse.json(
      { error: "Failed to process squad selection", details: (error as Error).message },
      { status: 500 }
    );
  }
}
