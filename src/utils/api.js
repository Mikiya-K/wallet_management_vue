import axios from 'axios';
import store from '../store';

const api = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || 'http://168.100.174.146:16002/api',
    timeout: parseInt(process.env.VUE_APP_API_TIMEOUT) || 100000
});

// 刷新令牌处理状态
let isRefreshing = false;
let refreshQueue = [];

// 精确路径匹配函数
const isAuthRequest = (url) => {
    const authPaths = ['/auth/login', '/auth/register', '/auth/refresh'];
    return authPaths.some(path => url.endsWith(path));
};

// 请求拦截器：添加JWT令牌
api.interceptors.request.use(config => {
    const token = store.getters.token;

    if (token && !isAuthRequest(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, error => Promise.reject(error));

// 响应拦截器：处理令牌刷新
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // 检查是否为令牌过期错误
        const isTokenExpired = error.response?.status === 401;
        const isNotRefreshRequest = !isAuthRequest(originalRequest.url);

        // 处理令牌刷新
        if (isTokenExpired && isNotRefreshRequest && !originalRequest._retry) {
            originalRequest._retry = true; // 标记请求已重试

            try {
                // 如果正在刷新，加入队列等待
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        // 存储独立配置副本，避免引用污染
                        refreshQueue.push({
                            resolve: () => resolve(api({ ...originalRequest })), // 创建新配置
                            reject,
                            config: { ...originalRequest } // 深拷贝配置
                        });
                    });
                }

                // 开始刷新令牌
                isRefreshing = true;
                await store.dispatch('refreshToken');

                // 重试原始请求
                const response = await api(originalRequest);

                // 处理队列请求（使用独立配置）
                const queue = [...refreshQueue];
                refreshQueue = []; // 立即清空避免重复

                for (const item of queue) {
                    try {
                        const res = await api(item.config);
                        item.resolve(res);
                    } catch (err) {
                        item.reject(err);
                    }
                }
                return response;
            } catch (refreshError) {
                // 处理队列中的所有等待请求（拒绝）
                refreshQueue.forEach(({ reject }) => reject(refreshError));

                // 刷新失败：清除认证状态
                await store.dispatch('logout');

                // 避免在登录页重定向
                if (!window.location.pathname.includes('login')) {
                    window.location.replace('/login?session=expired');
                }

                return Promise.reject({
                    isSessionExpired: true,
                    message: 'Your session has expired. Please log in again.'
                });
            } finally {
                isRefreshing = false;
                refreshQueue = []; // 清空队列
            }
        }

        // 处理其他错误
        return Promise.reject(error);
    }
);

export default api;
