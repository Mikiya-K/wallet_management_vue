import { createStore } from 'vuex';
import axios from 'axios';

const store = createStore({
    state() {
        const userFromLocal = localStorage.getItem('user');
        const userFromSession = sessionStorage.getItem('user');

        return {
            token: localStorage.getItem('token') || sessionStorage.getItem('token') || null,
            refreshToken: localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || null,
            user: userFromLocal ? JSON.parse(userFromLocal) :
                userFromSession ? JSON.parse(userFromSession) : null
        };
    },
    mutations: {
        setAuth(state, { token, refreshToken, user, rememberMe }) {
            state.token = token;
            state.refreshToken = refreshToken;
            state.user = user;

            if (rememberMe) {
                // 长期存储到 localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));

                // 清除 sessionStorage
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('user');
            } else {
                // 会话存储到 sessionStorage
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('refreshToken', refreshToken);
                sessionStorage.setItem('user', JSON.stringify(user));

                // 清除 localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
        },
        clearAuth(state) {
            state.token = null;
            state.refreshToken = null;
            state.user = null;

            // 清除所有存储
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
        }
    },
    actions: {
        // 新增注册功能
        async register(context, { username, password }) {
            try {
                const response = await axios.post('/api/auth/register', {
                    username,
                    password
                });

                return response;
            } catch (error) {
                // 处理注册错误
                let errorMessage = "Registration failed, please check your details";
                if (error.response) {
                    switch (error.response.status) {
                        case 409:
                            errorMessage = "Username already exists";
                            break;
                        case 400:
                            errorMessage = "Invalid registration data";
                            break;
                        case 500:
                            errorMessage = "Server error. Please try again later";
                            break;
                    }
                } else if (error.request) {
                    errorMessage = "Network error. Please check your connection";
                }
                throw new Error(errorMessage);
            }
        },

        async login({ commit }, { username, password, rememberMe = false }) {
            try {
                const response = await axios.post('/api/auth/login', {
                    username,
                    password
                });

                commit('setAuth', {
                    token: response.data.access_token,
                    refreshToken: response.data.refresh_token,
                    user: response.data.user,
                    rememberMe
                });

                return response;
            } catch (error) {
                commit('clearAuth');
                let errorMessage = "Login failed, please check your credentials";
                if (error.response) {
                    switch (error.response.status) {
                        case 401:
                            errorMessage = "Incorrect username or password";
                            break;
                        case 403:
                            errorMessage = "Account locked. Please reset your password";
                            break;
                        case 429:
                            errorMessage = "Too many attempts. Please try again later";
                            break;
                        case 500:
                            errorMessage = "Server error. Please try again later";
                            break;
                    }
                } else if (error.request) {
                    errorMessage = "Network error. Please check your connection";
                }
                throw new Error(errorMessage);
            }
        },

        async logout({ commit }) {
            // const currentRefreshToken = state.refreshToken; // 固定当前值
            // try {
            //     if (currentRefreshToken) {
            //         await axios.post('/api/auth/logout', {
            //             refreshToken: currentRefreshToken
            //         });
            //     }
            // } catch (error) {
            //     console.error('注销时出错:', error);
            // } finally {
            //     commit('clearAuth');
            // }
            commit('clearAuth');
        },

        async refreshToken({ commit, state }) {
            try {
                const response = await axios.post('/api/auth/refresh', {
                    refreshToken: state.refreshToken
                });

                const rememberMe = localStorage.getItem('token') !== null;

                commit('setAuth', {
                    token: response.data.access_token,
                    refreshToken: response.data.refresh_token,
                    user: state.user,
                    rememberMe
                });

                return response.data.access_token;
            } catch (error) {
                commit('clearAuth');

                // 添加详细错误信息
                let errorMessage = '令牌刷新失败';
                if (error.response?.status === 401) {
                    errorMessage = '刷新令牌已过期';
                }
                throw new Error(errorMessage);
            }
        },

        initializeStore({ commit }) {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

            if (token && refreshToken && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const rememberMe = localStorage.getItem('token') !== null;

                    commit('setAuth', {
                        token,
                        refreshToken,
                        user,
                        rememberMe
                    });
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                    // 清除无效数据
                    commit('clearAuth');
                }
            }
        }
    },
    getters: {
        currentUser: state => state.user || null,
        token: state => state.token || null,
        isAuthenticated: state => !!state.token,
        isAdmin: state => {
            const roles = state.user?.roles || [];
            return Array.isArray(roles) ? roles.includes("admin") : false;
        },
        hasRole: state => roleName => {
            const roles = state.user?.roles || [];
            return Array.isArray(roles) ? roles.includes(roleName) : false;
        },
        rememberMe: () => {
            return localStorage.getItem('token') !== null;
        }
    }
});

export default store;