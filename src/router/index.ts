import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import SignupPage from '../views/SignupPage.vue';
import ForgotPasswordPage from '../views/ForgotPasswordPage.vue';
import ResetPasswordPage from '../views/ResetPasswordPage.vue';
import HomeLayout from '../views/HomePage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import ChatPage from '../views/ChatPage.vue';
import InsightsPage from '../views/insights/InsightsPage.vue';
import InsightDetailPage from '../views/insights/InsightDetailPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import IntegrationsPage from '../views/IntegrationsPage.vue';

const AUTH_WHITELIST = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
];

function isAuthenticated(): boolean {
    const token = sessionStorage.getItem('access_token');
    if (!token) return false;
    try {
        const base64 = token
            .split('.')[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const payload = JSON.parse(atob(base64)) as Record<string, unknown>;

        if (typeof payload.exp !== 'number') return false;

        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/login', name: 'login', component: LoginPage },
        { path: '/signup', name: 'signup', component: SignupPage },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: ForgotPasswordPage,
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: ResetPasswordPage,
        },
        {
            path: '/',
            component: HomeLayout,
            children: [
                { path: '', redirect: '/home' },
                { path: 'home', name: 'home', component: DashboardPage },
                {
                    path: 'insights',
                    name: 'insights',
                    component: InsightsPage,
                },
                {
                    path: 'insights/:id',
                    name: 'insight-detail',
                    component: InsightDetailPage,
                    props: true,
                },
                { path: 'chat', name: 'chat', component: ChatPage },
                {
                    path: 'settings',
                    name: 'settings',
                    component: SettingsPage,
                },
                {
                    path: 'settings-telegram',
                    name: 'settings-telegram',
                    component: IntegrationsPage,
                },
            ],
        },
    ],
});

router.beforeEach((to, _from, next) => {
    if (AUTH_WHITELIST.includes(to.path)) {
        next();
        return;
    }
    if (!isAuthenticated()) {
        next('/login');
        return;
    }
    next();
});

export default router;
