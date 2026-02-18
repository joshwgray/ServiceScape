import { useMemo } from 'react';

// Simple fuzzy/partial match with scoring
const getScore = (value: string, query: string): number => {
  const v = value.toLowerCase();
  const q = query.toLowerCase();

  if (v === q) return 100;
  if (v.startsWith(q)) return 80;
  if (v.includes(q)) return 50;
  return 0;
};

export const useSearch = <T>(items: T[], query: string, keys: (keyof T)[]) => {
  return useMemo(() => {
    if (!query) return items;

    const scoredItems = items.map((item) => {
      let maxScore = 0;
      for (const key of keys) {
        const value = String(item[key] || '');
        const score = getScore(value, query);
        if (score > maxScore) maxScore = score;
      }
      return { item, score: maxScore };
    });

    return scoredItems
      .filter((si) => si.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((si) => si.item);
  }, [items, query, keys]);
};
