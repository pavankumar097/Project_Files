import pandas as pd
import numpy as np

# Read the data from the correct path
df = pd.read_csv('../all_matches.csv')

# Process venue
df['venue'] = df['venue'].fillna(df['venue'].apply(lambda x: x.split(' ')[0] if isinstance(x, str) else x))
eligible_cites = df['venue'].value_counts()[df['venue'].value_counts() > 100].index.tolist()
df = df[df['venue'].isin(eligible_cites)]

# Process runs
df['runs_off_bat'] = pd.to_numeric(df['runs_off_bat'], errors='coerce')
df['extras'] = pd.to_numeric(df['extras'], errors='coerce')
df['runs_off_bat'].fillna(0, inplace=True)
df['extras'].fillna(0, inplace=True)

# Calculate current score
df['current_score'] = (df['runs_off_bat'] + df['extras']).groupby([df['match_id'], df['innings']]).cumsum()

# Process balls
df['over'] = df['ball'].apply(lambda x: str(x).split('.')[0])
df['ball_no'] = df['ball'].apply(lambda x: str(x).split('.')[1])
df['ball_bowled'] = (df['over'].astype(int)*6 + df['ball_no'].astype(int))
df['balls_left'] = 120 - df['ball_bowled']
df['balls_left'] = df['balls_left'].apply(lambda x: 0 if x<0 else x)

# Process wickets
df['player_dismissed'] = df['player_dismissed'].apply(lambda x: 1 if pd.notna(x) and x.strip() != '' else 0)
df['cumulative_dismissals'] = df.groupby(['match_id', df['innings'].astype(str)])['player_dismissed'].cumsum()
df['wicket_left'] = 10 - df['cumulative_dismissals']

# Calculate run rate
df['current_run_rate'] = (df['current_score']*6) / df['ball_bowled']
df.loc[df['ball_bowled'] == 0, 'current_run_rate'] = 0

# Calculate total runs
df['total_runs'] = df['runs_off_bat'] + df['extras']
df['total_runs_in_innings'] = df.groupby(['match_id', df['innings'].astype(str)])['total_runs'].transform('sum')

# Calculate last five overs runs
print("Calculating last five overs runs...")
groups = df.groupby('match_id')
match_id = df['match_id'].unique()
last_five = []

for id in match_id:
    group = groups.get_group(id).dropna(subset=['runs_off_bat'])
    rolling_sum = group['runs_off_bat'].rolling(window=30, min_periods=1).sum()
    last_five.extend(rolling_sum.tolist())

df['last_five'] = last_five

# Create final dataframe
final_df = df[['venue', 'batting_team', 'bowling_team', 'wicket_left', 'balls_left', 
               'last_five', 'current_score', 'current_run_rate', 'total_runs_in_innings']]
final_df.dropna(inplace=True)

# Save processed data
output_path = 'ProcessedDataInningsIPL.csv'
final_df.to_csv(output_path, index=False)
print(f"Data processing completed successfully! Saved to {output_path}")
print(f"Final dataset shape: {final_df.shape}")
print("\nSample of processed data:")
print(final_df.head())
print("\nVenue distribution:")
print(final_df['venue'].value_counts()) 