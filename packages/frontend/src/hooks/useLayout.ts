import { useState, useEffect } from 'react';
import { getLayout, LayoutPositions } from '../services/apiClient';

export const useLayout = () => {
  const [layout, setLayout] = useState<LayoutPositions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true);
      try {
        const data = await getLayout();
        setLayout(data);
      } catch (err) {
        setError('Failed to fetch layout');
        console.error(err);
      } finally {
        setLoading(false); 
      }
    };

    fetchLayout();
  }, []);

  return { layout, loading, error };
};
