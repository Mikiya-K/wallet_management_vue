<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">
        <i class="fas fa-users"></i>
        用户管理
      </h1>
      <div class="actions">
        <button class="btn btn-outline" @click="fetchUsers">
          <i class="fas fa-sync-alt"></i> 刷新
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">用户列表</h2>
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            placeholder="搜索用户..."
            v-model="searchQuery"
            @input="debounceSearch"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>钱包数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="4">
                <div class="loading-container">
                  <div class="spinner"></div>
                </div>
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <i class="fas fa-user-slash"></i>
                  <h3>没有找到用户</h3>
                  <p>暂时没有用户数据，请稍后再试</p>
                </div>
              </td>
            </tr>
            <tr v-for="(user, index) in users" :key="`user-${index}`">
              <td>
                <div class="user-info-small">
                  <div class="user-avatar-small">
                    {{ user.name?.charAt(0)?.toUpperCase() || "?" }}
                  </div>
                  <span>{{ user.name || "未命名用户" }}</span>
                </div>
              </td>
              <td>
                <span
                  v-for="(role, roleIndex) in user.roles || []"
                  :key="`role-${index}-${roleIndex}`"
                  :class="`user-role role-${role}`"
                >
                  {{ role }}
                </span>
              </td>
              <td>{{ (user.wallets || []).length }}</td>
              <td>
                <button
                  class="btn btn-sm btn-outline"
                  @click="openUserDetail(user)"
                >
                  <i class="fas fa-eye"></i> 查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <div class="page-info">
          显示 {{ (currentPage - 1) * pageSize + 1 }}-{{
            Math.min(currentPage * pageSize, totalItems)
          }}
          条，共 {{ totalItems }} 条记录
        </div>
        <div class="page-controls">
          <select
            class="page-size-select"
            v-model="pageSize"
            @change="handlePageSizeChange"
          >
            <option :value="5">5条/页</option>
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
          <button
            class="btn btn-outline"
            @click="prevPage"
            :disabled="currentPage === 1"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            class="btn btn-outline"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 用户详情模态框 -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-user"></i>
            用户详细信息
          </h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="error-message" v-if="updateError">
            <i class="fas fa-exclamation-circle"></i> {{ updateError }}
          </div>

          <div class="user-detail-grid">
            <div class="detail-group">
              <span class="detail-label">用户名</span>
              <div class="detail-value">
                {{ selectedUser.name || "未命名用户" }}
              </div>
            </div>
            <div class="detail-group">
              <span class="detail-label">用户ID</span>
              <div class="detail-value">
                {{ selectedUser.id ? `USR-${selectedUser.id}` : "临时用户" }}
              </div>
            </div>
          </div>

          <div class="edit-section">
            <h4 class="edit-title">
              <i class="fas fa-user-tag"></i>
              用户角色
            </h4>

            <div class="roles-container">
              <label
                class="role-item"
                :class="{ selected: editingRoles.includes(role) }"
                v-for="role in availableRoles"
                :key="role"
              >
                <input
                  type="checkbox"
                  :value="role"
                  v-model="editingRoles"
                  style="display: none"
                />
                <i class="fas" :class="roleIcon(role)"></i> {{ role }}
              </label>
            </div>
          </div>

          <div class="edit-section">
            <h4 class="edit-title">
              <i class="fas fa-wallet"></i>
              用户钱包
            </h4>

            <div class="wallets-container">
              <label
                class="wallet-item"
                :class="{ selected: editingWallets.includes(wallet) }"
                v-for="wallet in availableWallets"
                :key="wallet"
              >
                <input
                  type="checkbox"
                  :value="wallet"
                  v-model="editingWallets"
                  style="display: none"
                />
                <i class="fas fa-wallet"></i> {{ wallet }}
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isUpdating"
          >
            <i class="fas fa-times"></i> 取消
          </button>
          <button
            class="btn btn-primary"
            @click="updateUser"
            :disabled="isUpdating"
          >
            <i
              class="fas"
              :class="isUpdating ? 'fa-spinner fa-spin' : 'fa-save'"
            ></i>
            {{ isUpdating ? "更新中..." : "保存更改" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import api from "@/utils/api";

export default {
  name: "UserManagement",
  setup() {
    const store = useStore();

    // 状态管理
    const users = ref([]);
    const isLoading = ref(false);
    const showModal = ref(false);
    const isUpdating = ref(false);
    const updateError = ref("");
    const searchQuery = ref("");
    const searchTimeout = ref(null);

    // 新增：钱包列表状态
    const walletsList = ref([]);
    const isLoadingWallets = ref(false);

    // 分页数据
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalItems = ref(0);
    const totalPages = ref(1);

    // 用户详情数据
    const selectedUser = ref(null);
    const editingRoles = ref([]);
    const editingWallets = ref([]);
    const availableRoles = ref(["admin", "user"]);

    // 修改：使用动态加载的钱包列表
    const availableWallets = ref([]);

    // 计算属性 - 角色图标
    const roleIcon = computed(() => (role) => {
      switch (role) {
        case "admin":
          return "fa-user-cog";
        case "editor":
          return "fa-edit";
        case "analyst":
          return "fa-chart-line";
        default:
          return "fa-user";
      }
    });

    // 生命周期钩子
    onMounted(() => {
      // 检查管理员权限
      if (!store.getters.isAuthenticated || !store.getters.isAdmin) {
        return;
      }
      fetchUsers();
      // 新增：获取钱包列表
      fetchWallets();
    });

    // 新增：获取钱包列表方法
    const fetchWallets = async () => {
      isLoadingWallets.value = true;
      const timestamp = Date.now();

      try {
        const response = await api.get("/wallets", {
          params: {
            _: timestamp,
          },
        });

        // 提取coldkey_name并去重
        const uniqueWallets = [
          ...new Set(
            response.data
              .map((wallet) => wallet.coldkey_name)
              .filter((name) => name)
          ),
        ];

        walletsList.value = uniqueWallets;
        availableWallets.value = uniqueWallets;
      } catch (error) {
        console.error("获取钱包列表失败:", error);
        availableWallets.value = []; // 清空钱包列表
        // 错误处理
        if (error.response?.status === 401) {
          alert("会话已过期，请重新登录");
          store.dispatch("logout");
        } else {
          alert("获取钱包列表失败，请稍后重试");
        }
      } finally {
        isLoadingWallets.value = false;
      }
    };

    // 方法 - 获取用户列表
    const fetchUsers = async () => {
      isLoading.value = true;
      const timestamp = Date.now();

      try {
        const response = await api.get("/users", {
          params: {
            page: currentPage.value,
            page_size: pageSize.value,
            _: timestamp,
          },
        });

        // 修复：正确获取用户数组
        users.value = response.data.users || [];

        console.log("用户数据:", users.value);

        // 解析分页头信息
        if (response.headers["x-pagination"]) {
          const pagination = JSON.parse(response.headers["x-pagination"]);
          totalItems.value = pagination.total;
          totalPages.value = pagination.total_pages;
          currentPage.value = pagination.page;
        }
      } catch (error) {
        console.error("获取用户列表失败:", error);
        // 错误处理
        if (error.response?.status === 401) {
          alert("会话已过期，请重新登录");
          store.dispatch("logout");
        } else {
          alert("获取用户列表失败，请稍后重试");
        }
      } finally {
        isLoading.value = false;
      }
    };

    // 方法 - 搜索用户（防抖）
    const debounceSearch = () => {
      clearTimeout(searchTimeout.value);
      searchTimeout.value = setTimeout(() => {
        currentPage.value = 1;
        fetchUsers();
      }, 500);
    };

    // 方法 - 打开用户详情
    const openUserDetail = (user) => {
      selectedUser.value = {
        ...user,
        // 确保 roles 和 wallets 是数组
        roles: user.roles || [],
        wallets: user.wallets || [],
      };

      // 初始化编辑数据
      editingRoles.value = [...selectedUser.value.roles];
      editingWallets.value = [...selectedUser.value.wallets];

      showModal.value = true;
      updateError.value = "";
    };

    // 方法 - 关闭模态框
    const closeModal = () => {
      if (!isUpdating.value) {
        showModal.value = false;
        selectedUser.value = null;
      }
    };

    // 方法 - 更新用户信息
    const updateUser = async () => {
      isUpdating.value = true;
      updateError.value = "";

      try {
        // 构建符合后端要求的请求体
        const payload = {
          username: selectedUser.value.name,
          roles: editingRoles.value,
          wallets: editingWallets.value,
        };

        // 发送更新请求
        await api.put("/users", payload);

        // 更新成功后关闭模态框
        showModal.value = false;

        // 刷新用户数据
        fetchUsers();
        alert("User updated successfully");
      } catch (error) {
        console.error("User updated failed:", error);
        updateError.value =
          error.response?.data?.message || "User updated failed";
      } finally {
        isUpdating.value = false;
      }
    };

    // 方法 - 下一页
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchUsers();
      }
    };

    // 方法 - 上一页
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchUsers();
      }
    };

    // 方法 - 处理每页显示数量变化
    const handlePageSizeChange = () => {
      currentPage.value = 1;
      fetchUsers();
    };

    return {
      users,
      walletsList,
      isLoading,
      showModal,
      isUpdating,
      updateError,
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      searchQuery,
      selectedUser,
      editingRoles,
      editingWallets,
      availableRoles,
      availableWallets,
      roleIcon,
      fetchUsers,
      debounceSearch,
      openUserDetail,
      closeModal,
      updateUser,
      nextPage,
      prevPage,
      handlePageSizeChange,
    };
  },
};
</script>

<style scoped>
.user-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  color: #4361ee;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 30px;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #212529;
}

.table-container {
  overflow-x: auto;
  padding: 0 20px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  background-color: #f8f9fa;
  text-align: left;
  padding: 16px;
  font-weight: 600;
  color: #6c757d;
  border-bottom: 2px solid #dee2e6;
}

.user-table td {
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.user-table tr:hover {
  background-color: #f8f9fa;
}

.user-info-small {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(45deg, #4361ee, #3f37c9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-role {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-right: 6px;
}

.role-admin {
  background: rgba(67, 97, 238, 0.15);
  color: #4361ee;
}

.role-user {
  background: rgba(76, 201, 240, 0.15);
  color: #2a9d8f;
}

.role-editor {
  background: rgba(248, 150, 30, 0.15);
  color: #f8961e;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-primary:hover {
  background: #3f37c9;
}

.btn-outline {
  background: transparent;
  border: 1px solid #4361ee;
  color: #4361ee;
}

.btn-outline:hover {
  background: rgba(67, 97, 238, 0.1);
}

.btn-secondary {
  background: #f8f9fa;
  color: #212529;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 0.85rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #dee2e6;
  flex-wrap: wrap;
  gap: 15px;
}

.page-info {
  font-size: 0.9rem;
  color: #6c757d;
}

.page-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.page-size-select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: white;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  width: 250px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #212529;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #212529;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px;
}

.user-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.detail-group {
  margin-bottom: 20px;
}

.detail-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #6c757d;
  font-size: 0.9rem;
}

.detail-value {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
}

.edit-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.edit-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.roles-container,
.wallets-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.role-item,
.wallet-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-item.selected,
.wallet-item.selected {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.1);
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(67, 97, 238, 0.3);
  border-radius: 50%;
  border-top-color: #4361ee;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  background: #fff8f8;
  color: #e53e3e;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
  margin-bottom: 20px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #e9ecef;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .user-detail-grid {
    grid-template-columns: 1fr;
  }

  .search-box input {
    width: 200px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .page-controls {
    justify-content: center;
  }
}
</style>
