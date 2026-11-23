<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { UserProfile, Organization } from '../../types/gamification';

import { useTheme } from '../../composables/useTheme';
import { getLocalDateString } from '../../composables/useFirestore';
import { computeRealWeeklyTeamActivity } from '../../utils/gamificationEngine';

Chart.register(...registerables);

const props = defineProps<{
  organization: Organization;
  members: UserProfile[];
}>();

const { isDark } = useTheme();

// Template refs for chart canvases
const riskDoughnutCanvas = ref<HTMLCanvasElement | null>(null);
const weeklyActivityCanvas = ref<HTMLCanvasElement | null>(null);

let riskChartInstance: Chart | null = null;
let weeklyChartInstance: Chart | null = null;

// ==========================================
// 1. KPI COMPUTATIONS
// ==========================================

const usedSeats = computed(() => props.members.length || props.organization.usedSeats || 0);
const maxSeats = computed(() => props.organization.maxSeats || 10);
const seatPercentage = computed(() => {
  if (maxSeats.value === 0) return 0;
  return Math.min(100, Math.round((usedSeats.value / maxSeats.value) * 100));
});

// Digital Health Index (Average Accuracy Rate)
const avgAccuracyRate = computed(() => {
  if (!props.members.length) return 85;
  const sum = props.members.reduce((acc, m) => acc + (m.accuracyRate || 0), 0);
  return Math.round(sum / props.members.length);
});

// Total Completed Lessons across all members
const totalCompletedLessons = computed(() => {
  if (!props.members.length) return 0;
  return props.members.reduce((acc, m) => {
    const count = Array.isArray(m.completedLessons) ? m.completedLessons.length : 0;
    return acc + count;
  }, 0);
});

// Members at Risk (< 60% accuracy or inactive > 7 days)
const membersAtRisk = computed(() => {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  return props.members.filter((m) => {
    // Exclude SME admin from at-risk employee calculation if preferred, or include all
    const accuracy = m.accuracyRate ?? 0;
    const isLowAccuracy = accuracy < 60;

    let isInactive = false;
    const lastActive = m.lastActiveDate || m.lastLoginAt;
    if (lastActive) {
      const lastTime = new Date(lastActive).getTime();
      if (!isNaN(lastTime) && now - lastTime > sevenDaysMs) {
        isInactive = true;
      }
    }
    return isLowAccuracy || isInactive || m.status === 'suspended';
  });
});

// ==========================================
// 2. RISK DISTRIBUTION SEGMENTS
// ==========================================

const riskSegments = computed(() => {
  let safeCount = 0; // >= 80%
  let warningCount = 0; // 60% - 79%
  let dangerCount = 0; // < 60%

  props.members.forEach((m) => {
    const rate = m.accuracyRate ?? 0;
    if (rate >= 80) safeCount++;
    else if (rate >= 60) warningCount++;
    else dangerCount++;
  });

  // If no members yet, show demo distribution
  if (props.members.length === 0) {
    safeCount = 1;
    warningCount = 1;
    dangerCount = 0;
  }

  return { safeCount, warningCount, dangerCount };
});

// ==========================================
// 3. REAL WEEKLY ACTIVITY & CSV EXPORT
// ==========================================

const weeklyActivityData = computed(() => {
  return computeRealWeeklyTeamActivity(props.members);
});

const weeklyDeltaLabel = computed(() => {
  const { totalSessionsThisWeek, prevWeekTotal, deltaPercent } = weeklyActivityData.value;
  if (deltaPercent !== null) {
    const sign = deltaPercent > 0 ? '+' : '';
    return `${sign}${deltaPercent}% vs semana pasada (${prevWeekTotal} prev.)`;
  }
  return `${totalSessionsThisWeek} ${totalSessionsThisWeek === 1 ? 'sesión' : 'sesiones'} esta semana`;
});

function exportTeamReportCsv() {
  const headers = ['Nombre', 'Correo', 'Rol', 'Estado', 'XP', 'Precision_%', 'Nivel_Riesgo', 'Lecciones', 'Racha_Dias'];
  const rows = props.members.map((m) => {
    const acc = m.accuracyRate ?? 0;
    const riskLabel = acc >= 80 ? 'Zona Segura' : acc >= 60 ? 'Precaución' : 'En Riesgo';
    const lessons = Array.isArray(m.completedLessons) ? m.completedLessons.length : 0;
    const cols = [
      m.displayName || 'Centinela',
      m.email || '',
      m.role || 'sme_member',
      m.status || 'active',
      String(m.xp || 0),
      String(acc),
      riskLabel,
      String(lessons),
      String(m.streakDays || 0),
    ];
    return cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-surilearn-${props.organization.id}-${getLocalDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// 4. CHART RENDERING & LIFECYCLE
// ==========================================

function initCharts() {
  if (riskChartInstance) {
    riskChartInstance.destroy();
    riskChartInstance = null;
  }
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
    weeklyChartInstance = null;
  }

  const dark = isDark.value;
  const textColor = dark ? '#D4C3B3' : '#7C746A';
  const borderColor = dark ? '#2B241F' : '#FFFFFF';
  const gridColor = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 166, 83, 0.1)';

  // 1. Doughnut Chart (Risk Distribution)
  if (riskDoughnutCanvas.value) {
    const { safeCount, warningCount, dangerCount } = riskSegments.value;
    riskChartInstance = new Chart(riskDoughnutCanvas.value, {
      type: 'doughnut',
      data: {
        labels: ['Zona Segura (80-100%)', 'Precaución (60-79%)', 'En Riesgo (<60%)'],
        datasets: [
          {
            data: [safeCount, warningCount, dangerCount],
            backgroundColor: ['#22C55E', '#E1A653', '#EF4444'],
            hoverBackgroundColor: ['#16A34A', '#D97706', '#DC2626'],
            borderWidth: 2,
            borderColor: borderColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = safeCount + warningCount + dangerCount;
                const val = Number(context.raw) || 0;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${context.label}: ${val} (${pct}%)`;
              },
            },
          },
        },
        cutout: '72%',
      },
    });
  }

  // 2. Bar Chart (Real Weekly Team Sessions)
  if (weeklyActivityCanvas.value) {
    const { labels, values } = weeklyActivityData.value;
    weeklyChartInstance = new Chart(weeklyActivityCanvas.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Colaboradores Activos',
            data: values,
            backgroundColor: '#E1A653',
            hoverBackgroundColor: '#5F4030',
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const count = Number(context.raw) || 0;
                return ` ${count} ${count === 1 ? 'sesión activa' : 'sesiones activas'}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: 'inherit',
                size: 11,
                weight: 'bold',
              },
              color: textColor,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor,
            },
            ticks: {
              precision: 0,
              font: {
                family: 'inherit',
                size: 10,
              },
              color: textColor,
            },
          },
        },
      },
    });
  }
}

watch(
  () => [props.members, props.organization, isDark.value],
  async () => {
    await nextTick();
    initCharts();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  initCharts();
});

onBeforeUnmount(() => {
  if (riskChartInstance) {
    riskChartInstance.destroy();
    riskChartInstance = null;
  }
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
    weeklyChartInstance = null;
  }
});
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <!-- 4 Global KPI Cards Header: Distribuido en 4 columnas simétricas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <!-- KPI 1: Colaboradores Activos -->
      <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
        <div class="flex items-center justify-between text-on-surface-variant mb-1">
          <span class="text-[11px] font-black uppercase tracking-wider">Colaboradores</span>
          <span class="material-symbols-outlined text-[18px] text-primary">groups</span>
        </div>
        <div class="my-1">
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-on-surface">{{ usedSeats }}</span>
            <span class="text-xs font-bold text-on-surface-variant">/ {{ maxSeats }} cupos</span>
          </div>
          <div class="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
            <div
              class="bg-primary h-full rounded-full transition-all duration-500"
              :style="{ width: `${seatPercentage}%` }"
            ></div>
          </div>
        </div>
        <span class="text-[11px] font-bold text-primary mt-1">
          {{ seatPercentage }}% capacidad utilizada
        </span>
      </div>

      <!-- KPI 2: Índice de Salud Digital -->
      <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
        <div class="flex items-center justify-between text-on-surface-variant mb-1">
          <span class="text-[11px] font-black uppercase tracking-wider">Salud Digital</span>
          <span class="material-symbols-outlined text-[18px] text-[#22C55E]">verified_user</span>
        </div>
        <div class="my-1">
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-on-surface">{{ avgAccuracyRate }}%</span>
            <span class="text-xs font-bold text-on-surface-variant">acierto</span>
          </div>
          <div class="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${avgAccuracyRate}%` }"
              :class="avgAccuracyRate >= 80 ? 'bg-[#22C55E]' : (avgAccuracyRate >= 60 ? 'bg-[#E1A653]' : 'bg-[#EF4444]')"
            ></div>
          </div>
        </div>
        <span class="text-[11px] font-bold text-on-surface-variant mt-1">
          Precisión global del equipo
        </span>
      </div>

      <!-- KPI 3: Total Lecciones Superadas -->
      <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
        <div class="flex items-center justify-between text-on-surface-variant mb-1">
          <span class="text-[11px] font-black uppercase tracking-wider">Lecciones</span>
          <span class="material-symbols-outlined text-[18px] text-tertiary">military_tech</span>
        </div>
        <div class="my-1">
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-on-surface">{{ totalCompletedLessons }}</span>
            <span class="text-xs font-bold text-on-surface-variant">completadas</span>
          </div>
          <div class="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
            <div
              class="bg-tertiary h-full rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, (totalCompletedLessons / Math.max(1, members.length * 6)) * 100)}%` }"
            ></div>
          </div>
        </div>
        <span class="text-[11px] font-bold text-tertiary mt-1">
          Avance colectivo continuo
        </span>
      </div>

      <!-- KPI 4: Colaboradores en Riesgo -->
      <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between transition-all hover:shadow-sm">
        <div class="flex items-center justify-between text-on-surface-variant mb-1">
          <span class="text-[11px] font-black uppercase tracking-wider">En Riesgo</span>
          <span
            class="material-symbols-outlined text-[18px]"
            :class="membersAtRisk.length > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'"
          >
            {{ membersAtRisk.length > 0 ? 'warning' : 'check_circle' }}
          </span>
        </div>
        <div class="my-1">
          <div class="flex items-baseline gap-1">
            <span
              class="text-2xl font-black"
              :class="membersAtRisk.length > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'"
            >
              {{ membersAtRisk.length }}
            </span>
            <span class="text-xs font-bold text-on-surface-variant">colaboradores</span>
          </div>
          <div class="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, (membersAtRisk.length / Math.max(1, members.length)) * 100)}%` }"
              :class="membersAtRisk.length > 0 ? 'bg-[#EF4444]' : 'bg-[#22C55E]'"
            ></div>
          </div>
        </div>
        <span class="text-[11px] font-bold mt-1" :class="membersAtRisk.length > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'">
          {{ membersAtRisk.length > 0 ? '< 60% acierto o inactivos' : 'Todo el equipo protegido' }}
        </span>
      </div>
    </div>

    <!-- 2 Interactive Analytics Charts Section: Lado a lado al 50% de ancho en escritorio -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <!-- Chart 1: Distribución del Nivel de Riesgo (Doughnut) -->
      <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">pie_chart</span>
            </div>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-on-surface">
                Nivel de Riesgo del Personal
              </h3>
              <p class="text-[11px] text-on-surface-variant font-medium">
                Segmentación por tasa de acierto antifraude
              </p>
            </div>
          </div>
          <span class="text-[11px] font-black text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
            {{ members.length }} Centinelas
          </span>
        </div>

        <!-- Doughnut Canvas Container -->
        <div class="relative w-full h-56 flex items-center justify-center my-2">
          <canvas ref="riskDoughnutCanvas"></canvas>
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-2xl font-black text-on-surface">{{ avgAccuracyRate }}%</span>
            <span class="text-[10px] font-bold text-on-surface-variant uppercase">Resiliencia</span>
          </div>
        </div>

        <!-- Doughnut Legend Badges -->
        <div class="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant/30 text-center">
          <div class="flex flex-col items-center p-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span class="text-[10px] font-black text-[#22C55E]">Segura (≥80%)</span>
            </div>
            <span class="text-sm font-black text-on-surface mt-0.5">{{ riskSegments.safeCount }}</span>
          </div>

          <div class="flex flex-col items-center p-1.5 rounded-xl bg-[#E1A653]/10 border border-[#E1A653]/20">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#E1A653]"></span>
              <span class="text-[10px] font-black text-[#E1A653]">Precaución</span>
            </div>
            <span class="text-sm font-black text-on-surface mt-0.5">{{ riskSegments.warningCount }}</span>
          </div>

          <div class="flex flex-col items-center p-1.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#EF4444]"></span>
              <span class="text-[10px] font-black text-[#EF4444]">En Riesgo</span>
            </div>
            <span class="text-sm font-black text-on-surface mt-0.5">{{ riskSegments.dangerCount }}</span>
          </div>
        </div>
      </div>

      <!-- Chart 2: Rendimiento Semanal del Equipo (Bar Chart) -->
      <div class="bg-surface-container-lowest p-4 lg:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">bar_chart</span>
            </div>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-on-surface">
                Rendimiento Semanal del Equipo
              </h3>
              <p class="text-[11px] text-on-surface-variant font-medium">
                Sesiones activas reales por día (Semana en curso)
              </p>
            </div>
          </div>
          <button
            type="button"
            class="text-[11px] font-black text-tertiary px-2.5 py-1 rounded-full bg-tertiary/10 hover:bg-tertiary/20 transition-colors flex items-center gap-1"
            @click="exportTeamReportCsv"
          >
            <span class="material-symbols-outlined text-[14px]">download</span>
            <span>Exportar CSV</span>
          </button>
        </div>

        <!-- Bar Canvas Container -->
        <div class="w-full h-52 my-2">
          <canvas ref="weeklyActivityCanvas"></canvas>
        </div>

        <!-- Footer Metric / Insight (Real Telemetry) -->
        <div class="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2 text-xs text-on-surface-variant flex-wrap">
          <span class="flex items-center gap-1 font-bold">
            <span class="material-symbols-outlined text-[15px] text-primary">insights</span>
            Día pico: <strong class="text-on-surface">{{ weeklyActivityData.peakDayLabel }}</strong>
          </span>
          <span class="text-[11px] font-extrabold text-primary">
            {{ weeklyDeltaLabel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
