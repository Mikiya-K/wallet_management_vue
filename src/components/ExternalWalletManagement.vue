<template>
  <div class="external-wallet-management">
    <div class="header">
      <h2>
        <i class="fas fa-external-link-alt"></i>
        外部钱包管理
      </h2>
      <button class="btn btn-primary add-btn" @click="openAddModal">
        <i class="fas fa-plus"></i>
        添加外部钱包
      </button>
    </div>

    <!-- 外部钱包列表 -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th scope="col" class="sortable-header">
              <button
                class="sort-button"
                @click="toggleSort('name')"
                :class="{
                  'sort-active': sortField === 'name',
                  'sort-asc': sortField === 'name' && sortDirection === 'asc',
                  'sort-desc': sortField === 'name' && sortDirection === 'desc',
                }"
              >
                钱包备注
                <span class="sort-icon">{{ getSortIcon("name") }}</span>
              </button>
            </th>
            <th scope="col">钱包地址</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td colspan="3">
              <div class="loading-container">
                <div class="spinner"></div>
                <span>正在加载外部钱包列表...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="externalWallets.length === 0" class="empty-row">
            <td colspan="3">
              <div class="empty-state">
                <i class="fas fa-wallet"></i>
                <h3>暂无外部钱包</h3>
                <p>点击上方按钮添加第一个外部钱包</p>
              </div>
            </td>
          </tr>
          <tr v-else v-for="wallet in paginatedWallets" :key="wallet.id">
            <td>{{ wallet.name }}</td>
            <td class="address-cell">
              <span class="address-text">{{ wallet.address }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-sm btn-outline btn-primary"
                  @click="openEditModal(wallet)"
                  :disabled="isDeleting"
                >
                  <i class="fas fa-edit"></i> 编辑
                </button>
                <button
                  class="btn btn-sm btn-outline btn-danger"
                  @click="confirmDeleteWallet(wallet)"
                  :disabled="isDeleting"
                >
                  <i
                    class="fas"
                    :class="isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'"
                  ></i>
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
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
          class="btn btn-sm btn-secondary"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          上一页
        </button>
        <span class="page-number">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="btn btn-sm btn-secondary"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 添加/编辑外部钱包模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-wallet"></i>
            {{ isEditing ? "编辑外部钱包" : "添加外部钱包" }}
          </h3>
          <button
            class="close-btn"
            @click="closeModal"
            :disabled="isSubmitting"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitWallet">
            <div class="form-group">
              <label for="walletName">钱包名称:</label>
              <input
                type="text"
                id="walletName"
                v-model="walletForm.name"
                class="form-control"
                placeholder="请输入钱包名称"
                :disabled="isSubmitting"
                required
              />
            </div>

            <div class="form-group">
              <label for="walletAddress">钱包地址:</label>
              <input
                type="text"
                id="walletAddress"
                v-model="walletForm.address"
                class="form-control"
                :class="{ 'is-invalid': addressError }"
                placeholder="请输入48位钱包地址"
                :disabled="isSubmitting"
                required
                @input="validateAddress"
              />
              <div v-if="addressError" class="invalid-feedback">
                {{ addressError }}
              </div>
            </div>

            <!-- 操作状态提示 -->
            <transition name="fade">
              <div v-if="successMessage" class="success-message">
                <span class="success-icon" aria-hidden="true">✓</span>
                <span>{{ successMessage }}</span>
              </div>
            </transition>

            <transition name="fade">
              <div v-if="errorMessage" class="error-message">
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>{{ errorMessage }}</span>
              </div>
            </transition>
          </form>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isSubmitting"
          >
            <i class="fas fa-times"></i> 取消
          </button>
          <button
            class="btn btn-primary"
            @click="submitWallet"
            :disabled="
              isSubmitting ||
              !!addressError ||
              !walletForm.name.trim() ||
              !walletForm.address.trim()
            "
          >
            <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
            <i v-if="!isSubmitting" class="fas fa-save"></i>
            {{
              isSubmitting
                ? "Processing..."
                : isEditing
                ? "保存更改"
                : "添加钱包"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteConfirmation" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-exclamation-triangle"></i>
            确认删除
          </h3>
        </div>
        <div class="modal-body">
          <p>
            您确定要删除外部钱包
            <strong>"{{ walletToDelete?.name }}"</strong> 吗？
          </p>
          <p class="warning-text">此操作不可撤销！</p>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="cancelDelete"
            :disabled="isDeleting"
          >
            取消
          </button>
          <button
            class="btn btn-danger"
            @click="deleteWallet"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="spinner" aria-hidden="true"></span>
            <i v-if="!isDeleting" class="fas fa-trash"></i>
            {{ isDeleting ? "删除中..." : "确认删除" }}
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
  name: "ExternalWalletManagement",
  setup() {
    const store = useStore();

    // 响应式数据
    const externalWallets = ref([]);
    const loading = ref(true);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalItems = ref(0);

    // 排序状态
    const sortField = ref("name"); // 默认按name排序
    const sortDirection = ref("asc"); // 'asc' | 'desc'

    // 模态框状态
    const showModal = ref(false);
    const isEditing = ref(false);
    const isSubmitting = ref(false);
    const walletForm = ref({
      name: "",
      address: "",
    });
    const editingWallet = ref(null);

    // 删除确认
    const showDeleteConfirmation = ref(false);
    const walletToDelete = ref(null);
    const isDeleting = ref(false);

    // 消息状态
    const successMessage = ref("");
    const errorMessage = ref("");
    const addressError = ref("");

    // 计算属性
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / pageSize.value);
    });

    // 排序后的钱包列表
    const sortedWallets = computed(() => {
      if (!externalWallets.value || externalWallets.value.length === 0) {
        return [];
      }

      const walletsCopy = [...externalWallets.value];

      if (sortField.value === "name") {
        walletsCopy.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();

          if (sortDirection.value === "asc") {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
      }

      return walletsCopy;
    });

    const paginatedWallets = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return sortedWallets.value.slice(start, end);
    });

    // 权限检查
    const isAdmin = computed(() => store.getters.isAdmin);

    // 方法
    const fetchExternalWallets = async () => {
      loading.value = true;
      try {
        const response = await api.get("/wallets/external");
        externalWallets.value = response.data || [];
        totalItems.value = externalWallets.value.length;
      } catch (error) {
        console.error("获取外部钱包列表失败:", error);
        if (error.response?.status === 401) {
          store.dispatch("logout");
        } else {
          alert("获取外部钱包列表失败，请稍后重试");
        }
      } finally {
        loading.value = false;
      }
    };

    const openAddModal = () => {
      isEditing.value = false;
      walletForm.value = { name: "", address: "" };
      editingWallet.value = null;
      showModal.value = true;
      clearMessages();
    };

    const openEditModal = (wallet) => {
      isEditing.value = true;
      walletForm.value = { ...wallet };
      editingWallet.value = wallet;
      showModal.value = true;
      clearMessages();
    };

    const closeModal = () => {
      showModal.value = false;
      walletForm.value = { name: "", address: "" };
      editingWallet.value = null;
      clearMessages();
    };

    const validateAddress = () => {
      const address = walletForm.value.address.trim();

      if (!address) {
        addressError.value = "";
        return;
      }

      // 验证长度
      if (address.length !== 48) {
        addressError.value = "钱包地址必须为48位";
        return;
      }

      // 验证唯一性（编辑时排除自己）
      const isDuplicate = externalWallets.value.some(
        (wallet) =>
          wallet.address === address &&
          (!isEditing.value || wallet.id !== editingWallet.value?.id)
      );

      if (isDuplicate) {
        addressError.value = "该钱包地址已存在";
        return;
      }

      addressError.value = "";
    };

    const submitWallet = async () => {
      // 验证表单
      if (!walletForm.value.name.trim() || !walletForm.value.address.trim()) {
        errorMessage.value = "请填写完整信息";
        return;
      }

      validateAddress();
      if (addressError.value) {
        return;
      }

      isSubmitting.value = true;
      clearMessages();

      try {
        const walletData = {
          name: walletForm.value.name.trim(),
          address: walletForm.value.address.trim(),
        };

        if (isEditing.value) {
          // 编辑外部钱包
          await api.put(
            `/wallets/external/${editingWallet.value.id}`,
            walletData
          );
          successMessage.value = "外部钱包更新成功";
        } else {
          // 添加外部钱包
          await api.post("/wallets/external", walletData);
          successMessage.value = "外部钱包添加成功";
        }

        setTimeout(() => {
          closeModal();
          fetchExternalWallets();
        }, 1500);
      } catch (error) {
        console.error("操作外部钱包失败:", error);
        if (error.response?.status === 401) {
          store.dispatch("logout");
        } else if (error.response?.status === 409) {
          errorMessage.value = "钱包地址已存在";
        } else {
          errorMessage.value =
            error.response?.data?.message || "操作失败，请稍后重试";
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const confirmDeleteWallet = (wallet) => {
      walletToDelete.value = wallet;
      showDeleteConfirmation.value = true;
    };

    const cancelDelete = () => {
      showDeleteConfirmation.value = false;
      walletToDelete.value = null;
    };

    const deleteWallet = async () => {
      if (!walletToDelete.value) return;

      isDeleting.value = true;
      try {
        await api.delete(`/wallets/external/${walletToDelete.value.id}`);
        await fetchExternalWallets();
        showDeleteConfirmation.value = false;
        walletToDelete.value = null;
      } catch (error) {
        console.error("删除外部钱包失败:", error);
        if (error.response?.status === 401) {
          store.dispatch("logout");
        } else {
          alert("删除失败，请稍后重试");
        }
      } finally {
        isDeleting.value = false;
      }
    };

    const clearMessages = () => {
      successMessage.value = "";
      errorMessage.value = "";
      addressError.value = "";
    };

    // 排序方法
    const toggleSort = (field) => {
      if (sortField.value === field) {
        // 如果点击的是当前排序字段，在升序和降序之间切换
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
      } else {
        // 如果点击的是新字段，设置为升序
        sortField.value = field;
        sortDirection.value = "asc";
      }
    };

    const getSortIcon = (field) => {
      if (sortField.value !== field) {
        return "↕️"; // 默认双向箭头
      }
      return sortDirection.value === "asc" ? "↑" : "↓";
    };

    // 分页方法
    const handlePageSizeChange = () => {
      currentPage.value = 1;
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };

    // 生命周期
    onMounted(() => {
      if (isAdmin.value) {
        fetchExternalWallets();
      }
    });

    return {
      // 数据
      externalWallets,
      loading,
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      sortedWallets,
      paginatedWallets,

      // 排序
      sortField,
      sortDirection,

      // 模态框
      showModal,
      isEditing,
      isSubmitting,
      walletForm,
      editingWallet,

      // 删除
      showDeleteConfirmation,
      walletToDelete,
      isDeleting,

      // 消息
      successMessage,
      errorMessage,
      addressError,

      // 权限
      isAdmin,

      // 方法
      fetchExternalWallets,
      openAddModal,
      openEditModal,
      closeModal,
      validateAddress,
      submitWallet,
      confirmDeleteWallet,
      cancelDelete,
      deleteWallet,
      toggleSort,
      getSortIcon,
      handlePageSizeChange,
      goToPage,
    };
  },
};
</script>

<style scoped>
.external-wallet-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header h2 i {
  font-size: 1.5rem;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.sortable-header {
  padding: 0 !important;
}

.sort-button {
  background: none;
  border: none;
  padding: 15px;
  width: 100%;
  text-align: left;
  font-weight: 600;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.sort-button:hover {
  background: rgba(67, 97, 238, 0.1);
  color: #4361ee;
}

.sort-button.sort-active {
  color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.sort-icon {
  font-size: 12px;
  margin-left: 5px;
  opacity: 0.7;
}

.sort-button.sort-active .sort-icon {
  opacity: 1;
}

.table td {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.address-cell {
  font-family: "Courier New", monospace;
  font-size: 12px;
  max-width: 300px;
}

.address-text {
  word-break: break-all;
  color: #6c757d;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3730a3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline {
  background: transparent;
  border: 1px solid;
}

.btn-outline.btn-primary {
  color: #4361ee;
  border-color: #4361ee;
}

.btn-outline.btn-primary:hover:not(:disabled) {
  background: #4361ee;
  color: white;
}

.btn-outline.btn-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline.btn-danger:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.loading-row td,
.empty-row td {
  text-align: center;
  padding: 40px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #6c757d;
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

.empty-state {
  text-align: center;
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

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.page-info {
  color: #6c757d;
  font-size: 14px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-size-select {
  padding: 5px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.page-number {
  font-weight: 600;
  color: #495057;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover:not(:disabled) {
  color: #495057;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.success-message,
.error-message {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.warning-text {
  color: #856404;
  font-size: 14px;
  margin-top: 10px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
