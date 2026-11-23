import { describe, it, expect } from 'vitest';
import { calculateStreakMultiplier, GAMIFICATION_RULES, UserProfile } from '../types/gamification';
import {
  applyStreakTransition,
  computeDynamicBadges,
  computeLeagueFromXp,
  computeLessonOutcome,
  computePassiveHeartRefill,
  computeRealWeeklyTeamActivity,
  evaluateDiagnosticAnswers,
  getWeeklyCountdownLabel,
} from '../utils/gamificationEngine';

describe('Gamification Engine & Business Rules (RN-01 a RN-08)', () => {
  it('calculates streak multipliers accurately (RN-04)', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0);
    expect(calculateStreakMultiplier(1)).toBe(1.0);
    expect(calculateStreakMultiplier(3)).toBe(1.0);
    expect(calculateStreakMultiplier(4)).toBe(1.2);
    expect(calculateStreakMultiplier(7)).toBe(1.2);
    expect(calculateStreakMultiplier(8)).toBe(1.5);
    expect(calculateStreakMultiplier(14)).toBe(1.5);
    expect(calculateStreakMultiplier(15)).toBe(2.0);
    expect(calculateStreakMultiplier(30)).toBe(2.0);
  });

  it('enforces >=60% minimum pass threshold and awards 1..3 stars', () => {
    expect(computeLessonOutcome(0)).toEqual({ passed: false, stars: 0 });
    expect(computeLessonOutcome(59)).toEqual({ passed: false, stars: 0 });
    expect(computeLessonOutcome(60)).toEqual({ passed: true, stars: 1 });
    expect(computeLessonOutcome(79)).toEqual({ passed: true, stars: 1 });
    expect(computeLessonOutcome(80)).toEqual({ passed: true, stars: 2 });
    expect(computeLessonOutcome(99)).toEqual({ passed: true, stars: 2 });
    expect(computeLessonOutcome(100)).toEqual({ passed: true, stars: 3 });
  });

  it('consumes hasStreakFreeze when protecting a missed day', () => {
    const res = applyStreakTransition({
      currentStreak: 5,
      lastActiveDate: '2026-11-20',
      activeDates: ['2026-11-20'],
      hasStreakFreeze: true,
      today: '2026-11-23',
      yesterday: '2026-11-22',
    });

    expect(res.streakDays).toBe(6);
    expect(res.freezeConsumed).toBe(true);
    expect(res.hasStreakFreeze).toBe(false);
    expect(res.activeDates).toContain('2026-11-23');
  });

  it('resets streak when missing a day without streak freeze and awards 7-day bonus', () => {
    const resetRes = applyStreakTransition({
      currentStreak: 5,
      lastActiveDate: '2026-11-20',
      activeDates: ['2026-11-20'],
      hasStreakFreeze: false,
      today: '2026-11-23',
      yesterday: '2026-11-22',
    });
    expect(resetRes.streakDays).toBe(1);
    expect(resetRes.freezeConsumed).toBe(false);

    const sevenDayRes = applyStreakTransition({
      currentStreak: 6,
      lastActiveDate: '2026-11-22',
      activeDates: ['2026-11-22'],
      hasStreakFreeze: false,
      today: '2026-11-23',
      yesterday: '2026-11-22',
    });
    expect(sevenDayRes.streakDays).toBe(7);
    expect(sevenDayRes.streakBitsBonus).toBe(GAMIFICATION_RULES.ECONOMY.BITS_7_DAY_STREAK);
  });

  it('restores passive hearts every 4 hours and locks at 5 for Pro (RN-02 / RN-06)', () => {
    const startMs = Date.parse('2026-11-23T08:00:00.000Z');
    const after9h = startMs + 9 * 60 * 60 * 1000;

    const refill = computePassiveHeartRefill(1, '2026-11-23T08:00:00.000Z', false, after9h);
    expect(refill.hearts).toBe(3);
    expect(refill.hasUpdated).toBe(true);

    const proRefill = computePassiveHeartRefill(2, '2026-11-23T08:00:00.000Z', true, startMs);
    expect(proRefill.hearts).toBe(5);
    expect(proRefill.hasUpdated).toBe(true);
  });

  it('computes league promotions dynamically from XP thresholds', () => {
    expect(computeLeagueFromXp(0).name).toBe('Bronce');
    expect(computeLeagueFromXp(199).divisionRoman).toBe('División V');
    expect(computeLeagueFromXp(200).name).toBe('Plata');
    expect(computeLeagueFromXp(600).name).toBe('Oro');
    expect(computeLeagueFromXp(1200).name).toBe('Diamante');
    expect(computeLeagueFromXp(2500).name).toBe('Supremo');
  });

  it('starts new 0-XP users with 0 unlocked badges and unlocks dynamically', () => {
    const freshBadges = computeDynamicBadges({
      completedLessons: [],
      xp: 0,
      streakDays: 0,
      accuracyRate: 0,
    });
    expect(freshBadges.filter((b) => b.isUnlocked)).toHaveLength(0);

    const veteranBadges = computeDynamicBadges({
      completedLessons: ['inbox-scanner-1', 'url-inspector-1', 'password-builder-1'],
      xp: 450,
      streakDays: 7,
      accuracyRate: 95,
    });
    expect(veteranBadges.every((b) => b.isUnlocked)).toBe(true);
  });

  it('evaluates 10-question adaptive diagnostic tiers and Q1+Q2 safeguard', () => {
    const areas = [
      'basics_phishing',
      'social_eng',
      'passwords_mfa',
      'mobile_malware',
      'firewall_ports',
      'network_vpn',
      'ai_bec',
      'soc_ransomware',
      'owasp_devsecops',
      'forensic_ciso',
    ];
    const makeAnswers = (correctIndices: number[]) =>
      areas.map((area, idx) => ({ area, isCorrect: correctIndices.includes(idx) }));

    const lowScore = evaluateDiagnosticAnswers(makeAnswers([0]), 'individual');
    expect(lowScore.levelLabel).toBe('Principiante');
    expect(lowScore.recommendedCourseIndex).toBe(0);

    const explorerScore = evaluateDiagnosticAnswers(makeAnswers([0, 1, 2, 3]), 'individual');
    expect(explorerScore.levelLabel).toBe('Explorador');
    expect(explorerScore.recommendedCourseIndex).toBe(3);

    const midScore = evaluateDiagnosticAnswers(makeAnswers([0, 1, 2, 3, 4, 5]), 'employee');
    expect(midScore.levelLabel).toBe('Intermedio');
    expect(midScore.recommendedCourseIndex).toBe(6);

    const advScore = evaluateDiagnosticAnswers(
      makeAnswers([0, 1, 2, 3, 4, 5, 6, 7]),
      'employee'
    );
    expect(advScore.levelLabel).toBe('Avanzado');
    expect(advScore.recommendedCourseIndex).toBe(9);
    expect(advScore.weakAreas).toContain('OWASP Top 10 y DevSecOps');
    expect(advScore.weakAreas).toContain('Forense RAM y Threat Hunting');

    const expertScore = evaluateDiagnosticAnswers(
      makeAnswers([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      'tech'
    );
    expect(expertScore.levelLabel).toBe('Experto');
    expect(expertScore.recommendedCourseIndex).toBe(12);

    const missedBasics = evaluateDiagnosticAnswers(
      makeAnswers([2, 3, 4, 5, 6, 7, 8, 9]),
      'tech'
    );
    expect(missedBasics.recommendedCourseIndex).toBeLessThanOrEqual(1);
    expect(missedBasics.levelLabel).toBe('Principiante');
  });

  it('computes real weekly team activity from member activeDates and weekly countdown', () => {
    const monday = new Date('2026-11-23T12:00:00');
    const members = [
      {
        uid: 'u1',
        email: 'a@corp.com',
        displayName: 'Ana',
        role: 'sme_admin',
        isPro: true,
        dailyGoal: 'constante',
        createdAt: '',
        activeDates: ['2026-11-23', '2026-11-16'],
      },
      {
        uid: 'u2',
        email: 'b@corp.com',
        displayName: 'Luis',
        role: 'sme_member',
        isPro: true,
        dailyGoal: 'casual',
        createdAt: '',
        activeDates: ['2026-11-23'],
      },
    ] as UserProfile[];

    const activity = computeRealWeeklyTeamActivity(members, monday);
    expect(activity.labels).toHaveLength(7);
    expect(activity.values[0]).toBe(2);
    expect(activity.totalSessionsThisWeek).toBe(2);
    expect(activity.prevWeekTotal).toBe(1);
    expect(activity.deltaPercent).toBe(100);
    expect(activity.peakDayLabel).toBe('Lunes');

    expect(getWeeklyCountdownLabel(monday)).toMatch(/^Termina en \d+d \d+h \d+m$/);
  });
});
