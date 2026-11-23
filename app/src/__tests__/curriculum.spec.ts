import { describe, it, expect } from 'vitest';
import {
  buildAllLearningUnits,
  getExercisesByIds,
  LESSON_EXERCISES_MAP,
  LESSON_SEQUENCE,
} from '../data/curriculum';
import { SURI_IMAGES } from '../utils/suriAssets';
import type { SuriPose } from '../types/exercises';

describe('Curriculum & Minigame Integrity (7 Courses / 25 Lessons / 15 Engines)', () => {
  it('exposes exactly 7 courses and 25 sequenced lessons', () => {
    const units = buildAllLearningUnits([], []);
    expect(units).toHaveLength(7);
    expect(LESSON_SEQUENCE).toHaveLength(25);
  });

  it('validates exercises in every lesson without broken structural links', () => {
    for (const lessonId of LESSON_SEQUENCE) {
      const exercises = LESSON_EXERCISES_MAP[lessonId];
      expect(Array.isArray(exercises), `Missing exercises for ${lessonId}`).toBe(true);
      expect(exercises.length, `Empty exercises for ${lessonId}`).toBeGreaterThan(0);

      for (const ex of exercises) {
        if (ex.type === 'chat_simulator') {
          expect(ex.dialogueNodes[ex.rootNodeId], `Broken chat rootNodeId in ${ex.id}`).toBeDefined();
        }
        if (ex.type === 'url_inspector') {
          const matched = ex.segments.some((s) => s.id === ex.maliciousSegmentId);
          expect(matched, `Broken maliciousSegmentId in ${ex.id}`).toBe(true);
        }
        if (ex.type === 'password_builder') {
          const totalAvailableBits = ex.availableTokens.reduce(
            (sum, t) => sum + t.entropyContributionBits,
            0
          );
          expect(
            totalAvailableBits,
            `Unsolvable password_builder without duplicates in ${ex.id}`
          ).toBeGreaterThanOrEqual(ex.minEntropyRequired);
        }
        if (ex.type === 'cyber_hangman') {
          expect(ex.rounds.length, `Empty hangman rounds in ${ex.id}`).toBeGreaterThan(0);
          for (const round of ex.rounds) {
            expect(round.word, `Invalid hangman word in ${ex.id}`).toMatch(/^[A-Z]+$/);
          }
        }
        if (ex.type === 'cyber_snake') {
          expect(ex.gridSize, `Grid too small in ${ex.id}`).toBeGreaterThanOrEqual(10);
          expect(ex.targetSafeCount, `Invalid targetSafeCount in ${ex.id}`).toBeGreaterThan(0);
        }
        if (ex.type === 'cyber_memory') {
          expect(ex.pairs.length, `Too few pairs in ${ex.id}`).toBeGreaterThanOrEqual(4);
        }
        if (ex.type === 'threat_whack') {
          expect(
            ex.spawnPool.some((i) => i.isThreat),
            `No threats in ${ex.id}`
          ).toBe(true);
          expect(
            ex.spawnPool.some((i) => !i.isThreat),
            `No benign items in ${ex.id}`
          ).toBe(true);
        }
      }
    }
  });

  it('resolves non-empty mascot assets for all 11 SuriPose states', () => {
    const poses: SuriPose[] = [
      'idle',
      'victory',
      'error',
      'sleeping',
      'shield',
      'idea',
      'cool',
      'running',
      'wink',
      'surprised',
      'ok',
    ];
    for (const pose of poses) {
      expect(typeof SURI_IMAGES[pose], `Missing image string for pose ${pose}`).toBe('string');
      expect(SURI_IMAGES[pose].length, `Empty image string for pose ${pose}`).toBeGreaterThan(0);
    }
  });

  it('preserves stored stars on completed nodes and resolves Error Review Hub exercises', () => {
    const units = buildAllLearningUnits(['inbox-scanner-1'], [], { 'inbox-scanner-1': 2 });
    const firstLesson = units[0].nodes.find((n) => n.id === 'inbox-scanner-1');
    expect(firstLesson?.status).toBe('completed');
    expect(firstLesson?.stars).toBe(2);

    const firstId = LESSON_EXERCISES_MAP['inbox-scanner-1'][0].id;
    const secondId = LESSON_EXERCISES_MAP['url-inspector-1'][0].id;
    const resolved = getExercisesByIds([firstId, secondId, firstId, 'non-existent-id']);
    expect(resolved.map((e) => e.id)).toEqual([firstId, secondId]);
  });
});
