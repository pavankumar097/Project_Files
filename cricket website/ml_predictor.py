import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
from typing import List, Dict

class MatchPredictor:
    def __init__(self):
        self.model_player = None
        self.model_agg = None
        self.df_player = None
        self.venue_avg = None
        self.features_player = ['venue_avg', 'player_mean', 'player_std', 'recent_form']
        self.features_agg = [f'pred_{i+1}' for i in range(11)] + ['venue_avg', 'innings']

    def load_data(self, data_path: str):
        """Load and preprocess the ball-by-ball data"""
        df = pd.read_csv(data_path)
        
        # Precompute player-innings aggregates
        self.df_player = (
            df.groupby(['match_id', 'venue', 'innings', 'batting_team', 'bowling_team', 'striker'])['runs_off_bat']
            .agg(['sum', 'mean', 'std'])
            .reset_index()
            .rename(columns={'sum': 'player_runs', 'mean': 'player_mean', 'std': 'player_std'})
        )

        # Add recent form
        player_history = []
        for player, g in self.df_player.groupby('striker'):
            g = g.sort_values('match_id')
            g['recent_form'] = g['player_runs'].rolling(5, min_periods=1).mean().shift(1)
            player_history.append(g)
        
        self.df_player = pd.concat(player_history, ignore_index=True)
        self.df_player[['player_std', 'recent_form']] = self.df_player[['player_std', 'recent_form']].fillna(0)

        # Compute venue averages
        df_total = (
            df.groupby(['match_id', 'venue', 'innings'])['runs_off_bat']
            .sum()
            .reset_index()
            .rename(columns={'runs_off_bat': 'innings_total'})
        )
        
        self.venue_avg = (
            df_total.groupby('venue')['innings_total']
            .mean()
            .reset_index()
            .rename(columns={'innings_total': 'venue_avg'})
        )

        # Merge venue averages
        self.df_player = self.df_player.merge(
            df_total[['match_id', 'innings', 'venue']],
            on=['match_id', 'innings', 'venue'], 
            how='left'
        ).merge(self.venue_avg, on='venue', how='left')

        return df_total.merge(self.venue_avg, on='venue', how='left')

    def train_models(self, df_total):
        """Train both player and aggregator models"""
        # Train player model
        df_p = self.df_player.copy()
        match_ids = df_p['match_id'].unique()
        train_ids, test_ids = train_test_split(match_ids, test_size=0.2, random_state=42)
        
        train = df_p[df_p['match_id'].isin(train_ids)]
        test = df_p[df_p['match_id'].isin(test_ids)]

        dtrain = xgb.DMatrix(train[self.features_player], label=train['player_runs'])
        dtest = xgb.DMatrix(test[self.features_player], label=test['player_runs'])
        
        params = {'objective': 'reg:squarederror', 'learning_rate': 0.05, 'max_depth': 6, 'seed': 42}
        
        self.model_player = xgb.train(
            params, dtrain, num_boost_round=300,
            evals=[(dtest, 'eval')], early_stopping_rounds=20, verbose_eval=False
        )

        # Prepare aggregator training data
        agg_rows = []
        for mid, group in self.df_player.groupby('match_id'):
            top11 = group.nlargest(11, 'player_runs')
            preds = self.model_player.predict(xgb.DMatrix(top11[self.features_player]))
            row = {f'pred_{i+1}': preds[i] for i in range(len(preds))}
            va = top11['venue_avg'].iloc[0]
            inn = top11['innings'].iloc[0]
            total = df_total.loc[(df_total['match_id']==mid)&(df_total['innings']==inn), 'innings_total'].values[0]
            row.update({'venue_avg': va, 'innings': inn, 'total': total})
            agg_rows.append(row)

        df_agg = pd.DataFrame(agg_rows)
        Xagg = df_agg[self.features_agg]
        yagg = df_agg['total']

        # Train aggregator model
        Xtr_agg, Xte_agg, ytr_agg, yte_agg = train_test_split(Xagg, yagg, test_size=0.2, random_state=42)
        dtrain_agg = xgb.DMatrix(Xtr_agg, label=ytr_agg)
        dtest_agg = xgb.DMatrix(Xte_agg, label=yte_agg)

        self.model_agg = xgb.train(
            params, dtrain_agg, num_boost_round=200,
            evals=[(dtest_agg, 'eval')], early_stopping_rounds=20, verbose_eval=False
        )

    def save_models(self, player_model_path: str, agg_model_path: str):
        """Save trained models"""
        self.model_player.save_model(player_model_path)
        self.model_agg.save_model(agg_model_path)

    def load_models(self, player_model_path: str, agg_model_path: str):
        """Load trained models"""
        self.model_player = xgb.Booster()
        self.model_player.load_model(player_model_path)
        self.model_agg = xgb.Booster()
        self.model_agg.load_model(agg_model_path)

    def predict_innings(self, players: List[str], venue: str, batting_team: str, bowling_team: str, innings: int) -> float:
        """Predict innings total for given players and conditions"""
        feats = []
        for p in players:
            hist = self.df_player[self.df_player['striker']==p].sort_values('match_id')
            if len(hist) == 0:
                # Handle new players with default values
                feats.append([
                    self.venue_avg.loc[self.venue_avg['venue']==venue, 'venue_avg'].values[0],
                    0, 0, 0
                ])
            else:
                pm = hist['player_mean'].iloc[-1]
                ps = hist['player_std'].iloc[-1]
                rf = hist['recent_form'].iloc[-1]
                va = self.venue_avg.loc[self.venue_avg['venue']==venue, 'venue_avg'].values[0]
                feats.append([va, pm, ps, rf])
        
        df_feat = pd.DataFrame(feats, columns=self.features_player)
        pred_scores = self.model_player.predict(xgb.DMatrix(df_feat))
        
        agg_input = {f'pred_{i+1}': pred_scores[i] for i in range(len(pred_scores))}
        agg_input.update({
            'venue_avg': self.venue_avg.loc[self.venue_avg['venue']==venue, 'venue_avg'].values[0],
            'innings': innings
        })
        
        df_row = pd.DataFrame([agg_input])[self.features_agg]
        total_pred = self.model_agg.predict(xgb.DMatrix(df_row))[0]
        
        return float(total_pred) 