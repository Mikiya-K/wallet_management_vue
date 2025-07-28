<template>
  <nav class="app-navbar">
    <div class="navbar-brand">钱包管理系统</div>
    <ul class="navbar-nav">
      <li v-if="isAuthenticated">
        <router-link to="/wallet-management">我的钱包</router-link>
      </li>
      <li v-if="isAdmin">
        <router-link to="/user-management">用户管理</router-link>
      </li>
    </ul>
    <div class="navbar-right">
      <span v-if="isAuthenticated" class="user-info">
        {{ currentUser.email }} ({{
          currentUser.role === "admin" ? "管理员" : "用户"
        }})
      </span>
      <button v-if="isAuthenticated" @click="handleLogout" class="logout-btn">
        退出
      </button>
    </div>
  </nav>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "AppNavbar",
  computed: {
    ...mapGetters(["isAuthenticated", "currentUser", "isAdmin"]),
  },
  methods: {
    async handleLogout() {
      try {
        await this.$store.dispatch("logout");
        this.$router.push("/login");
      } catch (error) {
        console.error("注销失败:", error);
      }
    },
  },
};
</script>

<style scoped>
.app-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.navbar-nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-nav li {
  margin: 0 15px;
}

.navbar-nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.navbar-nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-nav a.router-link-exact-active {
  background-color: #42b983;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  font-size: 0.9rem;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c0392b;
}
</style>
