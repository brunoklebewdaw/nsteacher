import { cache } from './cache';

const DEFAULT_TTL = 300;

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  get<T>(key: string): T | null {
    return cache.get<T>(key);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || DEFAULT_TTL;
    cache.set(key, data, ttl);
  }

  delete(key: string): void {
    cache.invalidate(key);
  }

  deleteByPattern(pattern: string): void {
    cache.invalidatePattern(pattern);
  }

  deleteByTag(tag: string): void {
    this.deleteByPattern(`.*${tag}.*`);
  }

  clear(): void {
    cache.clear();
  }

  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }
}

export const cacheManager = CacheManager.getInstance();

export function cacheKey(segments: string[]): string {
  return segments.join(':');
}

export const CacheTags = {
  TEACHER: 'teacher',
  CLASSES: 'classes',
  STUDENTS: 'students',
  GRADES: 'grades',
  LESSONS: 'lessons',
  MATERIALS: 'materials',
  ACTIVITIES: 'activities',
  SUBJECTS: 'subjects',
  REPORTS: 'reports',
} as const;