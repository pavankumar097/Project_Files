from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import itertools
import os
import random
import hashlib
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor

app = FastAPI()

# Global variables for model and transformers
model_pipeline = None
training_data = None

team_mapping = {
    # Map abbreviations to full names based on your training data
    "MI": "Mumbai Indians",
    "CSK": "Chennai Super Kings",
    "RCB": "Royal Challengers Bangalore",
    "KKR": "Kolkata Knight Riders",
    "DC": "Delhi Capitals",
    "SRH": "Sunrisers Hyderabad",
    "PBKS": "Punjab Kings",
    "RR": "Rajasthan Royals",
    "GT": "Gujarat Titans",
    "LSG": "Lucknow Super Giants"
}

# Base scores for teams (you can adjust these based on historical performance)
team_base_scores = {
    "Mumbai Indians": 165,
    "Chennai Super Kings": 170,
    "Royal Challengers Bangalore": 175,
    "Kolkata Knight Riders": 160,
    "Delhi Capitals": 162,
    "Sunrisers Hyderabad": 155,
    "Punjab Kings": 160,
    "Rajasthan Royals": 158,
    "Gujarat Titans": 165,
    "Lucknow Super Giants": 160
}

# Venue impact on scoring (positive means batting-friendly)
venue_impact = {
    "Wankhede Stadium, Mumbai": 10,
    "M Chinnaswamy Stadium, Bengaluru": 15,
    "Eden Gardens, Kolkata": 5,
    "MA Chidambaram Stadium, Chepauk, Chennai": -5,
    "Arun Jaitley Stadium": 8,
    "Narendra Modi Stadium, Ahmedabad": 0,
    "Rajiv Gandhi International Stadium, Uppal": -3,
    "Punjab Cricket Association IS Bindra Stadium, Mohali, Chandigarh": 7,
    "Sawai Mansingh Stadium, Jaipur": 3,
    "Holkar Cricket Stadium": 12,
    # Add other venues with default value of 0
}

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

class MatchPredictionRequest(BaseModel):
    players: List[str]
    venue: str
    batting_team: str
    bowling_team: str
    innings: int
    current_score: float = 0
    balls_left: int = 120
    wickets_left: int = 10
    current_run_rate: float = 0
    last_five: float = 0

# Initialize the model on startup
@app.on_event("startup")
async def startup_event():
    global model_pipeline, training_data
    try:
        # Load the training data for fallback calculations
        training_data = pd.read_csv("ProcessedDataInningsIPL.csv")
        print("Training data loaded successfully!")
        
    except Exception as e:
        print(f"Error loading training data: {str(e)}")
        print("Will use default values for predictions")

@app.post("/api/generate-squad")
def generate_squad(request: SquadRequest = Body(...)):
    # Excel file path - update this to your server path
    excel_file_path = "../ipl_correct_one.xlsx"
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
        stats_dir = "/Users/dog/Documents/CricketSquadSelection/codes/cricsquad/public/stats"

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

def get_player_impact(player_list):
    """Calculate impact of players based on their names, with consistent output for the same list"""
    # No player impact calculation - return 0
    return 0

@app.post("/api/predict-match")
def predict_match(request: MatchPredictionRequest = Body(...)):
    try:
        if len(request.players) != 11:
            raise HTTPException(status_code=400, detail="Exactly 11 players required")
        
        # Map team names if they're abbreviations
        batting_team = team_mapping.get(request.batting_team, request.batting_team)
        bowling_team = team_mapping.get(request.bowling_team, request.bowling_team)
        
        print(f"Using batting team: {batting_team} (from {request.batting_team})")
        print(f"Using bowling team: {bowling_team} (from {request.bowling_team})")
        print(f"Venue: {request.venue}")
        
        # Create a request key to check if we've seen this exact request before
        request_key = f"{batting_team}_{bowling_team}_{request.venue}_{request.innings}"
        
        # Get base score for the batting team or use a default
        base_score = team_base_scores.get(batting_team, 160)
        
        # Adjust for venue effect
        venue_effect = venue_impact.get(request.venue, 0)
        
        # Adjust for innings
        innings_effect = -10 if request.innings == 2 else 0  # Second innings typically scores less
        
        # Calculate final prediction
        predicted_score = base_score + venue_effect + innings_effect
        
        # Ensure score is reasonable (between 100 and 250)
        predicted_score = max(100, min(250, predicted_score))
        
        print(f"Prediction components: Base={base_score}, Venue={venue_effect}, Innings={innings_effect}")
        print(f"Final predicted score: {predicted_score:.2f}")
        
        return {
            "predicted_score": round(predicted_score, 2),
            "batting_team": str(request.batting_team),
            "bowling_team": str(request.bowling_team),
            "venue": str(request.venue),
            "innings": int(request.innings),
            "current_score": float(request.current_score),
            "balls_left": int(request.balls_left),
            "wickets_left": int(request.wickets_left),
            "current_run_rate": float(request.current_run_rate),
            "last_five": float(request.last_five)
        }
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
