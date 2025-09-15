<template>
  <nav class="app-navbar">
    <div class="navbar-brand">钱包管理系统</div>
    <ul class="navbar-nav">
      <li
        v-if="isAuthenticated"
        class="nav-item dropdown"
        @mouseleave="closeWalletDropdown"
      >
        <a
          href="#"
          class="nav-link dropdown-toggle"
          @click.prevent="toggleWalletDropdown"
          @mouseenter="openWalletDropdown"
        >
          <i class="fas fa-wallet"></i>
          钱包管理
          <i
            class="fas fa-chevron-down dropdown-icon"
            :class="{ rotated: walletDropdownOpen }"
          ></i>
        </a>
        <ul class="dropdown-menu" :class="{ show: walletDropdownOpen }">
          <li>
            <router-link
              to="/wallet-management"
              class="dropdown-item"
              @click="closeWalletDropdown"
            >
              <i class="fas fa-list"></i>
              钱包列表
            </router-link>
          </li>
          <li>
            <router-link
              to="/miner-registration"
              class="dropdown-item"
              @click="closeWalletDropdown"
            >
              <i class="fas fa-hard-hat"></i>
              矿工注册
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link
              to="/external-wallets"
              class="dropdown-item"
              @click="closeWalletDropdown"
            >
              <i class="fas fa-external-link-alt"></i>
              外部钱包管理
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link
              to="/transfer-history"
              class="dropdown-item"
              @click="closeWalletDropdown"
            >
              <i class="fas fa-history"></i>
              转账记录
            </router-link>
          </li>
        </ul>
      </li>
      <li v-if="isAdmin" class="nav-item">
        <router-link to="/user-management" class="nav-link">
          <i class="fas fa-users"></i>
          用户管理
        </router-link>
      </li>
    </ul>
    <div class="navbar-right">
      <span v-if="isAuthenticated" class="user-info">
        {{ currentUser.email }} ({{ isAdmin ? "管理员" : "用户" }})
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
  data() {
    return {
      walletDropdownOpen: false,
    };
  },
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
    toggleWalletDropdown() {
      this.walletDropdownOpen = !this.walletDropdownOpen;
    },
    openWalletDropdown() {
      this.walletDropdownOpen = true;
    },
    closeWalletDropdown() {
      this.walletDropdownOpen = false;
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

.navbar-nav .nav-item {
  margin: 0 15px;
  position: relative;
}

.navbar-nav .nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-nav .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-nav .nav-link.router-link-exact-active {
  background-color: #42b983;
}

/* 下拉菜单样式 */
.dropdown-toggle {
  cursor: pointer;
}

.dropdown-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-menu li {
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
  border-radius: 0;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #2c3e50;
}

.dropdown-item.router-link-exact-active {
  background-color: #42b983;
  color: white;
}

.dropdown-item i {
  font-size: 14px;
  width: 16px;
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
