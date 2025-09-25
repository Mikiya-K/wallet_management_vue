<template>
  <div class="transfer-history">
    <div class="header">
      <h2>
        <i class="fas fa-history"></i>
        转账记录
      </h2>
      <button
        class="btn btn-secondary refresh-btn"
        @click="fetchTransferHistory"
        :disabled="loading"
      >
        <i
          class="fas"
          :class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"
        ></i>
        刷新
      </button>
    </div>

    <!-- 转账记录列表 -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">操作时间</th>
            <th scope="col">操作人</th>
            <th scope="col">转出钱包</th>
            <th scope="col">转入钱包</th>
            <th scope="col">转账类型</th>
            <th scope="col">数量</th>
            <th scope="col">操作前余额</th>
            <th scope="col">操作后余额</th>
            <th scope="col">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td colspan="9">
              <div class="loading-container">
                <div class="spinner"></div>
                <span>正在加载转账记录...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="transferRecords.length === 0" class="empty-row">
            <td colspan="9">
              <div class="empty-state">
                <i class="fas fa-exchange-alt"></i>
                <h3>暂无转账记录</h3>
                <p>还没有进行过任何转账操作</p>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="record in transferRecords"
            :key="record.id"
            :class="{ 'failed-transfer': record.status === 'failed' }"
          >
            <td class="time-cell">
              <div class="time-display">
                <div class="date">{{ formatDate(record.created_at) }}</div>
                <div class="time">{{ formatTime(record.created_at) }}</div>
              </div>
            </td>
            <td class="operator-cell">{{ record.operator_username }}</td>
            <td class="wallet-cell">
              <div class="wallet-info">
                <div class="wallet-name">{{ record.from_wallet_name }}</div>
                <div class="wallet-address">
                  {{ record.from_wallet_address }}
                </div>
              </div>
            </td>
            <td class="wallet-cell">
              <div class="wallet-info">
                <div class="wallet-name">
                  {{ record.to_wallet_name }}
                  <span
                    v-if="record.transfer_type === 'external'"
                    class="external-badge"
                    >外部</span
                  >
                </div>
                <div class="wallet-address">{{ record.to_wallet_address }}</div>
              </div>
            </td>
            <td class="type-cell">
              <span class="transfer-type" :class="record.transfer_type">
                {{ getTransferTypeText(record.transfer_type) }}
              </span>
            </td>
            <td class="amount-cell">
              <span class="amount">{{ formatAmount(record.amount) }}</span>
            </td>
            <td class="balance-cell">
              <span class="balance">{{
                formatAmount(record.balance_before)
              }}</span>
            </td>
            <td class="balance-cell">
              <span class="balance">{{
                formatAmount(record.balance_after)
              }}</span>
            </td>
            <td class="status-cell">
              <div class="status-container">
                <span class="status-badge" :class="record.status">
                  <i
                    class="fas"
                    :class="
                      record.status === 'success' ? 'fa-check' : 'fa-times'
                    "
                  ></i>
                  {{ getStatusText(record.status) }}
                </span>
                <div
                  v-if="record.status === 'failed' && record.error_message"
                  class="error-details"
                >
                  <button
                    type="button"
                    class="error-toggle"
                    @click="toggleErrorDetails(record.id)"
                    :title="
                      showErrorDetails[record.id]
                        ? '隐藏错误详情'
                        : '显示错误详情'
                    "
                  >
                    <i class="fas fa-info-circle"></i>
                  </button>
                  <div v-if="showErrorDetails[record.id]" class="error-message">
                    {{ record.error_message }}
                  </div>
                </div>
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
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from "vue";
import { useStore } from "vuex";
import api from "@/utils/api";

export default {
  name: "TransferHistory",
  setup() {
    const store = useStore();

    // 响应式数据
    const transferRecords = ref([]);
    const loading = ref(true);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalItems = ref(0);
    const totalPages = ref(1);
    const showErrorDetails = reactive({});

    // 权限检查
    const isAdmin = computed(() => store.getters.isAdmin);

    // 方法
    const fetchTransferHistory = async () => {
      loading.value = true;
      try {
        const response = await api.get("/wallets/transfer-records", {
          params: {
            page: currentPage.value,
            page_size: pageSize.value,
          },
        });

        transferRecords.value = response.data || [];

        // 解析分页头信息
        if (response.headers["x-pagination"]) {
          const pagination = JSON.parse(response.headers["x-pagination"]);
          totalItems.value = pagination.total;
          totalPages.value = pagination.total_pages;
          currentPage.value = pagination.page;
        }
      } catch (error) {
        console.error("获取转账记录失败:", error);
        if (error.response?.status === 401) {
          store.dispatch("logout");
        } else {
          alert("获取转账记录失败，请稍后重试");
        }
        transferRecords.value = [];
        totalItems.value = 0;
        totalPages.value = 1;
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    const formatAmount = (amount) => {
      if (amount === null || amount === undefined) return "-";
      const num = Number(amount);

      // 如果转换后是NaN，说明余额获取失败，显示"获取失败"
      if (isNaN(num)) return "获取失败";

      // 按照钱包管理组件的方式：统一显示6位小数 + TAO单位
      return parseFloat(num).toFixed(6) + " TAO";
    };

    const toggleErrorDetails = (recordId) => {
      showErrorDetails[recordId] = !showErrorDetails[recordId];
    };

    // 转账类型文本
    const getTransferTypeText = (type) => {
      const typeMap = {
        local: "本地转账",
        external: "外部转账",
        stake: "质押",
        unstake: "解质押",
      };
      return typeMap[type] || type;
    };

    // 状态文本
    const getStatusText = (status) => {
      const statusMap = {
        success: "成功",
        failed: "失败",
        pending: "处理中",
      };
      return statusMap[status] || status;
    };

    // 分页方法
    const handlePageSizeChange = () => {
      currentPage.value = 1;
      fetchTransferHistory();
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        fetchTransferHistory();
      }
    };

    // 生命周期
    onMounted(() => {
      fetchTransferHistory();
    });

    return {
      // 数据
      transferRecords,
      loading,
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      showErrorDetails,

      // 权限
      isAdmin,

      // 方法
      fetchTransferHistory,
      formatDate,
      formatTime,
      formatAmount,
      toggleErrorDetails,
      getTransferTypeText,
      getStatusText,
      handlePageSizeChange,
      goToPage,
    };
  },
};
</script>

<style scoped>
.transfer-history {
  padding: 20px;
  max-width: 1400px;
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

.refresh-btn {
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

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.table th {
  background: #f8f9fa;
  padding: 15px 10px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.table td {
  padding: 15px 10px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.table tr.failed-transfer {
  background-color: rgba(220, 53, 69, 0.05);
}

.time-cell {
  min-width: 120px;
}

.time-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.time {
  color: #6c757d;
  font-size: 12px;
}

.operator-cell {
  min-width: 100px;
  font-weight: 500;
  color: #495057;
}

.wallet-cell {
  min-width: 200px;
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wallet-name {
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;
}

.wallet-address {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #6c757d;
  word-break: break-all;
}

.external-badge {
  background: #17a2b8;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.type-cell {
  min-width: 100px;
}

.transfer-type {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.transfer-type.local {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.transfer-type.external {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.transfer-type.stake {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.transfer-type.unstake {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.amount-cell,
.balance-cell {
  min-width: 120px;
  text-align: right;
}

.amount,
.balance {
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #2c3e50;
}

.status-cell {
  min-width: 100px;
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.error-details {
  position: relative;
}

.error-toggle {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.error-toggle:hover {
  background: rgba(220, 53, 69, 0.1);
}

.error-message {
  position: absolute;
  top: 100%;
  right: 0;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  max-width: 300px;
  word-wrap: break-word;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .transfer-history {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }

  .page-controls {
    justify-content: center;
  }
}
</style>
