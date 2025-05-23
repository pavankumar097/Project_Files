import { useState } from 'react';

interface SquadRequest {
  form_weight: number;
  consistency_weight: number;
  team_name: string;
}

export function useSquadData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquadData = async (params: SquadRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-squad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch squad data');
      }

      const data = await response.json();
      return data.squads[0]; // Get the first (best) squad
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchSquadData, loading, error };
}