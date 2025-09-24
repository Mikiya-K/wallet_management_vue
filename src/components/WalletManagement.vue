<template>
  <div class="wallet-management-container">
    <!-- 标题和操作按钮 -->
    <div class="header-section">
      <h2>
        <i class="fas fa-list"></i>
        钱包列表
      </h2>
      <div class="action-buttons">
        <button
          v-if="isAdmin"
          class="import-btn"
          @click="importWallets"
          :disabled="importLoading"
        >
          <span v-if="importLoading" class="spinner" aria-hidden="true"></span>
          <span>{{ importLoading ? "Importing..." : "Import Wallets" }}</span>
        </button>
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

        <!-- Import操作状态提示 -->
        <transition name="fade">
          <div v-if="importSuccessMessage" class="success-message">
            <span class="success-icon" aria-hidden="true">✅</span>
            <span>{{ importSuccessMessage }}</span>
          </div>
        </transition>

        <transition name="fade">
          <div v-if="importErrorMessage" class="error-message">
            <span class="error-icon" aria-hidden="true">❌</span>
            <span>{{ importErrorMessage }}</span>
          </div>
        </transition>

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
                <th v-if="isAdmin" scope="col" class="checkbox-column">
                  <input
                    type="checkbox"
                    v-model="isAllSelected"
                    @change="toggleSelectAll"
                    class="select-checkbox"
                  />
                </th>
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
                <th v-if="isAdmin" scope="col">Password</th>
                <th v-if="isAdmin" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wallet in sortedWallets" :key="wallet.coldkey_name">
                <td v-if="isAdmin" class="checkbox-column">
                  <input
                    type="checkbox"
                    :value="wallet.coldkey_name"
                    v-model="selectedWallets"
                    @change="updateSelectAllState"
                    class="select-checkbox"
                  />
                </td>
                <td>{{ wallet.coldkey_name }}</td>
                <td class="address-cell">{{ wallet.coldkey_address }}</td>
                <td class="balance-cell">{{ formatBalance(wallet.free) }}</td>
                <td class="balance-cell">{{ formatBalance(wallet.staked) }}</td>
                <td class="balance-cell total">
                  {{ formatBalance(wallet.total) }}
                </td>
                <td v-if="isAdmin" class="password-cell">
                  <span v-if="wallet.has_password" class="password-set"
                    >••••••</span
                  >
                  <span v-else class="password-unset">未存放</span>
                </td>
                <td v-if="isAdmin" class="actions-cell">
                  <button
                    v-if="wallet.has_password"
                    @click="openPasswordModal(wallet)"
                    class="action-btn edit-btn"
                    :disabled="passwordLoading"
                  >
                    Edit
                  </button>
                  <button
                    v-else
                    @click="openPasswordModal(wallet)"
                    class="action-btn set-btn"
                    :disabled="passwordLoading"
                  >
                    Set
                  </button>
                </td>
              </tr>
            </tbody>
            <!-- 合计行 -->
            <tfoot v-if="sortedWallets.length > 0">
              <tr class="summary-row">
                <td class="summary-label" :colspan="isAdmin ? 3 : 2">
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
                <td v-if="isAdmin" class="summary-placeholder"></td>
                <td v-if="isAdmin" class="summary-placeholder"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="sortedWallets.length === 0" class="no-data">
          <p>No wallet data available</p>
        </div>

        <!-- 批量操作栏 -->
        <transition name="fade">
          <div
            v-if="isAdmin && selectedWallets.length > 0"
            class="batch-actions-bar"
          >
            <div class="batch-info">
              <span class="selected-count"
                >已选择 {{ selectedWallets.length }} 个钱包</span
              >
            </div>
            <div class="batch-buttons">
              <button
                class="batch-password-btn"
                @click="openBatchPasswordModal"
                :disabled="batchLoading"
              >
                <span
                  v-if="batchLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{ batchLoading ? "处理中..." : "批量设置密码" }}</span>
              </button>
              <button class="clear-selection-btn" @click="clearSelection">
                取消选择
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Transfer模态框 -->
    <div v-if="transferModalVisible" class="modal-overlay">
      <div class="modal-content transfer-modal">
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

              <!-- 标签页切换 (仅管理员可见) -->
              <div v-if="isAdmin" class="wallet-tabs">
                <button
                  type="button"
                  class="tab-button"
                  :class="{ active: toWalletTab === 'local' }"
                  @click="switchToWalletTab('local')"
                >
                  <i class="fas fa-home"></i>
                  本地钱包
                </button>
                <button
                  type="button"
                  class="tab-button"
                  :class="{ active: toWalletTab === 'external' }"
                  @click="switchToWalletTab('external')"
                >
                  <i class="fas fa-external-link-alt"></i>
                  外部钱包
                </button>
              </div>

              <!-- 本地钱包搜索 -->
              <div
                v-if="toWalletTab === 'local'"
                class="wallet-search-container"
              >
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
                      selected: transferForm.to === wallet.coldkey_address,
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
                v-if="
                  toWalletTab === 'local' &&
                  !toWalletSearch &&
                  sortedWallets.length > 0
                "
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

              <!-- 外部钱包搜索 -->
              <div
                v-if="toWalletTab === 'external'"
                class="wallet-search-container"
              >
                <input
                  type="text"
                  id="externalWallet"
                  v-model="externalWalletSearch"
                  :placeholder="`Search from ${externalWallets.length} external wallets...`"
                  @focus="externalWalletDropdownOpen = true"
                  @input="externalWalletDropdownOpen = true"
                  :disabled="transferLoading"
                  class="wallet-search-input"
                  autocomplete="off"
                />
                <button
                  v-if="externalWalletSearch"
                  type="button"
                  @click="clearExternalWalletSearch"
                  class="clear-search-btn"
                  :disabled="transferLoading"
                >
                  ×
                </button>

                <!-- 外部钱包下拉搜索结果 -->
                <div
                  v-if="
                    externalWalletDropdownOpen &&
                    filteredExternalWallets.length > 0
                  "
                  class="wallet-dropdown"
                >
                  <div
                    v-for="wallet in filteredExternalWallets"
                    :key="'external-' + wallet.address"
                    @click="selectExternalWallet(wallet)"
                    class="wallet-option"
                    :class="{
                      selected: transferForm.to === wallet.address,
                    }"
                  >
                    <div class="wallet-name">{{ wallet.name }}</div>
                    <div class="wallet-address">{{ wallet.address }}</div>
                  </div>
                </div>

                <!-- 无外部钱包搜索结果 -->
                <div
                  v-if="
                    externalWalletDropdownOpen &&
                    externalWalletSearch &&
                    filteredExternalWallets.length === 0
                  "
                  class="wallet-dropdown no-results"
                >
                  <div class="wallet-option disabled">
                    No external wallets found matching "{{
                      externalWalletSearch
                    }}"
                  </div>
                </div>

                <!-- 外部钱包快速选择区域 -->
                <div
                  v-if="!externalWalletSearch && externalWallets.length > 0"
                  class="quick-select"
                >
                  <span class="quick-select-label">Quick select:</span>
                  <div class="quick-select-buttons">
                    <button
                      v-for="wallet in externalWallets.slice(0, 3)"
                      :key="'quick-external-' + wallet.address"
                      type="button"
                      @click="selectExternalWallet(wallet)"
                      class="quick-select-btn"
                      :disabled="transferLoading"
                    >
                      {{ wallet.name }}
                    </button>
                    <span
                      v-if="externalWallets.length > 3"
                      class="more-wallets"
                    >
                      +{{ externalWallets.length - 3 }} more...
                    </span>
                  </div>
                </div>

                <div v-if="selectedExternalWallet" class="wallet-details">
                  <p>Name: {{ selectedExternalWallet.name }}</p>
                  <p>Address: {{ selectedExternalWallet.address }}</p>
                </div>
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
      <div class="modal-content remove-stake-modal">
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
                v-show="!removeWalletSearch && sortedWallets.length > 0"
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

    <!-- 密码管理模态框 -->
    <div v-if="passwordModalVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            {{ currentWallet?.has_password ? "更新钱包密码" : "设置钱包密码" }}
          </h2>
          <button class="close-btn" @click="closePasswordModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitPassword">
            <div class="wallet-info">
              <p><strong>钱包:</strong> {{ currentWallet?.coldkey_name }}</p>
            </div>

            <div class="form-group">
              <label for="password">密码:</label>
              <div class="password-input-container">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="passwordForm.password"
                  placeholder="请输入密码"
                  :disabled="passwordLoading"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  @click="showPassword = !showPassword"
                  :disabled="passwordLoading"
                >
                  {{ showPassword ? "👁️" : "👁️‍🗨️" }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">确认密码:</label>
              <div class="password-input-container">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  placeholder="请再次输入密码"
                  :disabled="passwordLoading"
                  autocomplete="new-password"
                  :class="{
                    error:
                      passwordForm.confirmPassword &&
                      passwordForm.password !== passwordForm.confirmPassword,
                  }"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :disabled="passwordLoading"
                >
                  {{ showConfirmPassword ? "👁️" : "👁️‍🗨️" }}
                </button>
              </div>
              <div
                v-if="
                  passwordForm.confirmPassword &&
                  passwordForm.password !== passwordForm.confirmPassword
                "
                class="error-message"
                style="margin-top: 8px; margin-bottom: 0"
              >
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>密码不匹配，请重新输入</span>
              </div>
            </div>

            <!-- 成功和错误消息 -->
            <transition name="fade">
              <div v-if="passwordSuccessMessage" class="success-message">
                <span class="success-icon" aria-hidden="true">✅</span>
                <span>{{ passwordSuccessMessage }}</span>
              </div>
            </transition>
            <transition name="fade">
              <div v-if="passwordErrorMessage" class="error-message">
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>{{ passwordErrorMessage }}</span>
              </div>
            </transition>

            <div class="form-actions">
              <button
                type="button"
                @click="closePasswordModal"
                :disabled="passwordLoading"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="passwordLoading || !isPasswordFormValid"
              >
                <span
                  v-if="passwordLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{
                  passwordLoading
                    ? "处理中..."
                    : currentWallet?.has_password
                    ? "更新密码"
                    : "设置密码"
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 批量密码设置模态框 -->
    <div v-if="batchPasswordModalVisible" class="modal-overlay">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h2>批量设置钱包密码</h2>
          <button class="close-btn" @click="closeBatchPasswordModal">×</button>
        </div>
        <div class="modal-body">
          <div class="batch-info-section">
            <p>
              <strong>已选择 {{ selectedWallets.length }} 个钱包</strong>
            </p>
            <div v-if="batchProgress.total > 0" class="progress-section">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      (batchProgress.current / batchProgress.total) * 100 + '%',
                  }"
                ></div>
              </div>
              <span class="progress-text">
                {{ batchProgress.current }} / {{ batchProgress.total }} 完成
              </span>
            </div>
          </div>

          <form @submit.prevent="submitBatchPasswords">
            <!-- 共享密码选项 -->
            <div class="shared-password-option">
              <label class="switch-container">
                <input
                  type="checkbox"
                  v-model="useSharedPassword"
                  @change="onSharedPasswordToggle"
                  :disabled="batchLoading"
                />
                <span class="switch-slider"></span>
                <span class="switch-label">所有钱包使用相同密码</span>
              </label>
            </div>

            <!-- 共享密码输入（仅在开关打开时显示） -->
            <div v-if="useSharedPassword" class="shared-password-input-group">
              <div class="password-input-container">
                <input
                  :type="sharedPasswordVisible ? 'text' : 'password'"
                  v-model="sharedPassword"
                  placeholder="请输入统一密码"
                  :disabled="batchLoading"
                  autocomplete="new-password"
                  class="shared-password-input"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  @click="sharedPasswordVisible = !sharedPasswordVisible"
                  :disabled="batchLoading"
                >
                  {{ sharedPasswordVisible ? "👁️" : "👁️‍🗨️" }}
                </button>
              </div>
            </div>

            <!-- 原有的单独密码列表（仅在开关关闭时显示） -->
            <div v-else class="batch-password-list">
              <div
                v-for="walletName in selectedWallets"
                :key="walletName"
                class="wallet-password-item"
              >
                <div class="wallet-name">{{ walletName }}</div>
                <div class="password-input-container">
                  <input
                    :type="
                      batchPasswordForms[walletName]?.showPassword
                        ? 'text'
                        : 'password'
                    "
                    v-model="batchPasswordForms[walletName].password"
                    :placeholder="`请输入 ${walletName} 的密码`"
                    :disabled="batchLoading"
                    autocomplete="new-password"
                    class="batch-password-input"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    @click="
                      batchPasswordForms[walletName].showPassword =
                        !batchPasswordForms[walletName].showPassword
                    "
                    :disabled="batchLoading"
                  >
                    {{
                      batchPasswordForms[walletName]?.showPassword ? "👁️" : "👁️‍🗨️"
                    }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 批量操作结果 -->
            <div v-if="batchResults.length > 0" class="batch-results">
              <h4>处理结果</h4>
              <div class="results-summary">
                <span class="success-count"
                  >成功:
                  {{ batchResults.filter((r) => r.success).length }}</span
                >
                <span class="failure-count"
                  >失败:
                  {{ batchResults.filter((r) => !r.success).length }}</span
                >
              </div>
              <div class="results-list">
                <div
                  v-for="result in batchResults"
                  :key="result.coldkey_name"
                  class="result-item"
                  :class="{ success: result.success, failure: !result.success }"
                >
                  <span class="wallet-name">{{ result.coldkey_name }}</span>
                  <span class="result-status">
                    {{ result.success ? "✅ 成功" : "❌ " + result.error }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 表单验证提示 -->
            <transition name="fade">
              <div
                v-if="!isBatchFormValid && selectedWallets.length > 0"
                class="error-message"
              >
                <span class="error-icon" aria-hidden="true">⚠️</span>
                <div>
                  <div>
                    {{
                      useSharedPassword
                        ? "请输入统一密码后再提交"
                        : "请为所有钱包输入密码后再提交"
                    }}
                  </div>
                  <div class="missing-passwords">
                    {{
                      useSharedPassword
                        ? "缺少统一密码"
                        : "未输入密码的钱包：" +
                          getMissingPasswordWallets().join(", ")
                    }}
                  </div>
                </div>
              </div>
            </transition>

            <!-- 成功和错误消息 -->
            <transition name="fade">
              <div v-if="batchSuccessMessage" class="success-message">
                <span class="success-icon" aria-hidden="true">✅</span>
                <span>{{ batchSuccessMessage }}</span>
              </div>
            </transition>
            <transition name="fade">
              <div v-if="batchErrorMessage" class="error-message">
                <span class="error-icon" aria-hidden="true">❌</span>
                <span>{{ batchErrorMessage }}</span>
              </div>
            </transition>

            <div class="form-actions">
              <button
                type="button"
                @click="closeBatchPasswordModal"
                :disabled="batchLoading"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="batchLoading || !isBatchFormValid"
              >
                <span
                  v-if="batchLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{ batchLoading ? "处理中..." : "设置密码" }}</span>
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

    // 新增状态：Import Wallets操作相关
    const importLoading = ref(false);
    const importSuccessMessage = ref("");
    const importErrorMessage = ref("");

    // 批量操作相关状态
    const selectedWallets = ref([]);
    const isAllSelected = ref(false);
    const batchPasswordModalVisible = ref(false);
    const batchPasswordForms = ref({});
    const batchLoading = ref(false);
    const batchSuccessMessage = ref("");
    const batchErrorMessage = ref("");
    const batchProgress = ref({ current: 0, total: 0 });
    const batchResults = ref([]);

    // 共享密码相关状态
    const useSharedPassword = ref(false);
    const sharedPassword = ref("");
    const sharedPasswordVisible = ref(false);

    // 搜索选择相关状态
    const fromWalletSearch = ref("");
    const toWalletSearch = ref("");
    const removeWalletSearch = ref("");
    const fromWalletDropdownOpen = ref(false);
    const toWalletDropdownOpen = ref(false);
    const removeWalletDropdownOpen = ref(false);

    // 外部钱包相关状态
    const externalWallets = ref([]);
    const toWalletTab = ref("local"); // 'local' | 'external'
    const externalWalletSearch = ref("");
    const externalWalletDropdownOpen = ref(false);
    const selectedExternalWallet = ref(null);

    // 密码管理相关状态
    const passwordModalVisible = ref(false);
    const currentWallet = ref(null);
    const passwordForm = ref({
      password: "",
      confirmPassword: "",
    });
    const passwordLoading = ref(false);
    const passwordSuccessMessage = ref("");
    const passwordErrorMessage = ref("");
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);

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

    // 获取外部钱包列表
    const fetchExternalWallets = async () => {
      if (!isAdmin.value) return;

      try {
        const response = await api.get("/wallets/external");
        externalWallets.value = response.data || [];
      } catch (error) {
        console.error("获取外部钱包列表失败:", error);
        externalWallets.value = [];
      }
    };

    // 打开Transfer模态框
    const openTransferModal = () => {
      // 重置消息
      transferSuccessMessage.value = "";
      transferErrorMessage.value = "";

      // 重置搜索状态
      resetTransferSearchStates();

      // 获取外部钱包列表（仅管理员）
      if (isAdmin.value) {
        fetchExternalWallets();
      }

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
      selectedExternalWallet.value = null;
      // 重置消息状态
      transferSuccessMessage.value = "";
      transferErrorMessage.value = "";
      // 重置搜索状态
      resetTransferSearchStates();
      // 重置外部钱包状态
      toWalletTab.value = "local";
      externalWalletSearch.value = "";
      externalWalletDropdownOpen.value = false;
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
      var transferError = null;

      try {
        if (toWalletTab.value === "external") {
          // 外部钱包转账
          const externalTransferData = {
            from_wallet: transferForm.value.alias,
            to_address: transferForm.value.to,
            amount: transferForm.value.amount,
          };
          await api.post("/wallets/external/transfer", externalTransferData);
          transferSuccessMessage.value =
            "External transfer completed successfully";

          // 在后台刷新外部钱包列表，不阻塞模态框关闭
          fetchExternalWallets();
        } else {
          // 本地钱包转账
          await api.post("/wallets", transferForm.value, {});
          transferSuccessMessage.value = "Transfer completed successfully";
        }

        transferFlag = true;

        // 立即开始关闭倒计时，不等待数据刷新
        setTimeout(() => {
          closeTransferModal();
        }, 2000);

        // 在后台刷新钱包数据以获取最新余额
        fetchAllWallets();
      } catch (error) {
        transferError = error;
        transferErrorMessage.value = handleApiError(error);
      } finally {
        if (transferFlag && !transferError) {
          // 成功时已经在try块中刷新了
        } else if (!transferFlag) {
          // 失败时也需要刷新以确保数据一致性
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
        }, 2000);
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

    // 外部钱包过滤
    const filteredExternalWallets = computed(() => {
      if (!externalWalletSearch.value) {
        return externalWallets.value;
      }
      const searchTerm = externalWalletSearch.value.toLowerCase();
      return externalWallets.value.filter(
        (wallet) =>
          wallet.name.toLowerCase().includes(searchTerm) ||
          wallet.address.toLowerCase().includes(searchTerm)
      );
    });

    // 管理员权限
    const isAdmin = computed(() => store.getters.isAdmin);

    // 密码表单验证
    const isPasswordFormValid = computed(() => {
      return (
        passwordForm.value.password &&
        passwordForm.value.confirmPassword &&
        passwordForm.value.password === passwordForm.value.confirmPassword
      );
    });

    // 批量密码表单验证
    const isBatchFormValid = computed(() => {
      if (useSharedPassword.value) {
        return sharedPassword.value.trim().length > 0;
      }
      return selectedWallets.value.every((walletName) =>
        batchPasswordForms.value[walletName]?.password?.trim()
      );
    });

    // 获取缺失密码的钱包列表
    const getMissingPasswordWallets = () => {
      if (useSharedPassword.value) {
        return sharedPassword.value.trim() ? [] : ["请输入统一密码"];
      }
      return selectedWallets.value.filter(
        (walletName) => !batchPasswordForms.value[walletName]?.password?.trim()
      );
    };

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
      transferForm.value.alias = wallet.coldkey_name; // alias使用coldkey_name
      fromWalletSearch.value = wallet.coldkey_name;
      selectedFromWallet.value = wallet;
      fromWalletDropdownOpen.value = false;
    };

    const selectToWallet = (wallet) => {
      transferForm.value.to = wallet.coldkey_address; // to使用coldkey_address
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
      transferForm.value.alias = ""; // 清空alias字段（存储coldkey_name）
      selectedFromWallet.value = null;
    };

    const clearToWalletSearch = () => {
      toWalletSearch.value = "";
      transferForm.value.to = ""; // 清空to字段（存储coldkey_address）
      selectedToWallet.value = null;
    };

    // 外部钱包相关方法
    const selectExternalWallet = (wallet) => {
      transferForm.value.to = wallet.address; // 外部钱包使用address
      externalWalletSearch.value = wallet.name;
      selectedExternalWallet.value = wallet;
      externalWalletDropdownOpen.value = false;
    };

    const clearExternalWalletSearch = () => {
      externalWalletSearch.value = "";
      transferForm.value.to = "";
      selectedExternalWallet.value = null;
    };

    const switchToWalletTab = (tab) => {
      toWalletTab.value = tab;
      // 清空当前选择
      transferForm.value.to = "";
      selectedToWallet.value = null;
      selectedExternalWallet.value = null;
      // 清空搜索
      toWalletSearch.value = "";
      externalWalletSearch.value = "";
      // 关闭下拉
      toWalletDropdownOpen.value = false;
      externalWalletDropdownOpen.value = false;
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
      if (
        !target.closest(".wallet-search-container") &&
        !target.closest(".wallet-tabs")
      ) {
        fromWalletDropdownOpen.value = false;
        toWalletDropdownOpen.value = false;
        removeWalletDropdownOpen.value = false;
        externalWalletDropdownOpen.value = false;
      }
    };

    // 初始化模态框时重置搜索状态
    const resetTransferSearchStates = () => {
      fromWalletSearch.value = "";
      toWalletSearch.value = "";
      externalWalletSearch.value = "";
      fromWalletDropdownOpen.value = false;
      toWalletDropdownOpen.value = false;
      externalWalletDropdownOpen.value = false;
      toWalletTab.value = "local";
    };

    const resetRemoveSearchStates = () => {
      removeWalletSearch.value = "";
      removeWalletDropdownOpen.value = false;
    };

    // 密码管理函数
    const openPasswordModal = (wallet) => {
      currentWallet.value = wallet;
      passwordForm.value = {
        password: "",
        confirmPassword: "",
      };
      passwordSuccessMessage.value = "";
      passwordErrorMessage.value = "";
      showPassword.value = false;
      showConfirmPassword.value = false;
      passwordModalVisible.value = true;
    };

    const closePasswordModal = () => {
      passwordModalVisible.value = false;
      currentWallet.value = null;
      passwordForm.value = {
        password: "",
        confirmPassword: "",
      };
      passwordSuccessMessage.value = "";
      passwordErrorMessage.value = "";
      showPassword.value = false;
      showConfirmPassword.value = false;
    };

    const submitPassword = async () => {
      passwordLoading.value = true;
      passwordErrorMessage.value = "";
      passwordSuccessMessage.value = "";

      try {
        await api.put("/wallets/password", {
          coldkey_name: currentWallet.value.coldkey_name,
          password: passwordForm.value.password,
        });

        passwordSuccessMessage.value = currentWallet.value.has_password
          ? "密码更新成功"
          : "密码设置成功";

        // 更新本地钱包数据
        const walletIndex = allWallets.value.findIndex(
          (w) => w.coldkey_name === currentWallet.value.coldkey_name
        );
        if (walletIndex !== -1) {
          allWallets.value[walletIndex].has_password = true;
        }

        setTimeout(() => {
          closePasswordModal();
        }, 2000);
      } catch (error) {
        passwordErrorMessage.value = handleApiError(error);
      } finally {
        passwordLoading.value = false;
      }
    };

    // Import Wallets函数
    const importWallets = async () => {
      importLoading.value = true;
      importSuccessMessage.value = "";
      importErrorMessage.value = "";

      try {
        await api.post("/wallets/sync");
        importSuccessMessage.value = "钱包导入成功";

        // 成功后刷新钱包列表
        setTimeout(() => {
          fetchAllWallets();
          importSuccessMessage.value = "";
        }, 2000);
      } catch (error) {
        importErrorMessage.value = handleApiError(error);
        setTimeout(() => {
          importErrorMessage.value = "";
        }, 5000);
      } finally {
        importLoading.value = false;
      }
    };

    // 批量选择逻辑函数
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedWallets.value = sortedWallets.value.map(
          (wallet) => wallet.coldkey_name
        );
      } else {
        selectedWallets.value = [];
      }
    };

    const updateSelectAllState = () => {
      const totalWallets = sortedWallets.value.length;
      const selectedCount = selectedWallets.value.length;
      isAllSelected.value = totalWallets > 0 && selectedCount === totalWallets;
    };

    const clearSelection = () => {
      selectedWallets.value = [];
      isAllSelected.value = false;
    };

    const openBatchPasswordModal = () => {
      // 默认关闭共享密码选项
      useSharedPassword.value = false;
      sharedPassword.value = "";
      sharedPasswordVisible.value = false;

      // 初始化批量密码表单
      batchPasswordForms.value = {};
      selectedWallets.value.forEach((walletName) => {
        batchPasswordForms.value[walletName] = {
          password: "",
          showPassword: false,
        };
      });

      batchPasswordModalVisible.value = true;
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchProgress.value = { current: 0, total: 0 };
      batchResults.value = [];
    };

    const closeBatchPasswordModal = () => {
      batchPasswordModalVisible.value = false;
      batchPasswordForms.value = {};
      useSharedPassword.value = false;
      sharedPassword.value = "";
      sharedPasswordVisible.value = false;
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchProgress.value = { current: 0, total: 0 };
      batchResults.value = [];
    };

    // 共享密码模式切换处理
    const onSharedPasswordToggle = () => {
      if (useSharedPassword.value) {
        // 切换到共享模式：清空之前的单独密码输入
        selectedWallets.value.forEach((walletName) => {
          if (batchPasswordForms.value[walletName]) {
            batchPasswordForms.value[walletName].password = "";
          }
        });
      } else {
        // 切换到单独模式：将共享密码应用到所有输入框
        if (sharedPassword.value.trim()) {
          selectedWallets.value.forEach((walletName) => {
            if (batchPasswordForms.value[walletName]) {
              batchPasswordForms.value[walletName].password =
                sharedPassword.value;
            }
          });
        }
      }
    };

    const submitBatchPasswords = async () => {
      batchLoading.value = true;
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchResults.value = [];

      // 准备批量密码数据
      const passwords = selectedWallets.value.map((walletName) => ({
        coldkey_name: walletName,
        password: useSharedPassword.value
          ? sharedPassword.value
          : batchPasswordForms.value[walletName].password,
      }));

      batchProgress.value = { current: 0, total: passwords.length };

      try {
        const response = await api.put("/wallets/password/batch", {
          passwords,
        });
        batchResults.value = response.data.results;

        const successCount = response.data.success_count;
        const failureCount = response.data.failure_count;

        if (failureCount === 0) {
          batchSuccessMessage.value = `成功为 ${successCount} 个钱包设置密码`;

          // 更新本地钱包数据
          selectedWallets.value.forEach((walletName) => {
            const walletIndex = allWallets.value.findIndex(
              (w) => w.coldkey_name === walletName
            );
            if (walletIndex !== -1) {
              allWallets.value[walletIndex].has_password = true;
            }
          });

          setTimeout(() => {
            closeBatchPasswordModal();
            clearSelection();
          }, 2000);
        } else {
          batchErrorMessage.value = `处理完成：${successCount} 个成功，${failureCount} 个失败`;
        }
      } catch (error) {
        batchErrorMessage.value = handleApiError(error);
      } finally {
        batchLoading.value = false;
        batchProgress.value = {
          current: passwords.length,
          total: passwords.length,
        };
      }
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
      // Import相关状态
      importLoading,
      importSuccessMessage,
      importErrorMessage,
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
      filteredExternalWallets,
      // 外部钱包相关状态
      externalWallets,
      toWalletTab,
      externalWalletSearch,
      externalWalletDropdownOpen,
      selectedExternalWallet,
      // 密码管理相关状态
      passwordModalVisible,
      currentWallet,
      passwordForm,
      passwordLoading,
      passwordSuccessMessage,
      passwordErrorMessage,
      showPassword,
      showConfirmPassword,
      isPasswordFormValid,
      // 批量操作相关状态
      selectedWallets,
      isAllSelected,
      batchPasswordModalVisible,
      batchPasswordForms,
      batchLoading,
      batchSuccessMessage,
      batchErrorMessage,
      batchProgress,
      batchResults,
      isBatchFormValid,
      getMissingPasswordWallets,
      // 共享密码相关状态
      useSharedPassword,
      sharedPassword,
      sharedPasswordVisible,
      // 权限相关
      isAdmin,
      // 搜索相关函数
      selectFromWallet,
      selectToWallet,
      selectRemoveWallet,
      clearFromWalletSearch,
      clearToWalletSearch,
      clearRemoveWalletSearch,
      // 外部钱包相关函数
      selectExternalWallet,
      clearExternalWalletSearch,
      switchToWalletTab,
      fetchExternalWallets,
      handleClickOutside,
      resetTransferSearchStates,
      resetRemoveSearchStates,
      // 密码管理函数
      openPasswordModal,
      closePasswordModal,
      submitPassword,
      // 批量操作函数
      toggleSelectAll,
      updateSelectAllState,
      clearSelection,
      openBatchPasswordModal,
      closeBatchPasswordModal,
      submitBatchPasswords,
      onSharedPasswordToggle,
      // Import函数
      importWallets,
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
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-section h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-section h2 i {
  font-size: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.import-btn,
.transfer-btn,
.remove-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-btn:hover:not(:disabled),
.transfer-btn:hover:not(:disabled),
.remove-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.import-btn:disabled,
.transfer-btn:disabled,
.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

/* Remove Stake模态框 - 固定高度防止大小变动 */
.modal-content.remove-stake-modal {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.modal-content.remove-stake-modal .modal-body {
  flex: 1;
  overflow-y: auto;
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

/* 密码管理样式 */
.password-cell {
  text-align: center;
  padding: 14px 15px;
}

.password-set {
  color: #27ae60;
  font-weight: 600;
  font-family: monospace;
  font-size: 16px;
}

.password-unset {
  color: #7f8c8d;
  font-style: italic;
  font-size: 12px;
}

.actions-cell {
  text-align: center;
  padding: 14px 15px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.edit-btn:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
}

.set-btn {
  background-color: #27ae60;
  color: white;
}

.set-btn:hover {
  background-color: #219a52;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.summary-placeholder {
  background-color: #f8f9fa;
  border-bottom: 2px solid #3498db;
}

/* 密码输入容器 */
.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  flex: 1;
  padding-right: 45px;
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  color: #7f8c8d;
  transition: color 0.2s;
}

.password-toggle-btn:hover {
  color: #3498db;
}

.password-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wallet-info {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.wallet-info p {
  margin: 0;
  color: #2c3e50;
}

/* 输入框错误状态 */
.password-input-container input.error {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

/* 批量操作样式 */
.checkbox-column {
  width: 50px;
  text-align: center;
  padding: 14px 10px;
}

.select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3498db;
}

.batch-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
}

.batch-info {
  display: flex;
  align-items: center;
}

.selected-count {
  font-weight: 600;
  color: white;
  font-size: 14px;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.batch-password-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.batch-password-btn:hover {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  transform: translateY(-1px);
}

.batch-password-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.clear-selection-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.clear-selection-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 批量密码模态框样式 */
.batch-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.batch-info-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.progress-section {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196f3, #1976d2);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.batch-password-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.wallet-password-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  background-color: #fafafa;
}

.wallet-password-item .wallet-name {
  flex: 0 0 150px;
  font-weight: 600;
  color: #333;
  margin-right: 15px;
}

.batch-password-input {
  flex: 1;
  padding: 8px 35px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.batch-password-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* 批量结果显示样式 */
.batch-results {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.batch-results h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.results-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.success-count {
  color: #27ae60;
  font-weight: 600;
}

.failure-count {
  color: #e74c3c;
  font-weight: 600;
}

.results-list {
  max-height: 150px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 14px;
}

.result-item.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.result-item.failure {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.result-item .wallet-name {
  font-weight: 600;
}

.result-item .result-status {
  font-size: 12px;
}

/* 批量表单验证提示样式 */
.missing-passwords {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
  font-family: monospace;
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

/* 共享密码选项样式 */
.shared-password-option {
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.switch-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.switch-container input[type="checkbox"] {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 22px;
  background: #ccc;
  border-radius: 22px;
  transition: background 0.3s;
  margin-right: 10px;
}

.switch-slider::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.switch-container input:checked + .switch-slider {
  background: #2196f3;
}

.switch-container input:checked + .switch-slider::before {
  transform: translateX(22px);
}

.switch-label {
  font-weight: 500;
  color: #333;
}

.shared-password-input-group {
  margin-bottom: 20px;
}

.shared-password-input {
  flex: 1;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.shared-password-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* 钱包标签页样式 */
.wallet-tabs {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #e0e6ed;
}

.tab-button {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #6c757d;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.tab-button.active {
  color: #4361ee;
  border-bottom-color: #4361ee;
  font-weight: 600;
}

.tab-button i {
  font-size: 12px;
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
  }

  .wallet-tabs {
    flex-direction: column;
  }

  .tab-button {
    text-align: left;
    border-bottom: 1px solid #e0e6ed;
    border-right: 2px solid transparent;
  }

  .tab-button.active {
    border-bottom-color: #e0e6ed;
    border-right-color: #4361ee;
  }
}
</style>
