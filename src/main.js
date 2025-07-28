import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

const app = createApp(App);

app.use(store);
app.use(router);

// 初始化 store 并检查认证状态
store.dispatch('initializeStore').then(() => {
    console.log('Store initialized');
});

// 全局路由守卫 - 增强版
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = store.getters.isAuthenticated;
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

    // 如果用户未认证但访问需要认证的路由
    if (requiresAuth && !isAuthenticated) {
        // 重定向到登录页，并携带原始路径以便登录后重定向
        next({
            name: 'Login',
            query: { redirect: to.fullPath }
        });
        return;
    }

    // 如果用户已认证但访问登录/注册页
    if ((to.name === 'Login' || to.name === 'RegisterForm') && isAuthenticated) {
        // 重定向到首页
        next({ name: 'WalletManagement' });
        return;
    }

    // 如果路由需要管理员权限
    if (requiresAdmin) {
        const isAdmin = store.getters.isAdmin;

        // 如果不是管理员，重定向到错误页面
        if (!isAdmin) {
            next({ name: 'ErrorPage' });
            return;
        }
    }

    // 检查 token 是否即将过期（可选）
    if (isAuthenticated) {
        try {
            // 在实际应用中，这里可以添加 token 过期检查
            // 例如检查 token 剩余有效时间，如果不足则尝试刷新
        } catch (error) {
            console.error('Token check failed:', error);
            // 如果 token 检查失败，执行注销
            await store.dispatch('logout');
            next('/login');
            return;
        }
    }

    next();
});

app.mount('#app');