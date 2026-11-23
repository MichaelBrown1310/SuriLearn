import { describe, it, expect } from 'vitest';
import {
  buildAllLearningUnits,
  getExercisesByIds,
  LESSON_EXERCISES_MAP,
  LESSON_SEQUENCE,
} from '../data/curriculum';

describe('Curriculum & Minigame Integrity (6 Courses / 21 Lessons / 11 Engines)', () => {
  it('exposes exactly 6 courses and 21 sequenced lessons', () => {
    const units = buildAllLearningUnits([], []);
    expect(units).toHaveLength(6);
    expect(LESSON_SEQUENCE).toHaveLength(21);
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
      }
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
