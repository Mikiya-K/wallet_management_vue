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
          Showing all {{ sortedWallets.length }} wallets
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
                <th scope="col" class="sortable-header">
                  <button
                    class="sort-button"
                    @click="toggleSort('coldkey_name')"
                    :class="{
                      'sort-active': sortField === 'coldkey_name',
                      'sort-asc':
                        sortField === 'coldkey_name' && sortDirection === 'asc',
                      'sort-desc':
                        sortField === 'coldkey_name' &&
                        sortDirection === 'desc',
                    }"
                  >
                    Coldkey Name
                    <span class="sort-icon">{{
                      getSortIcon("coldkey_name")
                    }}</span>
                  </button>
                </th>
                <th scope="col">Coldkey Address</th>
                <th scope="col">Free Balance</th>
                <th scope="col">Staked Balance</th>
                <th scope="col">Total Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wallet in sortedWallets" :key="wallet.coldkey_name">
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
            <tfoot v-if="sortedWallets.length > 0">
              <tr class="summary-row">
                <td class="summary-label" colspan="2">
                  <strong>Total ({{ sortedWallets.length }} wallets)</strong>
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

        <div v-if="sortedWallets.length === 0" class="no-data">
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
              <div class="wallet-search-container">
                <input
                  type="text"
                  id="fromWallet"
                  v-model="fromWalletSearch"
                  :placeholder="`Search from ${sortedWallets.length} wallets...`"
                  @focus="fromWalletDropdownOpen = true"
                  @input="fromWalletDropdownOpen = true"
                  :disabled="transferLoading"
                  class="wallet-search-input"
                  autocomplete="off"
                />
                <button
                  v-if="fromWalletSearch"
                  type="button"
                  @click="clearFromWalletSearch"
                  class="clear-search-btn"
                  :disabled="transferLoading"
                >
                  ×
                </button>

                <!-- 下拉搜索结果 -->
                <div
                  v-if="
                    fromWalletDropdownOpen && filteredFromWallets.length > 0
                  "
                  class="wallet-dropdown"
                >
                  <div
                    v-for="wallet in filteredFromWallets"
                    :key="'from-' + wallet.coldkey_name"
                    @click="selectFromWallet(wallet)"
                    class="wallet-option"
                    :class="{
                      selected: transferForm.alias === wallet.coldkey_name,
                    }"
                  >
                    <div class="wallet-name">{{ wallet.coldkey_name }}</div>
                    <div class="wallet-balance">
                      {{ formatBalance(wallet.free) }} available
                    </div>
                  </div>
                </div>

                <!-- 无搜索结果 -->
                <div
                  v-if="
                    fromWalletDropdownOpen &&
                    fromWalletSearch &&
                    filteredFromWallets.length === 0
                  "
                  class="wallet-dropdown no-results"
                >
                  <div class="wallet-option disabled">
                    No wallets found matching "{{ fromWalletSearch }}"
                  </div>
                </div>
              </div>

              <!-- 快速选择区域 -->
              <div
                v-if="!fromWalletSearch && sortedWallets.length > 0"
                class="quick-select"
              >
                <span class="quick-select-label">Quick select:</span>
                <div class="quick-select-buttons">
                  <button
                    v-for="wallet in sortedWallets.slice(0, 3)"
                    :key="'quick-from-' + wallet.coldkey_name"
                    type="button"
                    @click="selectFromWallet(wallet)"
                    class="quick-select-btn"
                    :disabled="transferLoading"
                  >
                    {{ wallet.coldkey_name }}
                    <span class="quick-select-balance"
                      >({{ formatBalance(wallet.free) }})</span
                    >
                  </button>
                  <span v-if="sortedWallets.length > 3" class="more-wallets">
                    +{{ sortedWallets.length - 3 }} more...
                  </span>
                </div>
              </div>

              <div v-if="selectedFromWallet" class="wallet-details">
                <p>Address: {{ selectedFromWallet.coldkey_address }}</p>
                <p>Available: {{ formatBalance(selectedFromWallet.free) }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="toWallet">To Wallet:</label>
              <div class="wallet-search-container">
                <input
                  type="text"
                  id="toWallet"
                  v-model="toWalletSearch"
                  :placeholder="`Search from ${sortedWallets.length} wallets...`"
                  @focus="toWalletDropdownOpen = true"
                  @input="toWalletDropdownOpen = true"
                  :disabled="transferLoading"
                  class="wallet-search-input"
                  autocomplete="off"
                />
                <button
                  v-if="toWalletSearch"
                  type="button"
                  @click="clearToWalletSearch"
                  class="clear-search-btn"
                  :disabled="transferLoading"
                >
                  ×
                </button>

                <!-- 下拉搜索结果 -->
                <div
                  v-if="toWalletDropdownOpen && filteredToWallets.length > 0"
                  class="wallet-dropdown"
                >
                  <div
                    v-for="wallet in filteredToWallets"
                    :key="'to-' + wallet.coldkey_name"
                    @click="selectToWallet(wallet)"
                    class="wallet-option"
                    :class="{
                      selected: transferForm.to === wallet.coldkey_name,
                    }"
                  >
                    <div class="wallet-name">{{ wallet.coldkey_name }}</div>
                    <div class="wallet-balance">
                      {{ formatBalance(wallet.free) }} available
                    </div>
                  </div>
                </div>

                <!-- 无搜索结果 -->
                <div
                  v-if="
                    toWalletDropdownOpen &&
                    toWalletSearch &&
                    filteredToWallets.length === 0
                  "
                  class="wallet-dropdown no-results"
                >
                  <div class="wallet-option disabled">
                    No wallets found matching "{{ toWalletSearch }}"
                  </div>
                </div>
              </div>

              <!-- 快速选择区域 -->
              <div
                v-if="!toWalletSearch && sortedWallets.length > 0"
                class="quick-select"
              >
                <span class="quick-select-label">Quick select:</span>
                <div class="quick-select-buttons">
                  <button
                    v-for="wallet in sortedWallets.slice(0, 3)"
                    :key="'quick-to-' + wallet.coldkey_name"
                    type="button"
                    @click="selectToWallet(wallet)"
                    class="quick-select-btn"
                    :disabled="transferLoading"
                  >
                    {{ wallet.coldkey_name }}
                  </button>
                  <span v-if="sortedWallets.length > 3" class="more-wallets">
                    +{{ sortedWallets.length - 3 }} more...
                  </span>
                </div>
              </div>

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
              <div class="wallet-search-container">
                <input
                  type="text"
                  id="wallet"
                  v-model="removeWalletSearch"
                  :placeholder="`Search from ${sortedWallets.length} wallets...`"
                  @focus="removeWalletDropdownOpen = true"
                  @input="removeWalletDropdownOpen = true"
                  :disabled="removeLoading"
                  class="wallet-search-input"
                  autocomplete="off"
                />
                <button
                  v-if="removeWalletSearch"
                  type="button"
                  @click="clearRemoveWalletSearch"
                  class="clear-search-btn"
                  :disabled="removeLoading"
                >
                  ×
                </button>

                <!-- 下拉搜索结果 -->
                <div
                  v-if="
                    removeWalletDropdownOpen && filteredRemoveWallets.length > 0
                  "
                  class="wallet-dropdown"
                >
                  <div
                    v-for="wallet in filteredRemoveWallets"
                    :key="'remove-' + wallet.coldkey_name"
                    @click="selectRemoveWallet(wallet)"
                    class="wallet-option"
                    :class="{
                      selected: removeForm.wallet === wallet.coldkey_name,
                    }"
                  >
                    <div class="wallet-name">{{ wallet.coldkey_name }}</div>
                    <div class="wallet-balance">
                      {{ formatBalance(wallet.staked) }} staked
                    </div>
                  </div>
                </div>

                <!-- 无搜索结果 -->
                <div
                  v-if="
                    removeWalletDropdownOpen &&
                    removeWalletSearch &&
                    filteredRemoveWallets.length === 0
                  "
                  class="wallet-dropdown no-results"
                >
                  <div class="wallet-option disabled">
                    No wallets found matching "{{ removeWalletSearch }}"
                  </div>
                </div>
              </div>

              <!-- 快速选择区域 -->
              <div
                v-if="!removeWalletSearch && sortedWallets.length > 0"
                class="quick-select"
              >
                <span class="quick-select-label">Quick select:</span>
                <div class="quick-select-buttons">
                  <button
                    v-for="wallet in sortedWallets.slice(0, 3)"
                    :key="'quick-remove-' + wallet.coldkey_name"
                    type="button"
                    @click="selectRemoveWallet(wallet)"
                    class="quick-select-btn"
                    :disabled="removeLoading"
                  >
                    {{ wallet.coldkey_name }}
                    <span class="quick-select-balance"
                      >({{ formatBalance(wallet.staked) }})</span
                    >
                  </button>
                  <span v-if="sortedWallets.length > 3" class="more-wallets">
                    +{{ sortedWallets.length - 3 }} more...
                  </span>
                </div>
              </div>

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

    // 排序状态
    const sortField = ref("coldkey_name"); // 默认按coldkey_name排序
    const sortDirection = ref("asc"); // 'asc' | 'desc' | null

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

    // 搜索选择相关状态
    const fromWalletSearch = ref("");
    const toWalletSearch = ref("");
    const removeWalletSearch = ref("");
    const fromWalletDropdownOpen = ref(false);
    const toWalletDropdownOpen = ref(false);
    const removeWalletDropdownOpen = ref(false);

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

      // 重置搜索状态
      resetTransferSearchStates();

      // 不再自动选择钱包，让用户主动搜索选择

      transferModalVisible.value = true;

      // 添加点击外部关闭的事件监听
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
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
      // 重置搜索状态
      resetTransferSearchStates();
      // 移除事件监听
      document.removeEventListener("click", handleClickOutside);
    };

    // 更新选择的from钱包
    const updateFromWalletDetails = () => {
      if (transferForm.value.alias) {
        selectedFromWallet.value = sortedWallets.value.find(
          (w) => w.coldkey_name === transferForm.value.alias
        );
      }
    };

    // 更新选择的to钱包
    const updateToWalletDetails = () => {
      if (transferForm.value.to) {
        selectedToWallet.value = sortedWallets.value.find(
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

      // 重置搜索状态
      resetRemoveSearchStates();

      // 不再自动选择钱包，让用户主动搜索选择

      removeModalVisible.value = true;

      // 添加点击外部关闭的事件监听
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
    };

    // 关闭Remove Stake模态框
    const closeRemoveModal = () => {
      removeModalVisible.value = false;
      removeForm.value = { wallet: "", amount: 0 };
      selectedWallet.value = null;
      // 重置消息状态
      removeSuccessMessage.value = "";
      removeErrorMessage.value = "";
      // 重置搜索状态
      resetRemoveSearchStates();
      // 移除事件监听
      document.removeEventListener("click", handleClickOutside);
    };

    // 更新选择的钱包
    const updateSelectedWalletDetails = () => {
      if (removeForm.value.wallet) {
        selectedWallet.value = sortedWallets.value.find(
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

    // 排序后的钱包数据
    const sortedWallets = computed(() => {
      if (!allWallets.value || allWallets.value.length === 0) {
        return [];
      }

      const walletsCopy = [...allWallets.value];

      if (sortField.value === "coldkey_name") {
        walletsCopy.sort((a, b) => {
          const nameA = (a.coldkey_name || "").toLowerCase();
          const nameB = (b.coldkey_name || "").toLowerCase();

          if (sortDirection.value === "asc") {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
      }

      return walletsCopy;
    });

    // 搜索筛选函数 - 只按coldkey name搜索
    const filterWallets = (searchTerm) => {
      if (!searchTerm || !sortedWallets.value) {
        return sortedWallets.value;
      }

      const term = searchTerm.toLowerCase();
      return sortedWallets.value.filter((wallet) => {
        const name = (wallet.coldkey_name || "").toLowerCase();
        return name.includes(term);
      });
    };

    // 各个搜索场景的筛选结果
    const filteredFromWallets = computed(() =>
      filterWallets(fromWalletSearch.value)
    );
    const filteredToWallets = computed(() =>
      filterWallets(toWalletSearch.value)
    );
    const filteredRemoveWallets = computed(() =>
      filterWallets(removeWalletSearch.value)
    );

    // 计算各列总和 (基于排序后的数据)
    const totalSums = computed(() => {
      if (!sortedWallets.value || sortedWallets.value.length === 0) {
        return {
          totalFree: 0,
          totalStaked: 0,
          totalBalance: 0,
        };
      }

      return sortedWallets.value.reduce(
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

    // 排序切换函数
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

    // 获取排序图标
    const getSortIcon = (field) => {
      if (sortField.value !== field) {
        return "↕️"; // 默认双向箭头
      }
      return sortDirection.value === "asc" ? "↑" : "↓";
    };

    // 搜索选择交互函数
    const selectFromWallet = (wallet) => {
      transferForm.value.alias = wallet.coldkey_name;
      fromWalletSearch.value = wallet.coldkey_name;
      selectedFromWallet.value = wallet;
      fromWalletDropdownOpen.value = false;
    };

    const selectToWallet = (wallet) => {
      transferForm.value.to = wallet.coldkey_name;
      toWalletSearch.value = wallet.coldkey_name;
      selectedToWallet.value = wallet;
      toWalletDropdownOpen.value = false;
    };

    const selectRemoveWallet = (wallet) => {
      removeForm.value.wallet = wallet.coldkey_name;
      removeWalletSearch.value = wallet.coldkey_name;
      selectedWallet.value = wallet;
      removeWalletDropdownOpen.value = false;
    };

    const clearFromWalletSearch = () => {
      fromWalletSearch.value = "";
      transferForm.value.alias = "";
      selectedFromWallet.value = null;
    };

    const clearToWalletSearch = () => {
      toWalletSearch.value = "";
      transferForm.value.to = "";
      selectedToWallet.value = null;
    };

    const clearRemoveWalletSearch = () => {
      removeWalletSearch.value = "";
      removeForm.value.wallet = "";
      selectedWallet.value = null;
    };

    // 点击外部关闭下拉列表
    const handleClickOutside = (event) => {
      const target = event.target;

      // 检查是否点击在搜索容器外部
      if (!target.closest(".wallet-search-container")) {
        fromWalletDropdownOpen.value = false;
        toWalletDropdownOpen.value = false;
        removeWalletDropdownOpen.value = false;
      }
    };

    // 初始化模态框时重置搜索状态
    const resetTransferSearchStates = () => {
      fromWalletSearch.value = "";
      toWalletSearch.value = "";
      fromWalletDropdownOpen.value = false;
      toWalletDropdownOpen.value = false;
    };

    const resetRemoveSearchStates = () => {
      removeWalletSearch.value = "";
      removeWalletDropdownOpen.value = false;
    };

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
      sortedWallets,
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
      sortField,
      sortDirection,
      // 搜索相关状态
      fromWalletSearch,
      toWalletSearch,
      removeWalletSearch,
      fromWalletDropdownOpen,
      toWalletDropdownOpen,
      removeWalletDropdownOpen,
      filteredFromWallets,
      filteredToWallets,
      filteredRemoveWallets,
      // 搜索相关函数
      selectFromWallet,
      selectToWallet,
      selectRemoveWallet,
      clearFromWalletSearch,
      clearToWalletSearch,
      clearRemoveWalletSearch,
      handleClickOutside,
      resetTransferSearchStates,
      resetRemoveSearchStates,
      toggleSort,
      getSortIcon,
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

/* 可排序表头样式 */
.sortable-header {
  padding: 0 !important;
}

.sort-button {
  width: 100%;
  padding: 16px 15px;
  background: none;
  border: none;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  font-size: 14px;
}

.sort-button:hover {
  background-color: #e9ecef;
  color: #1a252f;
}

.sort-button.sort-active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.sort-button.sort-active:hover {
  background-color: #bbdefb;
}

.sort-icon {
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.sort-button:hover .sort-icon {
  opacity: 1;
}

.sort-button.sort-active .sort-icon {
  opacity: 1;
  color: #1976d2;
  font-weight: bold;
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

/* 搜索选择组件样式 */
.wallet-search-container {
  position: relative;
  width: 100%;
}

.wallet-search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
  background-color: white;
}

.wallet-search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  color: #7f8c8d;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background-color: #f8f9fa;
  color: #e74c3c;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e6ed;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.wallet-dropdown.no-results {
  max-height: auto;
}

.wallet-option {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s;
}

.wallet-option:last-child {
  border-bottom: none;
}

.wallet-option:hover {
  background-color: #f8f9fa;
}

.wallet-option.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.wallet-option.disabled {
  cursor: not-allowed;
  color: #7f8c8d;
  background-color: #f8f9fa;
}

.wallet-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.wallet-balance {
  font-size: 14px;
  color: #7f8c8d;
}

.wallet-option.selected .wallet-name {
  color: #1976d2;
}

.wallet-option.selected .wallet-balance {
  color: #1565c0;
}

/* 快速选择区域样式 */
.quick-select {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.quick-select-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
}

.quick-select-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.quick-select-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.quick-select-btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.quick-select-btn:active {
  transform: translateY(0);
}

.quick-select-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.quick-select-balance {
  font-size: 11px;
  color: #6c757d;
  margin-top: 2px;
}

.more-wallets {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
  margin-left: 8px;
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

  .sort-button {
    padding: 12px 10px;
    font-size: 13px;
  }

  .sort-icon {
    font-size: 11px;
  }

  .wallet-search-input {
    padding: 10px 35px 10px 10px;
    font-size: 14px;
  }

  .clear-search-btn {
    width: 24px;
    height: 24px;
    font-size: 16px;
  }

  .wallet-dropdown {
    max-height: 150px;
  }

  .wallet-option {
    padding: 10px;
  }

  .wallet-name {
    font-size: 14px;
  }

  .wallet-balance {
    font-size: 12px;
  }

  .quick-select {
    padding: 10px;
    margin-top: 10px;
  }

  .quick-select-label {
    font-size: 13px;
  }

  .quick-select-btn {
    padding: 5px 8px;
    font-size: 12px;
    min-width: 70px;
  }

  .quick-select-balance {
    font-size: 10px;
  }

  .more-wallets {
    font-size: 11px;
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
