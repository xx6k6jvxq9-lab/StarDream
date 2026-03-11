import type { StoryNode } from '../types/story';
import { announcementStories } from './announcements';
import { dailyStories } from './daily';
import { endingStories } from './endings';
import { allEncounters } from './encounters';
import { specialEvents } from './specialEvents';

const allStoryMaps: Array<Record<string, StoryNode>> = [
  allEncounters,
  specialEvents,
  dailyStories,
  announcementStories,
  endingStories,
];

export function getStoryById(id: string): StoryNode | null {
  for (const storyMap of allStoryMaps) {
    const story = storyMap[id];
    if (story) return story;
  }
  return null;
}

export { allEncounters, announcementStories, dailyStories, endingStories, specialEvents };
