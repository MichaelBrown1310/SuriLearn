import {
  Badge,
  DiagnosticProfile,
  GAMIFICATION_RULES,
  UserProfile,
} from '../types/gamification';

export interface LeagueTierInfo {
  name: 'Bronce' | 'Plata' | 'Oro' | 'Diamante' | 'Supremo';
  divisionRoman: string;
  nextLeagueName: string;
  nextThresholdXp: number | null;
}

const LEAGUE_TIERS: Array<{
  minXp: number;
  name: LeagueTierInfo['name'];
  divisionRoman: string;
  nextLeagueName: string;
  nextThresholdXp: number | null;
}> = [
  { minXp: 2500, name: 'Supremo', divisionRoman: 'División I', nextLeagueName: 'Liga Centinela Supremo', nextThresholdXp: null },
  { minXp: 1200, name: 'Diamante', divisionRoman: 'División II', nextLeagueName: 'Liga Centinela Supremo', nextThresholdXp: 2500 },
  { minXp: 600, name: 'Oro', divisionRoman: 'División III', nextLeagueName: 'Liga Centinela Diamante', nextThresholdXp: 1200 },
  { minXp: 200, name: 'Plata', divisionRoman: 'División IV', nextLeagueName: 'Liga Centinela Oro', nextThresholdXp: 600 },
  { minXp: 0, name: 'Bronce', divisionRoman: 'División V', nextLeagueName: 'Liga Centinela Plata', nextThresholdXp: 200 },
];

export function computeLeagueFromXp(xp: number): LeagueTierInfo {
  const safeXp = Math.max(0, Number(xp) || 0);
  for (const tier of LEAGUE_TIERS) {
    if (safeXp >= tier.minXp) {
      return {
        name: tier.name,
        divisionRoman: tier.divisionRoman,
        nextLeagueName: tier.nextLeagueName,
        nextThresholdXp: tier.nextThresholdXp,
      };
    }
  }
  return {
    name: 'Bronce',
    divisionRoman: 'División V',
    nextLeagueName: 'Liga Centinela Plata',
    nextThresholdXp: 200,
  };
}

export function computeLessonOutcome(accuracyPercent: number): { passed: boolean; stars: number } {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(accuracyPercent) || 0)));
  const passed = clamped >= GAMIFICATION_RULES.PROGRESSION.MIN_PASS_ACCURACY;
  let stars = 0;
  if (clamped >= 100) stars = 3;
  else if (clamped >= 80) stars = 2;
  else if (passed) stars = 1;
  return { passed, stars };
}

export interface StreakTransitionInput {
  currentStreak: number;
  lastActiveDate: string;
  activeDates: string[];
  hasStreakFreeze: boolean;
  today: string;
  yesterday: string;
}

export interface StreakTransitionResult {
  streakDays: number;
  lastActiveDate: string;
  activeDates: string[];
  hasStreakFreeze: boolean;
  freezeConsumed: boolean;
  streakBitsBonus: number;
}

export function applyStreakTransition(input: StreakTransitionInput): StreakTransitionResult {
  const {
    currentStreak,
    lastActiveDate,
    activeDates,
    hasStreakFreeze,
    today,
    yesterday,
  } = input;

  let nextStreak = currentStreak;
  let nextHasFreeze = hasStreakFreeze;
  let freezeConsumed = false;

  if (currentStreak <= 0) {
    nextStreak = 1;
  } else if (lastActiveDate === today) {
    nextStreak = Math.max(1, currentStreak);
  } else if (lastActiveDate === yesterday) {
    nextStreak = currentStreak + 1;
  } else if (hasStreakFreeze) {
    nextStreak = currentStreak + 1;
    nextHasFreeze = false;
    freezeConsumed = true;
  } else {
    nextStreak = 1;
  }

  const updatedActiveDates = Array.from(
    new Set([...(Array.isArray(activeDates) ? activeDates : []), today])
  );

  let streakBitsBonus = 0;
  if (nextStreak > 0 && nextStreak % 7 === 0 && lastActiveDate !== today) {
    streakBitsBonus = GAMIFICATION_RULES.ECONOMY.BITS_7_DAY_STREAK;
  }

  return {
    streakDays: nextStreak,
    lastActiveDate: today,
    activeDates: updatedActiveDates,
    hasStreakFreeze: nextHasFreeze,
    freezeConsumed,
    streakBitsBonus,
  };
}

export function computePassiveHeartRefill(
  hearts: number,
  lastHeartRefillIso: string,
  isPro: boolean,
  nowMs: number = Date.now()
): { hearts: number; lastHeartRefill: string; hasUpdated: boolean } {
  const maxHearts = GAMIFICATION_RULES.HEARTS.MAX_CAPACITY;

  if (isPro) {
    if (hearts !== maxHearts) {
      return {
        hearts: maxHearts,
        lastHeartRefill: lastHeartRefillIso || new Date(nowMs).toISOString(),
        hasUpdated: true,
      };
    }
    return {
      hearts,
      lastHeartRefill: lastHeartRefillIso || new Date(nowMs).toISOString(),
      hasUpdated: false,
    };
  }

  if (hearts >= maxHearts) {
    return {
      hearts,
      lastHeartRefill: lastHeartRefillIso || new Date(nowMs).toISOString(),
      hasUpdated: false,
    };
  }

  const parsedMs = new Date(lastHeartRefillIso).getTime();
  const lastRefillTime = Number.isNaN(parsedMs) ? nowMs : parsedMs;
  const elapsedMs = Math.max(0, nowMs - lastRefillTime);
  const intervalsPassed = Math.floor(elapsedMs / GAMIFICATION_RULES.HEARTS.REFILL_INTERVAL_MS);

  if (intervalsPassed > 0) {
    const restored = Math.min(maxHearts - hearts, intervalsPassed);
    const updatedHearts = hearts + restored;
    const newRefillTime =
      updatedHearts >= maxHearts
        ? new Date(nowMs).toISOString()
        : new Date(lastRefillTime + intervalsPassed * GAMIFICATION_RULES.HEARTS.REFILL_INTERVAL_MS).toISOString();

    return {
      hearts: updatedHearts,
      lastHeartRefill: newRefillTime,
      hasUpdated: true,
    };
  }

  return {
    hearts,
    lastHeartRefill: lastHeartRefillIso,
    hasUpdated: false,
  };
}

export function computeDynamicBadges(metrics: {
  completedLessons: string[];
  xp: number;
  streakDays: number;
  accuracyRate: number;
  failedExerciseIds?: string[];
}): Badge[] {
  const completed = Array.isArray(metrics.completedLessons) ? metrics.completedLessons : [];
  const totalLessons = completed.length;
  const xp = Math.max(0, Number(metrics.xp) || 0);
  const streak = Math.max(0, Number(metrics.streakDays) || 0);
  const accuracy = Math.max(0, Math.min(100, Number(metrics.accuracyRate) || 0));

  const curso1Ids = new Set([
    'inbox-scanner-1',
    'url-inspector-1',
    'chat-urgency-1',
    'attachment-phish-1',
    'rapid-triage-1',
  ]);
  const curso1Completed = completed.filter((id) => curso1Ids.has(id)).length;
  const hasPasswordVault = completed.includes('password-builder-1') || (totalLessons >= 3 && accuracy >= 80);

  return [
    {
      id: 'b_first_mission',
      code: 'first_mission',
      title: 'Primer Escudo',
      subtitle: totalLessons >= 1 ? 'Primera misión superada' : 'Completa 1 lección',
      iconUrl: 'verified_user',
      level: totalLessons >= 1 ? 1 : 0,
      maxLevel: 1,
      isUnlocked: totalLessons >= 1,
      unlockedAt: totalLessons >= 1 ? 'Desbloqueada' : null,
      progressCurrent: Math.min(1, totalLessons),
      progressTarget: 1,
    },
    {
      id: 'b_phish_hunter',
      code: 'phish_hunter',
      title: 'Cazador Phishing',
      subtitle: curso1Completed > 0 ? `${curso1Completed}/5 del Curso 1` : 'Bloqueado · 0/5 misiones',
      iconUrl: 'phishing',
      level: curso1Completed,
      maxLevel: 5,
      isUnlocked: curso1Completed >= 1,
      unlockedAt: curso1Completed >= 1 ? 'Desbloqueada' : null,
      progressCurrent: curso1Completed,
      progressTarget: 5,
    },
    {
      id: 'b_vault_master',
      code: 'vault_master',
      title: 'Bóveda Blindada',
      subtitle: hasPasswordVault ? 'Entropía NIST dominada' : 'Supera Bóveda de Claves',
      iconUrl: 'lock',
      level: hasPasswordVault ? 1 : 0,
      maxLevel: 1,
      isUnlocked: hasPasswordVault,
      unlockedAt: hasPasswordVault ? 'Desbloqueada' : null,
      progressCurrent: hasPasswordVault ? 1 : 0,
      progressTarget: 1,
    },
    {
      id: 'b_weekly_sentry',
      code: 'weekly_sentry',
      title: 'Vigilante Semanal',
      subtitle: streak >= 7 ? '¡Racha de 7+ días!' : `Progreso: ${Math.min(streak, 7)}/7 días`,
      iconUrl: 'military_tech',
      level: streak >= 7 ? 1 : 0,
      maxLevel: 1,
      isUnlocked: streak >= 7,
      unlockedAt: streak >= 7 ? 'Desbloqueada' : null,
      progressCurrent: Math.min(streak, 7),
      progressTarget: 7,
    },
    {
      id: 'b_xp_sentinel',
      code: 'xp_sentinel',
      title: 'Centinela de Élite',
      subtitle: xp >= 400 ? 'Nivel 2+ alcanzado (400 XP)' : `${Math.min(xp, 400)}/400 XP`,
      iconUrl: 'bolt',
      level: xp >= 400 ? 1 : 0,
      maxLevel: 1,
      isUnlocked: xp >= 400,
      unlockedAt: xp >= 400 ? 'Desbloqueada' : null,
      progressCurrent: Math.min(xp, 400),
      progressTarget: 400,
    },
    {
      id: 'b_zero_errors',
      code: 'zero_errors',
      title: 'Ojo Clínico',
      subtitle:
        totalLessons >= 3 && accuracy >= 90
          ? `${accuracy}% precisión sostenida`
          : `Requiere 3 lecciones & ≥90% (${totalLessons}/3)`,
      iconUrl: 'shield',
      level: totalLessons >= 3 && accuracy >= 90 ? 1 : 0,
      maxLevel: 1,
      isUnlocked: totalLessons >= 3 && accuracy >= 90,
      unlockedAt: totalLessons >= 3 && accuracy >= 90 ? 'Desbloqueada' : null,
      progressCurrent: Math.min(totalLessons, 3),
      progressTarget: 3,
    },
  ];
}

export function getWeeklyCountdownLabel(now: Date = new Date()): string {
  const jsDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilSunday = jsDay === 0 ? 0 : 7 - jsDay;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  const diffMs = Math.max(0, endOfWeek.getTime() - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `Termina en ${days}d ${hours}h ${minutes}m`;
}

export const COURSE_TITLES_15: string[] = [
  'Curso 1: Fundamentos Digitales y Vocabulario Base',
  'Curso 2: Phishing e Ingeniería Social',
  'Curso 3: Contraseñas, MFA y Permisos Móviles',
  'Curso 4: Reflejos Arcade contra Malware',
  'Curso 5: Defensa Perimetral y Bastión Firewall',
  'Curso 6: Redes Seguras, Wi-Fi y Laberinto VPN',
  'Curso 7: Fraude BEC, Vishing y Deepfakes IA',
  'Curso 8: Respuesta a Incidentes SOC y Ransomware',
  'Curso 9: Seguridad Cloud, SaaS y DLP',
  'Curso 10: OWASP Top 10: Inyecciones y XSS',
  'Curso 11: Zero Trust y Blindaje de APIs',
  'Curso 12: Forense Digital y Threat Hunting RAM',
  'Curso 13: Defensa APT y Cadena de Suministro',
  'Curso 14: Gobierno CISO, ISO 27001 y Continuidad',
  'Curso 15: Desafío Maestro Centinela',
];

const DIAGNOSTIC_COURSE_MAP: Record<
  string,
  { index: number; label: string }
> = {
  basics_phishing: { index: 0, label: 'Phishing y Dominios Web' },
  phishing: { index: 0, label: 'Phishing y Dominios Web' },
  social_eng: { index: 1, label: 'Ingeniería Social y Adjuntos' },
  passwords_mfa: { index: 2, label: 'Contraseñas y MFA' },
  mobile_malware: { index: 3, label: 'Permisos Móviles y Malware' },
  firewall_ports: { index: 4, label: 'Puertos y Firewall' },
  crypto_firewall: { index: 4, label: 'Contraseñas y Firewall' },
  network_vpn: { index: 5, label: 'Redes Seguras y VPN' },
  ai_bec: { index: 6, label: 'Fraude BEC y Deepfakes IA' },
  soc_ransomware: { index: 7, label: 'Respuesta SOC y Ransomware' },
  owasp_devsecops: { index: 9, label: 'OWASP Top 10 y DevSecOps' },
  devsecops: { index: 9, label: 'OWASP Top 10 y DevSecOps' },
  forensic_ciso: { index: 11, label: 'Forense RAM y Threat Hunting' },
  forensic: { index: 11, label: 'Forense RAM y Threat Hunting' },
};

export function evaluateDiagnosticAnswers(
  answers: Array<{ area: string; isCorrect: boolean }>,
  profileType: 'individual' | 'employee' | 'tech'
): DiagnosticProfile {
  const totalQuestions = answers.length || 1;
  const score = answers.filter((a) => a.isCorrect).length;
  const weakAreasRaw = answers
    .filter((a) => !a.isCorrect)
    .map((a) => DIAGNOSTIC_COURSE_MAP[a.area]?.label || a.area);
  const weakAreas = Array.from(new Set(weakAreasRaw));

  const ratio = score / totalQuestions;
  let levelLabel: DiagnosticProfile['levelLabel'] = 'Principiante';
  let recommendedCourseIndex = 0;

  if (ratio < 0.3) {
    levelLabel = 'Principiante';
    recommendedCourseIndex = 0;
  } else if (ratio < 0.5) {
    levelLabel = 'Explorador';
    recommendedCourseIndex = 3;
  } else if (ratio < 0.7) {
    levelLabel = 'Intermedio';
    recommendedCourseIndex = 6;
  } else if (ratio < 0.9) {
    levelLabel = 'Avanzado';
    recommendedCourseIndex = 9;
  } else {
    levelLabel = 'Experto';
    recommendedCourseIndex = 12;
  }

  // Pedagogical safeguard: if 10+ questions and first 2 phishing fundamentals failed, cap placement at Curso 2
  if (totalQuestions >= 10 && answers[0]?.isCorrect === false && answers[1]?.isCorrect === false) {
    recommendedCourseIndex = Math.min(recommendedCourseIndex, 1);
    if (recommendedCourseIndex <= 1 && (levelLabel === 'Intermedio' || levelLabel === 'Avanzado' || levelLabel === 'Experto')) {
      levelLabel = 'Principiante';
    }
  }

  const clampedIndex = Math.max(0, Math.min(COURSE_TITLES_15.length - 1, recommendedCourseIndex));

  return {
    completed: true,
    completedAt: new Date().toISOString(),
    score,
    totalQuestions,
    levelLabel,
    recommendedCourseIndex: clampedIndex,
    recommendedCourseTitle: COURSE_TITLES_15[clampedIndex] || COURSE_TITLES_15[0],
    weakAreas,
    profileType,
  };
}

function formatLocalYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface RealWeeklyTeamActivity {
  labels: string[];
  values: number[];
  peakDayLabel: string;
  totalSessionsThisWeek: number;
  prevWeekTotal: number;
  deltaPercent: number | null;
}

export function computeRealWeeklyTeamActivity(
  members: UserProfile[],
  now: Date = new Date()
): RealWeeklyTeamActivity {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const fullDayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const jsDay = now.getDay();
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const thisMonday = new Date(now);
  thisMonday.setHours(12, 0, 0, 0);
  thisMonday.setDate(now.getDate() + diffToMonday);

  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);

  const thisWeekDates: string[] = [];
  const prevWeekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(thisMonday);
    cur.setDate(thisMonday.getDate() + i);
    thisWeekDates.push(formatLocalYmd(cur));

    const prev = new Date(prevMonday);
    prev.setDate(prevMonday.getDate() + i);
    prevWeekDates.push(formatLocalYmd(prev));
  }

  const values = [0, 0, 0, 0, 0, 0, 0];
  let prevWeekTotal = 0;

  for (const member of members) {
    const dates = new Set(Array.isArray(member.activeDates) ? member.activeDates : []);
    thisWeekDates.forEach((dStr, idx) => {
      if (dates.has(dStr)) values[idx] += 1;
    });
    prevWeekDates.forEach((dStr) => {
      if (dates.has(dStr)) prevWeekTotal += 1;
    });
  }

  const totalSessionsThisWeek = values.reduce((acc, v) => acc + v, 0);

  let maxVal = 0;
  let peakIndex = -1;
  values.forEach((v, idx) => {
    if (v > maxVal) {
      maxVal = v;
      peakIndex = idx;
    }
  });

  const peakDayLabel = peakIndex >= 0 ? fullDayNames[peakIndex] : 'Sin actividad aún';
  const deltaPercent =
    prevWeekTotal > 0
      ? Math.round(((totalSessionsThisWeek - prevWeekTotal) / prevWeekTotal) * 100)
      : null;

  return {
    labels,
    values,
    peakDayLabel,
    totalSessionsThisWeek,
    prevWeekTotal,
    deltaPercent,
  };
}
