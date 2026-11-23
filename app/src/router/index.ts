import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import WelcomeView from '../views/WelcomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterOnboardingView from '../views/RegisterOnboardingView.vue';
import TabsLayout from '../views/TabsLayout.vue';
import LearnView from '../views/LearnView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';
import ShopView from '../views/ShopView.vue';
import ProfileView from '../views/ProfileView.vue';
import LessonView from '../views/LessonView.vue';

let authResolved = false;

function waitForAuthUser(): Promise<User | null> {
  if (authResolved) {
    return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        authResolved = true;
        unsubscribe();
        resolve(user);
      },
      () => {
        authResolved = true;
        unsubscribe();
        resolve(null);
      }
    );
  });
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomeView,
    meta: { guestOnly: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterOnboardingView,
    meta: { guestOnly: true },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: RegisterOnboardingView,
    meta: { guestOnly: true },
  },
  {
    path: '/tabs',
    component: TabsLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/learn',
      },
      {
        path: 'learn',
        name: 'Learn',
        component: LearnView,
      },
      {
        path: 'leaderboard',
        name: 'Leaderboard',
        component: LeaderboardView,
      },
      {
        path: 'shop',
        name: 'Shop',
        component: ShopView,
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileView,
      },
      {
        path: 'organization',
        name: 'Organization',
        component: () => import('../views/OrganizationDashboardView.vue'),
      },
    ],
  },
  {
    path: '/organization',
    redirect: '/tabs/organization',
  },
  {
    path: '/admin/dashboard',
    redirect: '/tabs/organization',
  },
  {
    path: '/admin',
    redirect: '/tabs/organization',
  },
  {
    path: '/lesson/:id',
    name: 'Lesson',
    component: LessonView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/welcome',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const user = await waitForAuthUser();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth && !user) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }

  if (guestOnly && user) {
    return '/tabs/learn';
  }

  return true;
});

export default router;
