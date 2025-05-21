from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import itertools
import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SquadRequest(BaseModel):
    form_weight: float = 0.7
    consistency_weight: float = 0.3
    team_name: str = "CSK"

# New model for player stats request
class PlayerStatsRequest(BaseModel):
    player_type: str  # "Batsman", "Bowler", "Allrounder", "Wicketkeeper"
    season: str  # "overall", "lastseason"

@app.post("/api/generate-squad")
def generate_squad(request: SquadRequest = Body(...)):
    # Excel file path - update this to your server path
    excel_file_path = "/Users/pavanbandaru/Downloads/cricket-squad-selection/ipl_correct_one.xlsx"
    sheet_name = request.team_name
    print(request)
    # Read the Excel file
    df = pd.read_excel(excel_file_path, sheet_name=sheet_name)
    
    # Define criteria
    criteria = ['Form', 'Consistency']
    
    # Extract decision matrix
    decision_matrix = df[criteria].values.astype(float)
    
    # Normalize the decision matrix
    norm_denominator = np.sqrt((decision_matrix ** 2).sum(axis=0))
    norm_matrix = decision_matrix / norm_denominator
    form_weight = request.form_weight
    consistency_weight = request.consistency_weight
    # Apply weights
    weights = np.array([form_weight, consistency_weight])
    weighted_norm_matrix = norm_matrix * weights
    
    # Determine ideal and anti-ideal solutions
    ideal_solution = weighted_norm_matrix.max(axis=0)
    anti_ideal_solution = weighted_norm_matrix.min(axis=0)
    
    # Calculate distances
    distance_to_ideal = np.sqrt(((weighted_norm_matrix - ideal_solution) ** 2).sum(axis=1))
    distance_to_anti_ideal = np.sqrt(((weighted_norm_matrix - anti_ideal_solution) ** 2).sum(axis=1))
    
    # Compute TOPSIS score
    df['TOPSIS_Score'] = distance_to_anti_ideal / (distance_to_ideal + distance_to_anti_ideal)
    df['Weighted_Form'] = df['Form'] * form_weight
    df['Weighted_Consistency'] = df['Consistency'] * consistency_weight
    df['Weighted_Sum_Score'] = df['Weighted_Form'] + df['Weighted_Consistency']

    # Group players by Position
    positions = range(1, 12)
    grouped = {pos: df[df['Position'] == pos].to_dict('records')
               for pos in positions if not df[df['Position'] == pos].empty}
    
    # Generate all possible squad combinations
    all_squads = list(itertools.product(*(grouped[pos] for pos in positions)))
    
    # Filter squads to meet constraints
    valid_squads = []
    for squad in all_squads:
        foreign_count = sum(1 for player in squad if player['Nationality'].strip().lower() == 'foreginer')
        wk_count = sum(1 for player in squad if 'WK' in player['Type'])
        if foreign_count == 4 and wk_count >= 1:
            valid_squads.append(squad)
    
    # Sort valid squads by total TOPSIS score
    valid_squads_sorted = sorted(valid_squads,
                                key=lambda squad: sum(player['TOPSIS_Score'] for player in squad),
                                reverse=True)
    
    # Select top 5 squads
    top_squads = valid_squads_sorted[:5]
    
    # Format response
    result = []
    for idx, squad in enumerate(top_squads, start=1):
        squad_score = sum(player['TOPSIS_Score'] for player in squad)
        indian_count = sum(1 for player in squad if player['Nationality'].strip().lower() == 'indian')
        foreign_count = sum(1 for player in squad if player['Nationality'].strip().lower() == 'foreginer')
        
        formatted_squad = {
            "id": idx,
            "score": round(squad_score, 4),
            "players": [],
            "stats": {
                "indian": indian_count,
                "foreign": foreign_count,
                "roles": {
                    "Batsman": sum(1 for player in squad if player['Type'] == 'BAT'),
                    "Bowler": sum(1 for player in squad if player['Type'] == 'BOWL'),
                    "Allrounder": sum(1 for player in squad if player['Type'] == 'AR'),
                    "Wicketkeeper": sum(1 for player in squad if 'WK' in player['Type'])
                }
            }
        }
        
        for player in sorted(squad, key=lambda p: p['Position']):
            formatted_squad["players"].append({
                "id": str(player['Position']),
                "name": player['Player'],
                "score": round(float(player['TOPSIS_Score']), 2) if not pd.isna(player['TOPSIS_Score']) else 0.0,
                "role": "Wicketkeeper" if 'WK' in player['Type'] else 
                        "Batsman" if player['Type'] == 'BAT' else
                        "Bowler" if player['Type'] == 'BOWL' else "Allrounder",
                "bowlerType": player['Bowler_Type'] if not pd.isna(player['Bowler_Type']) else None,
                "isOverseasPlayer": player['Nationality'].strip().lower() == 'foreginer',
                "form": round(float(player['Weighted_Form']), 2) if not pd.isna(player['Weighted_Form']) else 0.0,
                "consistency": round(float(player['Weighted_Consistency']), 2) if not pd.isna(player['Weighted_Consistency']) else 0.0,
                "position": int(player['Position'])
            })
        
        print(formatted_squad)
        result.append(formatted_squad)
    
    return {"squads": result}

@app.post("/api/player-stats")
def get_player_stats(request: PlayerStatsRequest = Body(...)):
    """
    Retrieve player statistics from Excel files based on player type and season.
    """
    try:
        # Map player types to file prefixes
        player_type_map = {
            "Batsman": "batsman",
            "Bowler": "bowler",
            "Allrounder": "allrounder",
            "Wicketkeeper": "wicketkeeper"
        }

        # Map seasons to file suffixes
        season_map = {
            "overall": "overall",
            "lastseason": "lastseason"
        }

        if request.player_type not in player_type_map:
            raise HTTPException(status_code=400, detail=f"Invalid player type: {request.player_type}")

        if request.season not in season_map:
            raise HTTPException(status_code=400, detail=f"Invalid season: {request.season}")

        # Construct file path from the maps
        file_prefix = player_type_map[request.player_type]
        file_suffix = season_map[request.season]

        # Base directory for stats files
        stats_dir = "/Users/pavanbandaru/Downloads/cricket-squad-selection/cricsquad/public/stats"

        # Build the file path, e.g. "batsman_overall.xlsx"
        file_path = os.path.join(stats_dir, f"{file_prefix}_{file_suffix}.xlsx")

        # Check if file exists
        if not os.path.exists(file_path):
            # Optional fallback if needed (remove if not desired)
            file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", f"{file_prefix}_{file_suffix}.xlsx")
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail=f"Stats file not found: {file_prefix}_{file_suffix}.xlsx")

        # Read Excel file
        df = pd.read_excel(file_path)

        # Convert DataFrame to a list of dicts
        stats_data = df.to_dict(orient="records")

        # Return the data
        return {"stats": stats_data}
    
    except Exception as e:
        print(f"Error retrieving player stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve player statistics: {str(e)}")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
