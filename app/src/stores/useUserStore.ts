/**
 * Pinia Store: User Authentication & Profile
 * SuriLearn - Reactive Identity Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase/config';
import { useFirestore } from '../composables/useFirestore';
import { useGamificationStore } from './useGamificationStore';
import {
  UserProfile,
  DailyGoalType,
  DAILY_GOAL_CONFIGS,
  DiagnosticProfile,
  Organization,
  OrganizationPlan,
} from '../types/gamification';
import { translateAuthError } from '../utils/authErrors';

export { translateAuthError };

export const useUserStore = defineStore('user', () => {
  const firestore = useFirestore();
  let authUnsubscribe: (() => void) | null = null;
  let profileUnsubscribe: (() => void) | null = null;

  // State: Initialized to clean zero-baseline, never mock data
  const currentUser = ref<FirebaseUser | null>(null);
  const profile = ref<UserProfile>({
    uid: '',
    email: '',
    displayName: '',
    photoURL: null,
    avatarUrl: 'suri-idle.png',
    companyName: '',
    isPro: false,
    proExpiresAt: null,
    dailyGoal: 'constante',
    currentLeague: 'Bronce',
    accuracyRate: 0,
    completedLessons: [],
    hearts: 5,
    xp: 0,
    bits: 0,
    streakDays: 0,
    claimedRewards: [],
    failedExerciseIds: [],
    dailyLessonsCompleted: 0,
    dailyLessonsDate: '',
    lessonStars: {},
    diagnosticProfile: null,
    notificationsEnabled: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    role: 'individual',
    status: 'active',
  });

  const isLoading = ref<boolean>(false);
  const authError = ref<string | null>(null);
  const isAuthInitialized = ref<boolean>(false);
  const currentOrganization = ref<Organization | null>(null);
  const organizationMembers = ref<UserProfile[]>([]);

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value && profile.value.uid !== '');
  const isPro = computed(() => profile.value.isPro);
  const currentDailyGoal = computed(() => profile.value.dailyGoal);
  const hasOrganization = computed(() => !!profile.value.organizationId || !!currentOrganization.value);
  const isSmeAdmin = computed(() => profile.value.role === 'sme_admin');
  const isSmeMember = computed(() => profile.value.role === 'sme_member');
  const isSuspended = computed(() => profile.value.status === 'suspended');
  const userOrganizationName = computed(() => currentOrganization.value?.name || profile.value.companyName || 'Sin Empresa');
  const userInitials = computed(() => {
    const name = profile.value.displayName || currentUser.value?.displayName || 'Centinela';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  const claimedRewards = computed(() => profile.value.claimedRewards || []);

  function isRewardClaimed(rewardId: string): boolean {
    const list = profile.value.claimedRewards || [];
    return (
      list.includes(rewardId) ||
      (rewardId === 'chest_01' && list.includes('unit_1_completion_chest')) ||
      (rewardId === 'unit_1_completion_chest' && list.includes('chest_01'))
    );
  }

  // Actions
  async function loadProfile(uid: string) {
    try {
      isLoading.value = true;
      const userDoc = await firestore.getUserProfile(uid);
      profile.value = userDoc;
      if (userDoc.organizationId) {
        await loadOrganization(userDoc.organizationId);
      }
    } catch (err: any) {
      console.warn('[useUserStore] Could not load profile:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loginWithEmail(email: string, pass: string): Promise<boolean> {
    try {
      isLoading.value = true;
      authError.value = null;
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      currentUser.value = cred.user;
      const userDoc = await firestore.ensureUserDocument(cred.user);
      profile.value = userDoc;
      if (userDoc.organizationId) {
        await loadOrganization(userDoc.organizationId);
      }
      const gamStore = useGamificationStore();
      await gamStore.loadGamificationData(cred.user.uid);
      return true;
    } catch (err: any) {
      console.warn('[useUserStore] Firebase Auth login fallback:', err.message);
      authError.value = translateAuthError(err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function registerWithEmail(
    email: string,
    pass: string,
    displayName: string,
    dailyGoal: DailyGoalType = 'constante',
    companyName = ''
  ): Promise<boolean> {
    try {
      isLoading.value = true;
      authError.value = null;

      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      currentUser.value = cred.user;

      const userDoc = await firestore.ensureUserDocument({
        uid: cred.user.uid,
        displayName: displayName || cred.user.displayName || 'Centinela',
        email: cred.user.email || email,
        photoURL: null,
      });

      profile.value = {
        ...userDoc,
        displayName: displayName || userDoc.displayName,
        companyName,
        dailyGoal,
      };

      await firestore.saveUserProfile(cred.user.uid, profile.value);
      const gamStore = useGamificationStore();
      await gamStore.loadGamificationData(cred.user.uid);
      return true;
    } catch (err: any) {
      authError.value = translateAuthError(err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function loginWithGoogle(): Promise<boolean> {
    try {
      isLoading.value = true;
      authError.value = null;
      const cred = await signInWithPopup(auth, googleAuthProvider);
      currentUser.value = cred.user;

      // Ensure user document exists in Firestore or create with 0-baseline
      const userProfile = await firestore.ensureUserDocument(cred.user);
      profile.value = userProfile;
      if (userProfile.organizationId) {
        await loadOrganization(userProfile.organizationId);
      }

      // Sync gamification store
      const gamStore = useGamificationStore();
      await gamStore.loadGamificationData(cred.user.uid);

      return true;
    } catch (err: any) {
      console.error('[useUserStore] Google Sign-In error:', err);
      authError.value = translateAuthError(err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (profileUnsubscribe) {
      profileUnsubscribe();
      profileUnsubscribe = null;
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[useUserStore] Error on signOut:', err);
    }
    currentUser.value = null;
    currentOrganization.value = null;
    organizationMembers.value = [];
    profile.value = {
      uid: '',
      email: '',
      displayName: '',
      photoURL: null,
      avatarUrl: 'suri-idle.png',
      companyName: '',
      organizationId: undefined,
      isPro: false,
      proExpiresAt: null,
      dailyGoal: 'constante',
      currentLeague: 'Bronce',
      accuracyRate: 0,
      completedLessons: [],
      hearts: 5,
      xp: 0,
      bits: 0,
      streakDays: 0,
      claimedRewards: [],
      failedExerciseIds: [],
      dailyLessonsCompleted: 0,
      dailyLessonsDate: '',
      lessonStars: {},
      diagnosticProfile: null,
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'individual',
      status: 'active',
    };
    try {
      localStorage.clear();
    } catch {}
  }

  async function setDailyGoal(goal: DailyGoalType): Promise<void> {
    profile.value.dailyGoal = goal;
    if (profile.value.uid) {
      await firestore.saveUserProfile(profile.value.uid, { dailyGoal: goal });
    }
    const cfg = DAILY_GOAL_CONFIGS[goal];
    const gamStore = useGamificationStore();
    gamStore.showToast(`Meta diaria actualizada: ${cfg.title} (${cfg.description})`, true);
  }

  async function saveDiagnosticProfile(diag: DiagnosticProfile): Promise<void> {
    profile.value.diagnosticProfile = diag;
    if (profile.value.uid) {
      await firestore.saveUserProfile(profile.value.uid, { diagnosticProfile: diag });
    }
    const gamStore = useGamificationStore();
    await gamStore.refreshLearningUnits();
    gamStore.showToast(`Ruta adaptativa guardada · ${diag.recommendedCourseTitle}`, true);
  }

  async function setNotificationsEnabled(enabled: boolean): Promise<void> {
    profile.value.notificationsEnabled = enabled;
    if (profile.value.uid) {
      await firestore.saveUserProfile(profile.value.uid, { notificationsEnabled: enabled });
    }
    const gamStore = useGamificationStore();
    gamStore.showToast(
      enabled
        ? 'Alertas y recordatorios de racha activados.'
        : 'Recordatorios de racha silenciados.',
      true
    );
  }

  function initAuthObserver() {
    if (authUnsubscribe) return;
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      currentUser.value = user;
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (user) {
        const userDoc = await firestore.ensureUserDocument(user);
        profile.value = userDoc;
        if (userDoc.organizationId) {
          await loadOrganization(userDoc.organizationId);
        }
        const gamStore = useGamificationStore();
        await gamStore.loadGamificationData(user.uid);

        // Subscribe to real-time profile updates for immediate RN-08 suspension enforcement
        profileUnsubscribe = firestore.subscribeToUserProfile(user.uid, (partial) => {
          profile.value = {
            ...profile.value,
            ...partial,
          };
        });
      } else {
        currentOrganization.value = null;
        organizationMembers.value = [];
        profile.value = {
          uid: '',
          email: '',
          displayName: '',
          photoURL: null,
          avatarUrl: 'suri-idle.png',
          companyName: '',
          organizationId: undefined,
          isPro: false,
          proExpiresAt: null,
          dailyGoal: 'constante',
          currentLeague: 'Bronce',
          accuracyRate: 0,
          completedLessons: [],
          hearts: 5,
          xp: 0,
          bits: 0,
          streakDays: 0,
          claimedRewards: [],
          failedExerciseIds: [],
          dailyLessonsCompleted: 0,
          dailyLessonsDate: '',
          lessonStars: {},
          diagnosticProfile: null,
          notificationsEnabled: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: 'individual',
          status: 'active',
        };
      }
      isAuthInitialized.value = true;
    });
  }

  async function activateProMembership(plan: 'monthly' | 'annual' = 'monthly'): Promise<boolean> {
    const uid = profile.value.uid || currentUser.value?.uid;
    if (!uid) return false;

    try {
      isLoading.value = true;
      const expiresDate = new Date();
      if (plan === 'annual') {
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
      } else {
        expiresDate.setMonth(expiresDate.getMonth() + 1);
      }

      const updates = {
        isPro: true,
        proPlan: plan,
        proExpiresAt: expiresDate.toISOString(),
        hearts: 5,
      };

      profile.value.isPro = true;
      profile.value.proExpiresAt = expiresDate.toISOString();
      profile.value.hearts = 5;

      await firestore.saveUserProfile(uid, updates);
      await firestore.saveGamificationState(uid, {
        hearts: 5,
      });

      const gamStore = useGamificationStore();
      gamStore.state.hearts = 5;

      return true;
    } catch (err: any) {
      console.error('[useUserStore] Error activating Pro membership:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function claimChestReward(rewardId: string, bitsReward = 50, xpReward = 0): Promise<boolean> {
    const uid = profile.value.uid || currentUser.value?.uid;
    if (!uid) return false;

    if (isRewardClaimed(rewardId)) {
      return false;
    }

    try {
      const res = await firestore.claimReward(uid, rewardId, { bits: bitsReward, xp: xpReward });
      if (res.success) {
        profile.value.claimedRewards = res.claimedRewards;
        profile.value.bits = res.updatedBits;
        profile.value.xp = res.updatedXp;

        const gamStore = useGamificationStore();
        gamStore.state.bits = res.updatedBits;
        gamStore.state.xp = res.updatedXp;
        gamStore.state.claimedRewards = res.claimedRewards;

        // Re-evaluate units with claimed rewards
        gamStore.units = await firestore.getLearningUnits(
          gamStore.state.completedLessons || [],
          res.claimedRewards
        );

        gamStore.showToast(res.message, true);
        return true;
      } else {
        if (res.alreadyClaimed) {
          profile.value.claimedRewards = res.claimedRewards || [...(profile.value.claimedRewards || []), rewardId];
          const gamStore = useGamificationStore();
          gamStore.showToast('Esta recompensa ya fue reclamada.', true);
        }
        return false;
      }
    } catch (err: any) {
      console.warn('[useUserStore] Error claiming chest reward:', err);
      return false;
    }
  }

  async function loadOrganization(orgId?: string) {
    const targetId = orgId || profile.value.organizationId;
    if (!targetId) {
      currentOrganization.value = null;
      organizationMembers.value = [];
      return;
    }
    try {
      const org = await firestore.getOrganization(targetId);
      currentOrganization.value = org;
      if (org) {
        organizationMembers.value = await firestore.getOrganizationMembers(org.id);
      }
    } catch (err) {
      console.warn('[useUserStore] Error loading organization:', err);
    }
  }

  async function joinOrganizationByCode(inviteCode: string): Promise<{ success: boolean; message: string }> {
    const uid = profile.value.uid || currentUser.value?.uid;
    if (!uid) {
      return { success: false, message: 'Debes iniciar sesión para unirte a una organización.' };
    }
    const res = await firestore.joinOrganizationWithCode(uid, inviteCode);
    if (res.success && res.organization) {
      profile.value.organizationId = res.organization.id;
      profile.value.companyName = res.organization.name;
      profile.value.role = 'sme_member';
      profile.value.isPro = true;
      currentOrganization.value = res.organization;
      organizationMembers.value = await firestore.getOrganizationMembers(res.organization.id);
      const gamStore = useGamificationStore();
      gamStore.showToast(res.message, true);
    }
    return res;
  }

  async function createNewOrganization(
    name: string,
    plan: OrganizationPlan = 'micro_pyme'
  ): Promise<{ success: boolean; message: string; organization?: Organization }> {
    const uid = profile.value.uid || currentUser.value?.uid;
    const email = profile.value.email || currentUser.value?.email;
    if (!uid || !email) {
      return { success: false, message: 'Usuario no autenticado.' };
    }
    try {
      const newOrg = await firestore.createOrganization({
        name,
        adminEmail: email,
        adminUid: uid,
        plan,
        maxSeats: plan === 'enterprise' ? 100 : (plan === 'growth_pyme' ? 30 : 10),
      });
      profile.value.organizationId = newOrg.id;
      profile.value.companyName = newOrg.name;
      profile.value.role = 'sme_admin';
      profile.value.isPro = true;
      currentOrganization.value = newOrg;
      organizationMembers.value = [profile.value];
      const gamStore = useGamificationStore();
      gamStore.showToast(`¡Organización ${newOrg.name} creada! Código: ${newOrg.inviteCode}`, true);
      return { success: true, message: `¡Organización ${newOrg.name} creada exitosamente!`, organization: newOrg };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al crear la organización.' };
    }
  }

  async function toggleMemberStatus(memberUid: string): Promise<{ success: boolean; message: string }> {
    const member = organizationMembers.value.find((m) => m.uid === memberUid);
    if (!member) return { success: false, message: 'Colaborador no encontrado.' };

    const newStatus: 'active' | 'suspended' = member.status === 'suspended' ? 'active' : 'suspended';
    const res = await firestore.updateUserStatus(memberUid, newStatus);
    if (res.success) {
      member.status = newStatus;
      member.suspendedAt = newStatus === 'suspended' ? new Date().toISOString() : null;
      if (profile.value.uid === memberUid) {
        profile.value.status = newStatus;
      }
      const gamStore = useGamificationStore();
      gamStore.showToast(res.message, true);
    }
    return res;
  }

  async function removeMemberFromOrg(orgId: string, memberUid: string): Promise<{ success: boolean; message: string }> {
    const res = await firestore.removeMemberFromOrganization(orgId, memberUid);
    if (res.success) {
      organizationMembers.value = organizationMembers.value.filter((m) => m.uid !== memberUid);
      if (currentOrganization.value && currentOrganization.value.usedSeats > 0) {
        currentOrganization.value.usedSeats -= 1;
      }
      const gamStore = useGamificationStore();
      gamStore.showToast(res.message, true);
    }
    return res;
  }

  return {
    currentUser,
    profile,
    isLoading,
    authError,
    isAuthInitialized,
    isAuthenticated,
    isPro,
    currentDailyGoal,
    userInitials,
    claimedRewards,
    isRewardClaimed,
    claimChestReward,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    setDailyGoal,
    saveDiagnosticProfile,
    setNotificationsEnabled,
    initAuthObserver,
    activateProMembership,
    currentOrganization,
    organizationMembers,
    hasOrganization,
    isSmeAdmin,
    isSmeMember,
    isSuspended,
    userOrganizationName,
    loadProfile,
    loadOrganization,
    joinOrganizationByCode,
    createNewOrganization,
    toggleMemberStatus,
    removeMemberFromOrg,
  };
});
