import { useState, useEffect } from 'react';
import { CatStory } from '@/types';
import { initialStories } from '@/data/stories';

const STORAGE_KEY = 'cat_stories';

export function useStories() {
  const [stories, setStories] = useState<CatStory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStories(JSON.parse(saved));
      } catch {
        setStories(initialStories);
      }
    } else {
      setStories(initialStories);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStories));
    }
  }, []);

  const addStory = (story: Omit<CatStory, 'id' | 'createdAt'>) => {
    const newStory: CatStory = {
      ...story,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newStory, ...stories];
    setStories(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newStory;
  };

  const getStats = () => {
    if (stories.length === 0) {
      return { total: 0, avgDuration: 0, avgDistance: 0 };
    }
    
    let totalHours = 0;
    let totalDistance = 0;
    let countWithDistance = 0;

    stories.forEach(story => {
      const lost = new Date(story.lostTime).getTime();
      const found = new Date(story.foundTime).getTime();
      const hours = Math.max(1, Math.round((found - lost) / (1000 * 60 * 60)));
      totalHours += hours;
      
      if (story.distance) {
        totalDistance += story.distance;
        countWithDistance++;
      }
    });

    return {
      total: stories.length,
      avgDuration: Math.round(totalHours / stories.length),
      avgDistance: countWithDistance > 0 ? Math.round(totalDistance / countWithDistance) : 0,
    };
  };

  return {
    stories,
    addStory,
    getStats,
  };
}
