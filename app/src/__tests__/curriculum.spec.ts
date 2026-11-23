import { describe, it, expect } from 'vitest';
import {
  buildAllLearningUnits,
  getExercisesByIds,
  LESSON_EXERCISES_MAP,
  LESSON_SEQUENCE,
} from '../data/curriculum';
import { SURI_IMAGES } from '../utils/suriAssets';
import type { SuriPose } from '../types/exercises';

describe('Curriculum & Minigame Integrity (15 Sequential Courses / 75 Lessons / 19 Engines)', () => {
  it('exposes exactly 15 sequential courses with 5 lessons + 1 chest each (75 lessons)', () => {
    const units = buildAllLearningUnits([], []);
    expect(units).toHaveLength(15);
    expect(LESSON_SEQUENCE).toHaveLength(75);
    for (const unit of units) {
      expect(unit.nodes.filter((n) => n.type === 'lesson')).toHaveLength(5);
      expect(unit.nodes.filter((n) => n.type === 'reward_chest')).toHaveLength(1);
    }
  });

  it('enforces strict sequential progression across courses and honors diagnostic placement', () => {
    const initialUnits = buildAllLearningUnits([], [], {}, 0);
    expect(initialUnits[0].nodes[0].status).toBe('active');
    expect(initialUnits[0].nodes[1].status).toBe('locked');
    expect(initialUnits[1].nodes[0].status).toBe('locked');
    expect(initialUnits[14].nodes[0].status).toBe('locked');

    const unit1Lessons = initialUnits[0].nodes
      .filter((n) => n.type === 'lesson')
      .map((n) => n.id);
    const afterCourse1 = buildAllLearningUnits(unit1Lessons, [], {}, 0);
    expect(afterCourse1[0].progressPercentage).toBe(100);
    expect(afterCourse1[1].nodes[0].status).toBe('active');
    expect(afterCourse1[2].nodes[0].status).toBe('locked');

    const midPlaced = buildAllLearningUnits([], [], {}, 6);
    expect(midPlaced[0].progressPercentage).toBe(100);
    expect(midPlaced[5].progressPercentage).toBe(100);
    expect(midPlaced[6].nodes[0].status).toBe('active');
    expect(midPlaced[6].nodes[1].status).toBe('locked');
    expect(midPlaced[7].nodes[0].status).toBe('locked');
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
        if (ex.type === 'cyber_wordsearch') {
          expect(ex.grid.length, `Wordsearch grid empty in ${ex.id}`).toBeGreaterThanOrEqual(6);
          const rowLen = ex.grid[0].length;
          expect(rowLen, `Wordsearch row length too small in ${ex.id}`).toBeGreaterThanOrEqual(6);
          for (const row of ex.grid) {
            expect(row.length, `Uneven wordsearch row in ${ex.id}`).toBe(rowLen);
          }
          for (const t of ex.targets) {
            const dr = Math.sign(t.endRow - t.startRow);
            const dc = Math.sign(t.endCol - t.startCol);
            const len = Math.max(Math.abs(t.endRow - t.startRow), Math.abs(t.endCol - t.startCol)) + 1;
            let extracted = '';
            for (let k = 0; k < len; k++) {
              extracted += ex.grid[t.startRow + dr * k][t.startCol + dc * k];
            }
            expect(extracted, `Broken wordsearch coordinates for ${t.word} in ${ex.id}`).toBe(t.word);
          }
        }
        if (ex.type === 'cyber_minesweeper') {
          expect(ex.gridSize, `Minesweeper grid too small in ${ex.id}`).toBeGreaterThanOrEqual(5);
          expect(ex.mineCount, `Invalid mineCount in ${ex.id}`).toBeGreaterThan(0);
          expect(ex.mineCount, `Too many mines in ${ex.id}`).toBeLessThan(ex.gridSize * ex.gridSize - 1);
          expect(ex.maxShields, `Invalid maxShields in ${ex.id}`).toBeGreaterThanOrEqual(1);
        }
        if (ex.type === 'cyber_breakout') {
          expect(ex.cols, `Breakout cols too small in ${ex.id}`).toBeGreaterThanOrEqual(4);
          expect(ex.rows.length, `Too few breakout rows in ${ex.id}`).toBeGreaterThanOrEqual(2);
          for (const row of ex.rows) {
            expect(row.hp, `Invalid brick hp in ${ex.id}`).toBeGreaterThanOrEqual(1);
          }
        }
        if (ex.type === 'cyber_invaders') {
          expect(ex.rows, `Invaders rows too small in ${ex.id}`).toBeGreaterThanOrEqual(2);
          expect(ex.cols, `Invaders cols too small in ${ex.id}`).toBeGreaterThanOrEqual(3);
          expect(
            ex.invaderTypes.length,
            `Insufficient invaderTypes for rows in ${ex.id}`
          ).toBeGreaterThanOrEqual(ex.rows);
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
    const units = buildAllLearningUnits(
      ['arcade-hangman-1', 'arcade-wordsearch-1', 'arcade-memory-1', 'inbox-scanner-1'],
      [],
      { 'inbox-scanner-1': 2 }
    );
    const fourthLesson = units[0].nodes.find((n) => n.id === 'inbox-scanner-1');
    expect(fourthLesson?.status).toBe('completed');
    expect(fourthLesson?.stars).toBe(2);

    const firstId = LESSON_EXERCISES_MAP['inbox-scanner-1'][0].id;
    const secondId = LESSON_EXERCISES_MAP['url-inspector-1'][0].id;
    const resolved = getExercisesByIds([firstId, secondId, firstId, 'non-existent-id']);
    expect(resolved.map((e) => e.id)).toEqual([firstId, secondId]);
  });
});
