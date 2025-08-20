<template>
  <div class="wallet-management-container">
    <!-- 标题和操作按钮 -->
    <div class="header-section">
      <h1>Wallet Management</h1>
      <div class="action-buttons">
        <button class="transfer-btn" @click="openTransferModal">
          Transfer
        </button>
        <button class="remove-btn" @click="openRemoveModal">
          Remove Stake
        </button>
      </div>
    </div>

    <!-- 钱包表格 -->
    <div class="wallet-table-container">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading wallet data...</p>
      </div>

      <div v-else>
        <div class="wallet-count-info">
          Showing all {{ allWallets.length }} wallets
        </div>

        <div class="table-scroll-container">
          <table
            class="wallet-table"
            aria-describedby="wallet-table-description"
          >
            <caption id="wallet-table-description" class="sr-only">
              List of wallets with their balances
            </caption>
            <thead>
              <tr>
                <th scope="col">Coldkey Name</th>
                <th scope="col">Coldkey Address</th>
                <th scope="col">Free Balance</th>
                <th scope="col">Staked Balance</th>
                <th scope="col">Total Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wallet in allWallets" :key="wallet.coldkey_name">
                <td>{{ wallet.coldkey_name }}</td>
                <td class="address-cell">{{ wallet.coldkey_address }}</td>
                <td class="balance-cell">{{ formatBalance(wallet.free) }}</td>
                <td class="balance-cell">{{ formatBalance(wallet.staked) }}</td>
                <td class="balance-cell total">
                  {{ formatBalance(wallet.total) }}
                </td>
              </tr>
            </tbody>
            <!-- 合计行 -->
            <tfoot v-if="allWallets.length > 0">
              <tr class="summary-row">
                <td class="summary-label" colspan="2">
                  <strong>Total ({{ allWallets.length }} wallets)</strong>
                </td>
                <td class="balance-cell summary-balance">
                  <strong>{{ formatBalance(totalSums.totalFree) }}</strong>
                </td>
                <td class="balance-cell summary-balance">
                  <strong>{{ formatBalance(totalSums.totalStaked) }}</strong>
                </td>
                <td class="balance-cell summary-balance total">
                  <strong>{{ formatBalance(totalSums.totalBalance) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="allWallets.length === 0" class="no-data">
          <p>No wallet data available</p>
        </div>
      </div>
    </div>

    <!-- Transfer模态框 -->
    <div v-if="transferModalVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Transfer Funds</h2>
          <button
            class="close-btn"
            @click="closeTransferModal"
            aria-label="Close transfer modal"
            :disabled="transferLoading"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitTransfer">
            <div class="form-group">
              <label for="fromWallet">From Wallet:</label>
              <select
                id="fromWallet"
                v-model="transferForm.alias"
                required
                @change="updateFromWalletDetails"
                :disabled="transferLoading"
              >
                <option
                  v-for="wallet in allWallets"
                  :key="'from-' + wallet.coldkey_name"
                  :value="wallet.coldkey_name"
                >
                  {{ wallet.coldkey_name }} ({{ formatBalance(wallet.free) }}
                  available)
                </option>
              </select>
              <div v-if="selectedFromWallet" class="wallet-details">
                <p>Address: {{ selectedFromWallet.coldkey_address }}</p>
                <p>Available: {{ formatBalance(selectedFromWallet.free) }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="toWallet">To Wallet:</label>
              <select
                id="toWallet"
                v-model="transferForm.to"
                required
                @change="updateToWalletDetails"
                :disabled="transferLoading"
              >
                <option
                  v-for="wallet in allWallets"
                  :key="'to-' + wallet.coldkey_name"
                  :value="wallet.coldkey_name"
                >
                  {{ wallet.coldkey_name }}
                </option>
              </select>
              <div v-if="selectedToWallet" class="wallet-details">
                <p>Address: {{ selectedToWallet.coldkey_address }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="amount">Amount:</label>
              <input
                type="number"
                id="amount"
                v-model.number="transferForm.amount"
                min="0.000001"
                step="0.000001"
                required
                :max="selectedFromWallet ? selectedFromWallet.free : 0"
                :disabled="transferLoading"
              />
              <div class="amount-info">
                <p v-if="transferForm.amount > 0">
                  {{ formatBalance(transferForm.amount) }} will be transferred
                </p>
                <p v-if="transferForm.amount > 0 && selectedFromWallet">
                  Remaining balance:
                  {{
                    formatBalance(selectedFromWallet.free - transferForm.amount)
                  }}
                </p>
              </div>
            </div>

            <!-- Transfer操作状态提示 -->
            <transition name="fade">
              <div v-if="transferSuccessMessage" class="success-message">
                <span class="success-icon" aria-hidden="true">✓</span>
                <span>{{ transferSuccessMessage }}</span>
              </div>
            </transition>

            <transition name="fade">
              <div v-if="transferErrorMessage" class="error-message">
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>{{ transferErrorMessage }}</span>
              </div>
            </transition>

            <div class="form-actions">
              <button
                type="button"
                @click="closeTransferModal"
                :disabled="transferLoading"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="
                  transferLoading ||
                  transferForm.amount <= 0 ||
                  transferForm.amount > (selectedFromWallet?.free || 0)
                "
              >
                <span
                  v-if="transferLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{
                  transferLoading ? "Processing..." : "Confirm Transfer"
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Remove Stake模态框 -->
    <div v-if="removeModalVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Remove Stake</h2>
          <button
            class="close-btn"
            @click="closeRemoveModal"
            aria-label="Close remove stake modal"
            :disabled="removeLoading"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitRemoveStake">
            <div class="form-group">
              <label for="wallet">Select Wallet:</label>
              <select
                id="wallet"
                v-model="removeForm.wallet"
                required
                @change="updateSelectedWalletDetails"
                :disabled="removeLoading"
              >
                <option
                  v-for="wallet in allWallets"
                  :key="'remove-' + wallet.coldkey_name"
                  :value="wallet.coldkey_name"
                >
                  {{ wallet.coldkey_name }} ({{ formatBalance(wallet.staked) }}
                  staked)
                </option>
              </select>
              <div v-if="selectedWallet" class="wallet-details">
                <p>Address: {{ selectedWallet.coldkey_address }}</p>
                <p>Staked: {{ formatBalance(selectedWallet.staked) }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="removeAmount">Amount to Remove:</label>
              <input
                type="number"
                id="removeAmount"
                v-model.number="removeForm.amount"
                min="0.000001"
                step="0.000001"
                required
                :max="selectedWallet ? selectedWallet.staked : 0"
                :disabled="removeLoading"
              />
              <div class="amount-info">
                <p v-if="removeForm.amount > 0">
                  {{ formatBalance(removeForm.amount) }} will be removed from
                  stake
                </p>
                <p v-if="removeForm.amount > 0 && selectedWallet">
                  Remaining stake:
                  {{ formatBalance(selectedWallet.staked - removeForm.amount) }}
                </p>
              </div>
            </div>

            <!-- Remove Stake操作状态提示 -->
            <transition name="fade">
              <div v-if="removeSuccessMessage" class="success-message">
                <span class="success-icon" aria-hidden="true">✓</span>
                <span>{{ removeSuccessMessage }}</span>
              </div>
            </transition>

            <transition name="fade">
              <div v-if="removeErrorMessage" class="error-message">
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>{{ removeErrorMessage }}</span>
              </div>
            </transition>

            <div class="form-actions">
              <button
                type="button"
                @click="closeRemoveModal"
                :disabled="removeLoading"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="
                  removeLoading ||
                  removeForm.amount <= 0 ||
                  removeForm.amount > (selectedWallet?.staked || 0)
                "
              >
                <span
                  v-if="removeLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{
                  removeLoading ? "Processing..." : "Confirm Removal"
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { handleApiError } from "@/utils/errorHandler";
import api from "@/utils/api";

export default {
  name: "WalletManagement",
  setup() {
    const store = useStore();

    // 钱包数据
    const allWallets = ref([]);
    const loading = ref(true);

    // 模态框状态
    const transferModalVisible = ref(false);
    const removeModalVisible = ref(false);

    // Transfer表单状态
    const transferForm = ref({
      alias: "",
      to: "",
      amount: 0,
    });
    const selectedFromWallet = ref(null);
    const selectedToWallet = ref(null);

    // Remove Stake表单状态
    const removeForm = ref({
      wallet: "",
      amount: 0,
    });
    const selectedWallet = ref(null);

    // 新增状态：Transfer操作相关
    const transferLoading = ref(false);
    const transferSuccessMessage = ref("");
    const transferErrorMessage = ref("");

    // 新增状态：Remove Stake操作相关
    const removeLoading = ref(false);
    const removeSuccessMessage = ref("");
    const removeErrorMessage = ref("");

    // 获取所有钱包
    const fetchAllWallets = async () => {
      loading.value = true;
      const timestamp = Date.now();

      try {
        const response = await api.get("/wallets", {
          params: {
            _: timestamp,
          },
        });
        allWallets.value = response.data;
      } catch (error) {
        console.error("Failed to fetch wallets:", error);
      } finally {
        loading.value = false;
      }
    };

    // 打开Transfer模态框
    const openTransferModal = () => {
      // 重置消息
      transferSuccessMessage.value = "";
      transferErrorMessage.value = "";

      if (allWallets.value.length > 0) {
        transferForm.value.alias = allWallets.value[0].coldkey_name;
        transferForm.value.to =
          allWallets.value.length > 1 ? allWallets.value[1].coldkey_name : "";
        selectedFromWallet.value = allWallets.value[0];
        selectedToWallet.value =
          allWallets.value.length > 1 ? allWallets.value[1] : null;
      }
      transferModalVisible.value = true;
    };

    // 关闭Transfer模态框
    const closeTransferModal = () => {
      transferModalVisible.value = false;
      transferForm.value = { alias: "", to: "", amount: 0 };
      selectedFromWallet.value = null;
      selectedToWallet.value = null;
      // 重置消息状态
      transferSuccessMessage.value = "";
      transferErrorMessage.value = "";
    };

    // 更新选择的from钱包
    const updateFromWalletDetails = () => {
      if (transferForm.value.alias) {
        selectedFromWallet.value = allWallets.value.find(
          (w) => w.coldkey_name === transferForm.value.alias
        );
      }
    };

    // 更新选择的to钱包
    const updateToWalletDetails = () => {
      if (transferForm.value.to) {
        selectedToWallet.value = allWallets.value.find(
          (w) => w.coldkey_name === transferForm.value.to
        );
      }
    };

    // 提交Transfer操作
    const submitTransfer = async () => {
      // 重置消息
      transferSuccessMessage.value = "";
      transferErrorMessage.value = "";
      transferLoading.value = true;

      var transferFlag = false;
      try {
        await api.post("/wallets", transferForm.value, {});
        transferSuccessMessage.value = "Transfer completed successfully";
        transferFlag = true;
        setTimeout(() => {
          closeTransferModal();
        }, 1500);
      } catch (error) {
        transferErrorMessage.value = handleApiError(error);
      } finally {
        if (transferFlag) {
          fetchAllWallets();
        }
        transferLoading.value = false;
      }
    };

    // 打开Remove Stake模态框
    const openRemoveModal = () => {
      // 重置消息
      removeSuccessMessage.value = "";
      removeErrorMessage.value = "";

      if (allWallets.value.length > 0) {
        removeForm.value.wallet = allWallets.value[0].coldkey_name;
        selectedWallet.value = allWallets.value[0];
      }
      removeModalVisible.value = true;
    };

    // 关闭Remove Stake模态框
    const closeRemoveModal = () => {
      removeModalVisible.value = false;
      removeForm.value = { wallet: "", amount: 0 };
      selectedWallet.value = null;
      // 重置消息状态
      removeSuccessMessage.value = "";
      removeErrorMessage.value = "";
    };

    // 更新选择的钱包
    const updateSelectedWalletDetails = () => {
      if (removeForm.value.wallet) {
        selectedWallet.value = allWallets.value.find(
          (w) => w.coldkey_name === removeForm.value.wallet
        );
      }
    };

    // 提交Remove Stake操作
    const submitRemoveStake = async () => {
      // 重置消息
      removeSuccessMessage.value = "";
      removeErrorMessage.value = "";
      removeLoading.value = true;

      var removeStakeFlag = false;
      try {
        await api.put(
          "/wallets",
          {
            coldkey_name: removeForm.value.wallet,
            amount: removeForm.value.amount,
          },
          {}
        );
        removeSuccessMessage.value = "Stake removed successfully";
        removeStakeFlag = true;
        setTimeout(() => {
          closeRemoveModal();
        }, 1500);
      } catch (error) {
        removeErrorMessage.value = handleApiError(error);
      } finally {
        if (removeStakeFlag) {
          fetchAllWallets();
        }
        removeLoading.value = false;
      }
    };

    // 计算各列总和
    const totalSums = computed(() => {
      if (!allWallets.value || allWallets.value.length === 0) {
        return {
          totalFree: 0,
          totalStaked: 0,
          totalBalance: 0,
        };
      }

      return allWallets.value.reduce(
        (sums, wallet) => {
          sums.totalFree += parseFloat(wallet.free || 0);
          sums.totalStaked += parseFloat(wallet.staked || 0);
          sums.totalBalance += parseFloat(wallet.total || 0);
          return sums;
        },
        {
          totalFree: 0,
          totalStaked: 0,
          totalBalance: 0,
        }
      );
    });

    // 格式化余额显示
    const formatBalance = (balance) => {
      return parseFloat(balance).toFixed(6) + " TAO";
    };

    // 初始化组件
    onMounted(() => {
      if (!store.getters.isAuthenticated) {
        return;
      }
      fetchAllWallets();
    });

    return {
      allWallets,
      loading,
      transferModalVisible,
      removeModalVisible,
      transferForm,
      removeForm,
      selectedFromWallet,
      selectedToWallet,
      selectedWallet,
      transferLoading,
      transferSuccessMessage,
      transferErrorMessage,
      removeLoading,
      removeSuccessMessage,
      removeErrorMessage,
      totalSums,
      openTransferModal,
      closeTransferModal,
      openRemoveModal,
      closeRemoveModal,
      updateFromWalletDetails,
      updateToWalletDetails,
      updateSelectedWalletDetails,
      submitTransfer,
      submitRemoveStake,
      formatBalance,
    };
  },
};
</script>

<style scoped>
.wallet-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-section h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.transfer-btn,
.remove-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.transfer-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.remove-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.transfer-btn:hover {
  background: linear-gradient(135deg, #2980b9, #2575b0);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.remove-btn:hover {
  background: linear-gradient(135deg, #c0392b, #b03a2e);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.wallet-table-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 25px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-indicator .spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.wallet-table {
  width: 100%;
  border-collapse: collapse;
}

.wallet-table th {
  background-color: #f8f9fa;
  padding: 16px 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e6ed;
}

.wallet-table td {
  padding: 14px 15px;
  border-bottom: 1px solid #e0e6ed;
  color: #34495e;
}

.wallet-table tbody tr:hover {
  background-color: #f9fafb;
}

.address-cell {
  font-family: "Courier New", monospace;
  font-size: 14px;
  color: #7f8c8d;
}

.balance-cell {
  text-align: right;
}

.balance-cell.total {
  font-weight: 600;
  color: #27ae60;
}

/* 合计行样式 */
.summary-row {
  background-color: #f8f9fa;
  border-top: 2px solid #3498db;
}

.summary-row td {
  padding: 16px 15px;
  border-bottom: 2px solid #3498db;
  font-size: 16px;
}

.summary-label {
  color: #2c3e50;
  font-weight: 600;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.summary-balance {
  background-color: #f1f8ff;
  color: #2c3e50;
  font-weight: 600;
}

.summary-balance.total {
  background: linear-gradient(135deg, #e8f5e8, #d4edda);
  color: #155724;
  font-weight: 700;
  font-size: 17px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e6ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.wallet-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  color: #7f8c8d;
}

.amount-info {
  margin-top: 8px;
  font-size: 14px;
  color: #2c3e50;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions button:first-child {
  background-color: #f0f2f5;
  border: 1px solid #e0e6ed;
  color: #34495e;
}

.form-actions button:last-child {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  color: white;
}

.form-actions button:last-child:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions button:last-child:not(:disabled):hover {
  background: linear-gradient(135deg, #27ae60, #219653);
}

/* 新增样式 - 操作状态提示 */
.success-message {
  color: #2ecc71;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  padding: 12px 15px;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  padding: 12px 15px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 按钮中的加载指示器 */
.spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
  }

  .wallet-table {
    display: block;
    overflow-x: auto;
  }

  .summary-row td {
    padding: 12px 10px;
    font-size: 14px;
  }

  .summary-balance.total {
    font-size: 15px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
  }
}
</style>
