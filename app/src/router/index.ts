import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';

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
    component: () => import('../views/WelcomeView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterOnboardingView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('../views/RegisterOnboardingView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/tabs',
    component: () => import('../views/TabsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/learn',
      },
      {
        path: 'learn',
        name: 'Learn',
        component: () => import('../views/LearnView.vue'),
      },
      {
        path: 'leaderboard',
        name: 'Leaderboard',
        component: () => import('../views/LeaderboardView.vue'),
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('../views/ShopView.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/ProfileView.vue'),
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
    component: () => import('../views/LessonView.vue'),
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
