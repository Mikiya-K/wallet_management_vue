import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

const routes = [
    { path: '/', name: 'Root', redirect: '/login' }, // 添加重定向
    { path: '/login', name: 'Login', component: () => import('../components/LoginForm.vue') },
    { path: '/register', name: 'RegisterForm', component: () => import('../components/RegisterForm.vue') },
    {
        path: '/wallet-management',
        name: 'WalletManagement',
        component: () => import('../components/WalletManagement.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/user-management',
        name: 'UserManagement',
        component: () => import('../components/UserManagement.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    { path: '/:catchAll(.*)', name: 'ErrorPage', component: () => import('../components/ErrorPage.vue') }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = store.getters.isAuthenticated;
    const isAdmin = store.getters.isAdmin;

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        next({ name: 'Login' });
    }
    else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
        next({ name: 'ErrorPage' });
    }
    else {
        next();
    }
});

export default router;