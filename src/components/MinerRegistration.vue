<template>
  <div class="wallet-management-container">
    <!-- 标题和操作按钮 -->
    <div class="header-section">
      <h2>
        <i class="fas fa-hard-hat"></i>
        矿工注册
      </h2>
    </div>

    <!-- 矿工表格 -->
    <div class="wallet-table-container">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading hotkey data...</p>
      </div>

      <div v-else>
        <div class="content-layout">
          <div class="main-content">
        <div class="wallet-count-info">
          <span>Showing all {{ sortedMiners.length }} miners</span>
          <div class="global-controls">
            <button
              class="control-btn expand-all"
              @click="expandAllColdkeys"
              title="展开所有Coldkey"
            >
              <i class="fas fa-expand-arrows-alt"></i>
              展开所有
            </button>
            <button
              class="control-btn collapse-all"
              @click="collapseAllColdkeys"
              title="折叠所有Coldkey"
            >
              <i class="fas fa-compress-arrows-alt"></i>
              折叠所有
            </button>
          </div>
        </div>

        <div class="table-scroll-container">
          <table
            class="wallet-table"
            aria-describedby="wallet-table-description"
          >
            <caption id="wallet-table-description" class="sr-only">
              List of miners for registration
            </caption>
            <thead>
              <tr>
                <th scope="col" class="checkbox-column">
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
                    @click="toggleSort('wallet')"
                    :class="{
                      'sort-active': sortField === 'wallet',
                      'sort-asc':
                        sortField === 'wallet' && sortDirection === 'asc',
                      'sort-desc':
                        sortField === 'wallet' && sortDirection === 'desc',
                    }"
                  >
                    Coldkey Name
                    <span class="sort-icon">{{ getSortIcon("wallet") }}</span>
                  </button>
                </th>
                <th scope="col">Hotkey Name</th>
                <th scope="col">Hotkey Address</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(miners, coldkeyName) in groupedMiners"
                :key="coldkeyName"
              >
                <!-- Coldkey 分组行 -->
                <tr
                  class="coldkey-group-row"
                  @click="toggleColdkeyCollapse(coldkeyName)"
                  :title="
                    isColdkeyCollapsed(coldkeyName)
                      ? '点击展开此Coldkey下的矿工'
                      : '点击折叠此Coldkey下的矿工'
                  "
                >
                  <td class="checkbox-column" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isColdkeySelected(coldkeyName)"
                      :indeterminate="isColdkeyIndeterminate(coldkeyName)"
                      @change="toggleColdkeySelection(coldkeyName)"
                      class="select-checkbox"
                    />
                  </td>
                  <td colspan="4" class="coldkey-group-cell">
                    <div class="coldkey-group-content">
                      <i
                        class="fas collapse-icon"
                        :class="
                          isColdkeyCollapsed(coldkeyName)
                            ? 'fa-chevron-right'
                            : 'fa-chevron-down'
                        "
                      ></i>
                      <strong class="coldkey-name">{{ coldkeyName }}</strong>
                      <span class="coldkey-balance">
                        Free Balance: {{ formatColdkeyBalance(coldkeyName) }}
                      </span>
                      <span class="miner-count"
                        >({{ miners.length }} 个矿工)</span
                      >
                      <div class="coldkey-actions" @click.stop>
                        <button
                          class="action-btn expand-all-btn"
                          @click="expandAllMinersInColdkey(coldkeyName)"
                          title="展开此Coldkey下所有矿工的注册记录"
                          v-if="!isColdkeyCollapsed(coldkeyName)"
                        >
                          <i class="fas fa-expand-alt"></i>
                        </button>
                        <button
                          class="action-btn collapse-all-btn"
                          @click="collapseAllMinersInColdkey(coldkeyName)"
                          title="折叠此Coldkey下所有矿工的注册记录"
                          v-if="!isColdkeyCollapsed(coldkeyName)"
                        >
                          <i class="fas fa-compress-alt"></i>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- 矿工行 - 只在Coldkey未折叠时显示 -->
                <template v-for="miner in miners" :key="miner.id">
                  <template v-if="!isColdkeyCollapsed(coldkeyName)">
                    <!-- 主行：矿工基本信息 -->
                    <tr
                      :id="'miner-row-' + miner.id"
                      class="miner-row"
                      :class="{ expanded: isMinerExpanded(miner.id) }"
                      @click="toggleMinerExpansion(miner.id)"
                      :title="
                        isMinerExpanded(miner.id)
                          ? '点击收起注册记录'
                          : '点击展开注册记录'
                      "
                    >
                      <td class="checkbox-column" @click.stop>
                        <input
                          type="checkbox"
                          :value="miner.id"
                          v-model="selectedMiners"
                          @change="updateSelectAllState"
                          class="select-checkbox"
                        />
                      </td>
                      <td class="miner-wallet-cell">{{ miner.wallet }}</td>
                      <td>{{ miner.name }}</td>
                      <td class="address-cell">{{ miner.hotkey }}</td>
                      <td class="actions-cell" @click.stop>
                        <button
                          class="register-btn"
                          @click="registerMiner(miner)"
                          :disabled="isRegistering(miner.id)"
                        >
                          <span
                            v-if="isRegistering(miner.id)"
                            class="spinner"
                            aria-hidden="true"
                          ></span>
                          <span>{{
                            isRegistering(miner.id) ? "注册中..." : "注册"
                          }}</span>
                        </button>
                      </td>
                    </tr>

                    <!-- 展开行：注册记录 -->
                    <tr
                      v-if="isMinerExpanded(miner.id)"
                      class="registration-details-row"
                    >
                      <td colspan="5" class="registration-details-cell">
                        <div class="registration-records">
                          <div
                            v-if="
                              !miner.registrations ||
                              miner.registrations.length === 0
                            "
                            class="no-records"
                          >
                            <i class="fas fa-info-circle"></i>
                            <span>暂无注册记录</span>
                          </div>
                          <div v-else class="records-container">
                            <div
                              v-for="registration in miner.registrations
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(b.created_at) -
                                    new Date(a.created_at)
                                )"
                              :key="registration.id"
                              :id="'registration-card-' + registration.id"
                              class="registration-card"
                              :class="{
                                disabled: ['cancelled', 'completed'].includes(
                                  registration.task_status
                                ),
                              }"
                            >
                              <div class="card-header">
                                <div class="status-info">
                                  <span
                                    class="status-badge"
                                    :class="
                                      getStatusInfo(registration).className
                                    "
                                  >
                                    {{ getStatusInfo(registration).text }}
                                  </span>
                                  <span class="registration-id"
                                    >#{{ registration.id }}</span
                                  >
                                </div>
                                <div class="card-actions">
                                  <div class="action-buttons">
                                    <!-- 编辑按钮 - pending、running、failed、paused状态可编辑 -->
                                    <button
                                      v-if="canEditRegistration(registration)"
                                      class="action-btn edit-btn"
                                      @click="
                                        editRegistration(registration, miner)
                                      "
                                      :disabled="
                                        isRegistrationOperating(registration.id)
                                      "
                                      title="编辑注册记录"
                                    >
                                      <span
                                        v-if="
                                          isRegistrationOperating(
                                            registration.id
                                          )
                                        "
                                        class="spinner"
                                        aria-hidden="true"
                                      ></span>
                                      <i v-else class="fas fa-edit"></i>
                                      <span>编辑</span>
                                    </button>

                                    <!-- 暂停按钮 - pending、running、failed状态可暂停 -->
                                    <button
                                      v-if="canPauseRegistration(registration)"
                                      class="action-btn pause-btn"
                                      @click="pauseRegistration(registration)"
                                      :disabled="
                                        isRegistrationOperating(registration.id)
                                      "
                                      title="暂停注册"
                                    >
                                      <span
                                        v-if="
                                          isRegistrationOperating(
                                            registration.id
                                          )
                                        "
                                        class="spinner"
                                        aria-hidden="true"
                                      ></span>
                                      <i v-else class="fas fa-pause"></i>
                                      <span>暂停</span>
                                    </button>

                                    <!-- 恢复按钮 - paused状态可恢复 -->
                                    <button
                                      v-if="canResumeRegistration(registration)"
                                      class="action-btn resume-btn"
                                      @click="resumeRegistration(registration)"
                                      :disabled="
                                        isRegistrationOperating(registration.id)
                                      "
                                      title="恢复注册"
                                    >
                                      <span
                                        v-if="
                                          isRegistrationOperating(
                                            registration.id
                                          )
                                        "
                                        class="spinner"
                                        aria-hidden="true"
                                      ></span>
                                      <i v-else class="fas fa-play"></i>
                                      <span>恢复</span>
                                    </button>

                                    <!-- 取消按钮 - pending、running、failed、paused状态可取消 -->
                                    <button
                                      v-if="canCancelRegistration(registration)"
                                      class="action-btn cancel-btn"
                                      @click="cancelRegistration(registration)"
                                      :disabled="
                                        isRegistrationOperating(registration.id)
                                      "
                                      title="取消注册"
                                    >
                                      <span
                                        v-if="
                                          isRegistrationOperating(
                                            registration.id
                                          )
                                        "
                                        class="spinner"
                                        aria-hidden="true"
                                      ></span>
                                      <i v-else class="fas fa-stop"></i>
                                      <span>取消</span>
                                    </button>

                                    <!-- 删除按钮 - 终态记录可删除 -->
                                    <button
                                      v-if="canDeleteRegistration(registration)"
                                      class="action-btn delete-btn"
                                      @click="deleteRegistration(registration)"
                                      :disabled="
                                        isRegistrationOperating(registration.id)
                                      "
                                      title="删除记录"
                                    >
                                      <span
                                        v-if="
                                          isRegistrationOperating(
                                            registration.id
                                          )
                                        "
                                        class="spinner"
                                        aria-hidden="true"
                                      ></span>
                                      <i v-else class="fas fa-trash"></i>
                                      <span>删除</span>
                                    </button>
                                  </div>
                                </div>
                                <div class="created-time">
                                  {{ formatDateTime(registration.created_at) }}
                                </div>
                              </div>
                              <div class="card-body">
                                <div class="info-grid">
                                  <div class="info-item">
                                    <label>网络:</label>
                                    <span>{{ registration.network }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>子网:</label>
                                    <span>{{ registration.subnet }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>UID:</label>
                                    <span>{{ registration.uid || "-" }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>最大费用:</label>
                                    <span>{{ registration.max_fee }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>开始时间:</label>
                                    <span>{{
                                      formatDateTime(registration.start_time)
                                    }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>结束时间:</label>
                                    <span>{{
                                      formatDateTime(registration.end_time)
                                    }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>注册时间:</label>
                                    <span>{{
                                      formatDateTime(
                                        registration.registered_time
                                      )
                                    }}</span>
                                  </div>
                                  <div class="info-item">
                                    <label>注册状态:</label>
                                    <span>{{
                                      registration.registered
                                        ? "已注册"
                                        : "未注册"
                                    }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </template>
              </template>
            </tbody>
            <!-- 合计行 -->
            <tfoot v-if="sortedMiners.length > 0">
              <tr class="summary-row">
                <td class="summary-label" colspan="5">
                  <strong>Total ({{ sortedMiners.length }} miners)</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 批量操作栏 -->
        <transition name="fade">
          <div v-if="selectedMiners.length > 0" class="batch-actions-bar">
            <div class="batch-info">
              <span class="selected-count"
                >已选择 {{ selectedMiners.length }} 个矿工</span
              >
            </div>
            <div class="batch-buttons">
              <button
                class="batch-register-btn"
                @click="openBatchRegisterModal"
                :disabled="batchLoading"
              >
                <span
                  v-if="batchLoading"
                  class="spinner"
                  aria-hidden="true"
                ></span>
                <span>{{ batchLoading ? "注册中..." : "批量注册矿工" }}</span>
              </button>
              <button class="clear-selection-btn" @click="clearSelection">
                取消选择
              </button>
            </div>
          </div>
        </transition>
          </div>

          <aside class="status-sidebar">
            <h3 class="status-title">
              <i class="fas fa-clipboard-list"></i>
              Registration Status
            </h3>

            <div v-if="statusLoading" class="status-loading">
              <div class="spinner"></div>
              <span>Loading overview...</span>
            </div>
            <div v-else>
              <div
                v-for="status in statusOrder"
                :key="status"
                class="status-card"
                :class="status"
              >
                <div class="status-card-header" @click="toggleStatusExpand(status)">
                  <div class="status-labels">
                    <span class="status-name">{{ status }}</span>
                    <span class="status-count">{{
                      statusOverview[status]?.count || 0
                    }}</span>
                  </div>
                  <i
                    class="fas"
                    :class="isStatusExpanded(status) ? 'fa-chevron-up' : 'fa-chevron-down'"
                  ></i>
                </div>
                <transition name="fade">
                  <div v-if="isStatusExpanded(status)" class="status-items">
                    <div
                      v-if="(statusOverview[status]?.items || []).length === 0"
                      class="no-items"
                    >
                      <i class="fas fa-info-circle"></i>
                      <span>No miners</span>
                    </div>
                    <ul v-else>
                      <li
                        v-for="item in statusOverview[status].items"
                        :key="`${status}-${item.miner_id}`"
                        class="status-item"
                        @click="jumpToStatusRecord(status, item.miner_id)"
                      >
                        <div class="item-name">{{ item.hotkey_name }}</div>
                        <div class="item-address">{{ item.hotkey_address }}</div>
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
            </div>

            <div class="history-section">
              <h3 class="history-title">
                <i class="fas fa-clock"></i>
                Submitted Registrations
              </h3>

              <div class="history-meta">
                <span class="history-count"
                  >{{ registrationHistory.length }} records</span
                >
                <button
                  v-if="registrationHistory.length > registrationHistoryLimit"
                  type="button"
                  class="history-toggle"
                  @click="
                    showAllRegistrationHistory = !showAllRegistrationHistory
                  "
                >
                  {{ showAllRegistrationHistory ? "Show Less" : "Show All" }}
                </button>
              </div>

              <div class="history-list">
                <div v-if="registrationHistory.length === 0" class="no-items">
                  <i class="fas fa-info-circle"></i>
                  <span>No records</span>
                </div>
                <ul v-else>
                  <li
                    v-for="record in displayedRegistrationHistory"
                    :key="`${record.miner_id}-${record.id}`"
                    class="history-item"
                    @click="jumpToRegistrationCard(record.miner_id, record.id)"
                  >
                    <div class="history-item-header">
                      <span
                        class="status-badge"
                        :class="getStatusInfo(record).className"
                      >
                        {{ record.task_status || "unknown" }}
                      </span>
                      <span class="history-reg-id">#{{ record.id }}</span>
                    </div>
                    <div class="history-item-body">
                      <div class="history-hotkey">
                        {{ record.hotkey_name }}
                        <span class="history-coldkey"
                          >({{ record.coldkey_name }})</span
                        >
                      </div>
                      <div class="history-address">
                        {{ record.hotkey_address }}
                      </div>
                      <div class="history-params">
                        <span>{{ record.network }}</span>
                        <span>subnet {{ record.subnet }}</span>
                        <span>max_fee {{ record.max_fee }}</span>
                      </div>
                      <div class="history-time">
                        {{ formatDateTime(record.created_at) }}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <!-- 矿工注册模态框 -->
    <div v-if="showRegisterModal" class="modal-overlay">
      <div class="modal-content register-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-hard-hat"></i>
            矿工注册
          </h3>
          <button class="close-btn" @click="closeRegisterModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="miner-info-section">
            <h4>矿工信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Coldkey Name:</label>
                <span>{{ selectedMiner?.wallet }}</span>
              </div>
              <div class="info-item">
                <label>Hotkey Name:</label>
                <span>{{ selectedMiner?.name }}</span>
              </div>
              <div class="info-item address-item">
                <label>Hotkey Address:</label>
                <span class="address-text">{{ selectedMiner?.hotkey }}</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>注册参数</h4>
            <form @submit.prevent="confirmRegister">
              <div class="form-group">
                <label for="subnet">Subnet *</label>
                <input
                  id="subnet"
                  type="number"
                  v-model.number="registerForm.subnet"
                  required
                  min="1"
                  class="form-control"
                  :class="{ 'is-invalid': fieldErrors.subnet }"
                  placeholder="请输入子网ID"
                  @blur="validateField('subnet')"
                  @input="validateField('subnet')"
                />
                <div v-if="fieldErrors.subnet" class="field-error">
                  {{ fieldErrors.subnet }}
                </div>
              </div>

              <div class="form-group">
                <label for="max_fee">Max Fee *</label>
                <input
                  id="max_fee"
                  type="number"
                  v-model.number="registerForm.max_fee"
                  required
                  min="0"
                  step="0.01"
                  class="form-control"
                  :class="{ 'is-invalid': fieldErrors.max_fee }"
                  placeholder="请输入最大费用"
                  @blur="validateField('max_fee')"
                  @input="validateField('max_fee')"
                />
                <div v-if="fieldErrors.max_fee" class="field-error">
                  {{ fieldErrors.max_fee }}
                </div>
              </div>

              <div class="form-group">
                <label for="network">Network *</label>
                <select
                  id="network"
                  v-model="registerForm.network"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': fieldErrors.network }"
                  @change="validateField('network')"
                >
                  <option value="">请选择网络</option>
                  <option value="test">test</option>
                  <option value="finney">finney</option>
                  <option value="local">local</option>
                  <option value="archive">archive</option>
                </select>
                <div v-if="fieldErrors.network" class="field-error">
                  {{ fieldErrors.network }}
                </div>
              </div>

              <div class="form-group">
                <label for="start_time">Start Time (可选)</label>
                <input
                  id="start_time"
                  type="datetime-local"
                  v-model="registerForm.start_time"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="end_time">End Time (可选)</label>
                <input
                  id="end_time"
                  type="datetime-local"
                  v-model="registerForm.end_time"
                  class="form-control"
                />
              </div>
            </form>
          </div>

          <!-- 注册操作状态提示 -->
          <transition name="fade">
            <div v-if="registerSuccessMessage" class="success-message">
              <span class="success-icon" aria-hidden="true">✓</span>
              <span>{{ registerSuccessMessage }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="registerError" class="error-message">
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ registerError }}</span>
            </div>
          </transition>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeRegisterModal"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmRegister"
            :disabled="registerLoading || !isFormValid"
          >
            <span
              v-if="registerLoading"
              class="spinner"
              aria-hidden="true"
            ></span>
            <span>{{ registerLoading ? "注册中..." : "确认注册" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 批量注册模态框 -->
    <div v-if="batchRegisterModalVisible" class="modal-overlay">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h2>
            <i class="fas fa-hard-hat"></i>
            批量注册矿工
          </h2>
          <button class="close-btn" @click="closeBatchRegisterModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 选中矿工信息 -->
          <div class="batch-info-section">
            <p>
              <strong>已选择 {{ selectedMiners.length }} 个矿工</strong>
            </p>
            <div class="selected-miners-list">
              <span
                v-for="minerId in selectedMiners"
                :key="minerId"
                class="miner-tag"
              >
                {{
                  allMiners.find((m) => m.id === minerId)?.wallet ||
                  `ID: ${minerId}`
                }}
              </span>
            </div>
          </div>

          <!-- 参数模式切换 -->
          <div class="shared-params-option">
            <label class="switch-container">
              <input
                type="checkbox"
                v-model="useSharedParams"
                @change="onSharedParamsToggle"
              />
              <span class="switch-slider"></span>
              <span class="switch-label">使用统一注册参数</span>
            </label>
          </div>

          <!-- 统一参数表单 -->
          <div v-if="useSharedParams" class="shared-params-form">
            <h4>注册参数</h4>

            <!-- Subnet -->
            <div class="form-group">
              <label for="batch-subnet">Subnet *</label>
              <input
                id="batch-subnet"
                type="number"
                v-model.number="sharedRegisterForm.subnet"
                placeholder="请输入子网ID"
                min="1"
                required
              />
            </div>

            <!-- Max Fee -->
            <div class="form-group">
              <label for="batch-max-fee">Max Fee *</label>
              <input
                id="batch-max-fee"
                type="number"
                v-model.number="sharedRegisterForm.max_fee"
                placeholder="请输入最大费用"
                min="0"
                step="0.01"
                required
              />
            </div>

            <!-- Network -->
            <div class="form-group">
              <label for="batch-network">Network *</label>
              <select
                id="batch-network"
                v-model="sharedRegisterForm.network"
                required
              >
                <option value="">请选择网络</option>
                <option value="test">test</option>
                <option value="finney">finney</option>
                <option value="local">local</option>
                <option value="archive">archive</option>
              </select>
            </div>

            <!-- Start Time -->
            <div class="form-group">
              <label for="batch-start-time">Start Time (可选)</label>
              <input
                id="batch-start-time"
                type="datetime-local"
                v-model="sharedRegisterForm.start_time"
              />
            </div>

            <!-- End Time -->
            <div class="form-group">
              <label for="batch-end-time">End Time (可选)</label>
              <input
                id="batch-end-time"
                type="datetime-local"
                v-model="sharedRegisterForm.end_time"
              />
            </div>
          </div>

          <!-- 单独参数表单 -->
          <div v-else class="individual-params-list">
            <template v-for="minerId in selectedMiners" :key="minerId">
              <div
                v-if="
                  batchRegisterForms[minerId] &&
                  allMiners.find((m) => m.id === minerId)
                "
                class="miner-params-item"
              >
                <div class="miner-info">
                  <h5>{{ allMiners.find((m) => m.id === minerId)?.wallet }}</h5>
                  <span class="miner-details"
                    >{{ allMiners.find((m) => m.id === minerId)?.name }} -
                    {{
                      allMiners.find((m) => m.id === minerId)?.hotkey
                        ? allMiners
                            .find((m) => m.id === minerId)
                            .hotkey.substring(0, 10) + "..."
                        : "无hotkey"
                    }}</span
                  >
                </div>

                <div class="params-form">
                  <!-- Subnet -->
                  <div class="form-group">
                    <label>Subnet *</label>
                    <input
                      type="number"
                      v-model.number="batchRegisterForms[minerId].subnet"
                      placeholder="请输入子网ID"
                      min="1"
                      required
                    />
                  </div>

                  <!-- Max Fee -->
                  <div class="form-group">
                    <label>Max Fee *</label>
                    <input
                      type="number"
                      v-model.number="batchRegisterForms[minerId].max_fee"
                      placeholder="请输入最大费用"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <!-- Network -->
                  <div class="form-group">
                    <label>Network *</label>
                    <select
                      v-model="batchRegisterForms[minerId].network"
                      required
                    >
                      <option value="">请选择网络</option>
                      <option value="test">test</option>
                      <option value="finney">finney</option>
                      <option value="local">local</option>
                      <option value="archive">archive</option>
                    </select>
                  </div>

                  <!-- Start Time -->
                  <div class="form-group">
                    <label>Start Time (可选)</label>
                    <input
                      type="datetime-local"
                      v-model="batchRegisterForms[minerId].start_time"
                    />
                  </div>

                  <!-- End Time -->
                  <div class="form-group">
                    <label>End Time (可选)</label>
                    <input
                      type="datetime-local"
                      v-model="batchRegisterForms[minerId].end_time"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 成功消息 -->
          <transition name="fade">
            <div v-if="batchSuccessMessage" class="success-message">
              <span class="success-icon" aria-hidden="true">✅</span>
              <span>{{ batchSuccessMessage }}</span>
            </div>
          </transition>

          <!-- 错误消息 -->
          <transition name="fade">
            <div v-if="batchErrorMessage" class="error-message">
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ batchErrorMessage }}</span>
            </div>
          </transition>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeBatchRegisterModal"
            :disabled="batchLoading"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="submitBatchRegister"
            :disabled="!isBatchFormValid || batchLoading"
          >
            <span v-if="batchLoading" class="spinner" aria-hidden="true"></span>
            <span>{{ batchLoading ? "注册中..." : "确认批量注册" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑注册记录模态框 -->
    <div v-if="showEditRegistrationModal" class="modal-overlay">
      <div class="modal-content register-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-edit"></i>
            编辑注册记录 #{{ editingRegistration?.id }}
          </h3>
          <button class="close-btn" @click="closeEditRegistrationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="miner-info-section">
            <h4>矿工信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Coldkey Name:</label>
                <span>{{ editingMiner?.wallet }}</span>
              </div>
              <div class="info-item">
                <label>Hotkey Name:</label>
                <span>{{ editingMiner?.name }}</span>
              </div>
              <div class="info-item address-item">
                <label>Hotkey Address:</label>
                <span class="address-text">{{ editingMiner?.hotkey }}</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>注册参数</h4>
            <form @submit.prevent="confirmEditRegistration">
              <div class="form-group">
                <label for="edit-subnet">Subnet *</label>
                <input
                  id="edit-subnet"
                  type="number"
                  v-model.number="registerForm.subnet"
                  required
                  min="1"
                  class="form-control"
                  :class="{ 'is-invalid': fieldErrors.subnet }"
                  placeholder="请输入子网ID"
                  @blur="validateField('subnet')"
                  @input="validateField('subnet')"
                />
                <div v-if="fieldErrors.subnet" class="field-error">
                  {{ fieldErrors.subnet }}
                </div>
              </div>

              <div class="form-group">
                <label for="edit-max_fee">Max Fee *</label>
                <input
                  id="edit-max_fee"
                  type="number"
                  v-model.number="registerForm.max_fee"
                  required
                  min="0"
                  step="0.01"
                  class="form-control"
                  :class="{ 'is-invalid': fieldErrors.max_fee }"
                  placeholder="请输入最大费用"
                  @blur="validateField('max_fee')"
                  @input="validateField('max_fee')"
                />
                <div v-if="fieldErrors.max_fee" class="field-error">
                  {{ fieldErrors.max_fee }}
                </div>
              </div>

              <div class="form-group">
                <label for="edit-network">Network (只读)</label>
                <input
                  id="edit-network"
                  type="text"
                  v-model="registerForm.network"
                  readonly
                  class="form-control readonly"
                  title="网络字段不允许修改"
                />
              </div>

              <div class="form-group">
                <label for="edit-start_time">Start Time (可选)</label>
                <input
                  id="edit-start_time"
                  type="datetime-local"
                  v-model="registerForm.start_time"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="edit-end_time">End Time (可选)</label>
                <input
                  id="edit-end_time"
                  type="datetime-local"
                  v-model="registerForm.end_time"
                  class="form-control"
                />
              </div>
            </form>
          </div>

          <!-- 编辑操作状态提示 -->
          <transition name="fade">
            <div v-if="editSuccessMessage" class="success-message">
              <span class="success-icon" aria-hidden="true">✓</span>
              <span>{{ editSuccessMessage }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="registerError" class="error-message">
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ registerError }}</span>
            </div>
          </transition>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeEditRegistrationModal"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmEditRegistration"
            :disabled="registerLoading || !isFormValid"
          >
            <span
              v-if="registerLoading"
              class="spinner"
              aria-hidden="true"
            ></span>
            <span>{{ registerLoading ? "保存中..." : "保存修改" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 操作确认模态框 -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i
              class="fas"
              :class="{
                'fa-pause': confirmModalData.type === 'pause',
                'fa-play': confirmModalData.type === 'resume',
                'fa-exclamation-triangle': confirmModalData.type === 'cancel',
              }"
            ></i>
            {{ confirmModalData.title }}
          </h3>
          <button class="close-btn" @click="closeConfirmModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="confirm-content">
            <div class="confirm-icon">
              <i
                class="fas"
                :class="{
                  'fa-pause-circle confirm-icon-warning':
                    confirmModalData.type === 'pause',
                  'fa-play-circle confirm-icon-success':
                    confirmModalData.type === 'resume',
                  'fa-exclamation-circle confirm-icon-danger':
                    confirmModalData.type === 'cancel',
                }"
              ></i>
            </div>
            <div class="confirm-message">
              <p
                v-for="line in confirmModalData.message.split('\n')"
                :key="line"
                class="message-line"
              >
                {{ line }}
              </p>
            </div>
          </div>

          <!-- 确认操作状态提示 -->
          <transition name="fade">
            <div v-if="confirmSuccessMessage" class="success-message">
              <span class="success-icon" aria-hidden="true">✓</span>
              <span>{{ confirmSuccessMessage }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="confirmErrorMessage" class="error-message">
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ confirmErrorMessage }}</span>
            </div>
          </transition>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeConfirmModal"
          >
            {{ confirmModalData.cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            :class="confirmModalData.confirmClass"
            @click="handleConfirmAction"
            :disabled="confirmLoading"
          >
            <span
              v-if="confirmLoading"
              class="spinner"
              aria-hidden="true"
            ></span>
            <i
              v-else
              class="fas"
              :class="{
                'fa-pause': confirmModalData.type === 'pause',
                'fa-play': confirmModalData.type === 'resume',
                'fa-stop': confirmModalData.type === 'cancel',
              }"
            ></i>
            {{ confirmLoading ? "处理中..." : confirmModalData.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from "vue";
import api from "@/utils/api";

export default {
  name: "MinerRegistration",
  setup() {
    // 响应式数据
    const allMiners = ref([]);
    const loading = ref(false);
    const selectedMiners = ref([]);
    const sortField = ref("wallet");
    const sortDirection = ref("asc");

    // 展开状态管理
    const expandedMiners = ref(new Set());

    // Coldkey折叠状态管理
    const collapsedColdkeys = ref(new Set());

    // 注册状态汇总
    const statusOrder = [
      "pending",
      "running",
      "paused",
      "cancelled",
      "completed",
      "failed",
    ];
    const createEmptyOverview = () =>
      statusOrder.reduce((acc, key) => {
        acc[key] = { count: 0, items: [] };
        return acc;
      }, {});
    const statusOverview = ref(createEmptyOverview());
    const statusLoading = ref(false);
    const expandedStatuses = ref(new Set());

    // 提交的注册记录（侧边栏时间倒序展示）
    const registrationHistoryLimit = 30;
    const showAllRegistrationHistory = ref(false);

    // 批量操作相关状态
    const batchLoading = ref(false);
    const isAllSelected = ref(false);

    // 批量注册相关状态
    const batchRegisterModalVisible = ref(false);
    const batchSuccessMessage = ref("");
    const registerSuccessMessage = ref("");
    const batchErrorMessage = ref("");
    const batchProgress = ref({ current: 0, total: 0 });
    const batchResults = ref([]);

    // 统一参数模式
    const useSharedParams = ref(true);
    const sharedRegisterForm = ref({
      subnet: null,
      max_fee: null,
      network: "finney",
      start_time: "",
      end_time: "",
    });

    // 单独参数模式
    const batchRegisterForms = ref({});

    // 单个矿工注册状态
    const registeringMiners = ref(new Set());

    // 模态框相关状态
    const showRegisterModal = ref(false);
    const selectedMiner = ref(null);
    const registerLoading = ref(false);
    const registerError = ref("");

    // 注册记录编辑相关状态
    const showEditRegistrationModal = ref(false);
    const editingRegistration = ref(null);
    const editingMiner = ref(null);
    const editSuccessMessage = ref("");
    const editErrorMessage = ref("");

    // 操作确认模态框状态
    const showConfirmModal = ref(false);
    const confirmModalData = ref({
      title: "",
      message: "",
      type: "", // 'pause', 'resume', 'cancel'
      registration: null,
      confirmText: "确认",
      cancelText: "取消",
      confirmClass: "btn-primary",
    });
    const confirmSuccessMessage = ref("");
    const confirmErrorMessage = ref("");
    const confirmLoading = ref(false);

    // 操作状态管理
    const operatingRegistrations = ref(new Set());

    // 注册表单数据
    const registerForm = ref({
      subnet: null,
      max_fee: null,
      network: "finney",
      start_time: "",
      end_time: "",
    });

    // 表单字段验证状态
    const fieldErrors = ref({
      subnet: "",
      max_fee: "",
      network: "",
    });

    // 计算属性
    // 表单验证
    const isFormValid = computed(() => {
      const form = registerForm.value;
      return (
        form.subnet !== null &&
        form.subnet !== "" &&
        form.subnet > 0 &&
        form.max_fee !== null &&
        form.max_fee !== "" &&
        form.max_fee >= 0 &&
        form.network !== "" &&
        form.network !== null
      );
    });

    // 批量表单验证
    const isBatchFormValid = computed(() => {
      if (useSharedParams.value) {
        // 统一参数模式验证
        const form = sharedRegisterForm.value;
        const isBasicValid =
          form.subnet !== null &&
          form.subnet !== "" &&
          form.subnet > 0 &&
          form.max_fee !== null &&
          form.max_fee !== "" &&
          form.max_fee >= 0 &&
          form.network !== "" &&
          form.network !== null;

        // 如果时间字段都有值，验证 end_time > start_time
        if (form.start_time && form.end_time) {
          const startTime = new Date(form.start_time);
          const endTime = new Date(form.end_time);
          return isBasicValid && endTime > startTime;
        }

        return isBasicValid;
      } else {
        // 单独参数模式验证
        return selectedMiners.value.every((minerId) => {
          const form = batchRegisterForms.value[minerId];
          if (!form) return false;

          const isBasicValid =
            form.subnet !== null &&
            form.subnet !== "" &&
            form.subnet > 0 &&
            form.max_fee !== null &&
            form.max_fee !== "" &&
            form.max_fee >= 0 &&
            form.network !== "" &&
            form.network !== null;

          // 如果时间字段都有值，验证 end_time > start_time
          if (form.start_time && form.end_time) {
            const startTime = new Date(form.start_time);
            const endTime = new Date(form.end_time);
            return isBasicValid && endTime > startTime;
          }

          return isBasicValid;
        });
      }
    });

    // 验证单个字段
    const validateField = (fieldName) => {
      const form = registerForm.value;

      switch (fieldName) {
        case "subnet":
          if (
            form.subnet === null ||
            form.subnet === "" ||
            form.subnet === undefined
          ) {
            fieldErrors.value.subnet = "请输入子网ID";
          } else if (form.subnet <= 0) {
            fieldErrors.value.subnet = "子网ID必须大于0";
          } else {
            fieldErrors.value.subnet = "";
          }
          break;

        case "max_fee":
          if (
            form.max_fee === null ||
            form.max_fee === "" ||
            form.max_fee === undefined
          ) {
            fieldErrors.value.max_fee = "请输入最大费用";
          } else if (form.max_fee < 0) {
            fieldErrors.value.max_fee = "最大费用不能为负数";
          } else {
            fieldErrors.value.max_fee = "";
          }
          break;

        case "network":
          if (!form.network || form.network === "") {
            fieldErrors.value.network = "请选择网络";
          } else {
            fieldErrors.value.network = "";
          }
          break;
      }
    };

    // 排序后的矿工列表
    const sortedMiners = computed(() => {
      if (!allMiners.value || allMiners.value.length === 0) {
        return [];
      }

      const minersCopy = [...allMiners.value];

      if (sortField.value === "wallet") {
        minersCopy.sort((a, b) => {
          const nameA = (a.wallet || "").toLowerCase();
          const nameB = (b.wallet || "").toLowerCase();

          if (sortDirection.value === "asc") {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
      }

      return minersCopy;
    });

    // 按Coldkey分组的矿工列表
    const groupedMiners = computed(() => {
      const groups = {};
      sortedMiners.value.forEach((miner) => {
        const coldkey = miner.wallet || "Unknown";
        if (!groups[coldkey]) {
          groups[coldkey] = [];
        }
        groups[coldkey].push(miner);
      });

      // 按coldkey名称排序分组
      const sortedGroups = {};
      Object.keys(groups)
        .sort((a, b) => {
          if (sortDirection.value === "asc") {
            return a.localeCompare(b);
          } else {
            return b.localeCompare(a);
          }
        })
        .forEach((key) => {
          sortedGroups[key] = groups[key];
        });

      return sortedGroups;
    });

    // 每个 coldkey 的自由余额
    const coldkeyBalances = computed(() => {
      const balances = {};
      Object.entries(groupedMiners.value).forEach(([coldkey, miners]) => {
        const balanceMiner = miners.find(
          (m) =>
            m.coldkey_free_balance !== undefined &&
            m.coldkey_free_balance !== null
        );
        balances[coldkey] = balanceMiner
          ? balanceMiner.coldkey_free_balance
          : null;
      });
      return balances;
    });

    const formatColdkeyBalance = (coldkeyName) => {
      const balance = coldkeyBalances.value[coldkeyName];
      if (balance === null || balance === undefined) return "N/A";
      return balance;
    };

    const toTimestamp = (value) => {
      if (!value) return 0;
      const timestamp = new Date(value).getTime();
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    // 按提交时间倒序的注册记录列表（扁平化）
    const registrationHistory = computed(() => {
      const records = [];

      (allMiners.value || []).forEach((miner) => {
        const registrations = Array.isArray(miner.registrations)
          ? miner.registrations
          : [];

        registrations.forEach((registration) => {
          records.push({
            ...registration,
            miner_id: miner.id,
            hotkey_name: miner.name,
            hotkey_address: miner.hotkey,
            coldkey_name: miner.wallet,
          });
        });
      });

      records.sort((a, b) => {
        const timeDiff =
          toTimestamp(b.created_at) - toTimestamp(a.created_at);
        if (timeDiff !== 0) return timeDiff;
        return (b.id ?? 0) - (a.id ?? 0);
      });

      return records;
    });

    const displayedRegistrationHistory = computed(() => {
      if (showAllRegistrationHistory.value) return registrationHistory.value;
      return registrationHistory.value.slice(0, registrationHistoryLimit);
    });

    // 获取注册状态汇总
    const fetchStatusOverview = async () => {
      statusLoading.value = true;
      try {
        const response = await api.get(
          "/wallets/miners/registrations/status-summary"
        );
        statusOverview.value = {
          ...createEmptyOverview(),
          ...response.data,
        };
      } catch (error) {
        console.error("Failed to fetch registration status overview:", error);
      } finally {
        statusLoading.value = false;
      }
    };

    const toggleStatusExpand = (status) => {
      const expanded = new Set(expandedStatuses.value);
      if (expanded.has(status)) {
        expanded.delete(status);
      } else {
        expanded.add(status);
      }
      expandedStatuses.value = expanded;
    };

    const isStatusExpanded = (status) => {
      return expandedStatuses.value.has(status);
    };

    const ensureColdkeyExpanded = (coldkeyName) => {
      if (!coldkeyName) return;
      if (!collapsedColdkeys.value.has(coldkeyName)) return;

      const next = new Set(collapsedColdkeys.value);
      next.delete(coldkeyName);
      collapsedColdkeys.value = next;
    };

    const ensureMinerExpanded = (minerId) => {
      if (!minerId) return;
      if (expandedMiners.value.has(minerId)) return;

      const next = new Set(expandedMiners.value);
      next.add(minerId);
      expandedMiners.value = next;
    };

    const scrollToElement = async (elementId) => {
      if (!elementId) return;
      await nextTick();
      const element = document.getElementById(elementId);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const jumpToRegistrationCard = async (minerId, registrationId) => {
      const miner = (allMiners.value || []).find((m) => m.id === minerId);
      if (!miner) return;

      const coldkeyName = miner.wallet || "Unknown";
      ensureColdkeyExpanded(coldkeyName);
      ensureMinerExpanded(minerId);

      const targetId = registrationId
        ? `registration-card-${registrationId}`
        : `miner-row-${minerId}`;
      await scrollToElement(targetId);
    };

    const jumpToStatusRecord = async (status, minerId) => {
      const miner = (allMiners.value || []).find((m) => m.id === minerId);
      if (!miner) return;

      const coldkeyName = miner.wallet || "Unknown";
      ensureColdkeyExpanded(coldkeyName);
      ensureMinerExpanded(minerId);

      const statusKey = (status || "").toLowerCase();
      const registrations = Array.isArray(miner.registrations)
        ? miner.registrations
        : [];

      const candidates = registrations.filter(
        (r) => (r.task_status || "").toLowerCase() === statusKey
      );

      let targetRegistrationId = null;
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const timeDiff = toTimestamp(b.created_at) - toTimestamp(a.created_at);
          if (timeDiff !== 0) return timeDiff;
          return (b.id ?? 0) - (a.id ?? 0);
        });
        targetRegistrationId = candidates[0].id;
      }

      const targetId = targetRegistrationId
        ? `registration-card-${targetRegistrationId}`
        : `miner-row-${minerId}`;
      await scrollToElement(targetId);
    };

    // 获取所有矿工
    const fetchAllMiners = async () => {
      loading.value = true;
      const timestamp = Date.now();

      try {
        const response = await api.get("/wallets/miners/registrations", {
          params: {
            _: timestamp,
          },
        });

        allMiners.value = response.data;
        fetchStatusOverview();
      } catch (error) {
        console.error("Failed to fetch hotkey data:", error);
      } finally {
        loading.value = false;
      }
    };

    // 切换排序
    const toggleSort = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
      } else {
        sortField.value = field;
        sortDirection.value = "asc";
      }
    };

    // 获取排序图标
    const getSortIcon = (field) => {
      if (sortField.value !== field) return "↕️";
      return sortDirection.value === "asc" ? "↑" : "↓";
    };

    // 切换全选
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedMiners.value = sortedMiners.value.map((miner) => miner.id);
      } else {
        selectedMiners.value = [];
      }
    };

    // 更新全选状态
    const updateSelectAllState = () => {
      const totalMiners = sortedMiners.value.length;
      const selectedCount = selectedMiners.value.length;
      isAllSelected.value = totalMiners > 0 && selectedCount === totalMiners;
    };

    // 清除选择
    const clearSelection = () => {
      selectedMiners.value = [];
      isAllSelected.value = false;
    };

    // 展开/收起矿工注册记录
    const toggleMinerExpansion = (minerId) => {
      const expanded = expandedMiners.value;
      if (expanded.has(minerId)) {
        expanded.delete(minerId);
      } else {
        expanded.add(minerId);
      }
      // 触发响应式更新
      expandedMiners.value = new Set(expanded);
    };

    // 检查矿工是否已展开
    const isMinerExpanded = (minerId) => {
      return expandedMiners.value.has(minerId);
    };

    // Coldkey折叠相关方法
    const toggleColdkeyCollapse = (coldkeyName) => {
      const collapsed = collapsedColdkeys.value;
      if (collapsed.has(coldkeyName)) {
        collapsed.delete(coldkeyName);
      } else {
        collapsed.add(coldkeyName);
      }
      collapsedColdkeys.value = new Set(collapsed);
    };

    const isColdkeyCollapsed = (coldkeyName) => {
      return collapsedColdkeys.value.has(coldkeyName);
    };

    // Coldkey选择相关方法
    const isColdkeySelected = (coldkeyName) => {
      const miners = groupedMiners.value[coldkeyName] || [];
      if (miners.length === 0) return false;
      return miners.every((miner) => selectedMiners.value.includes(miner.id));
    };

    const isColdkeyIndeterminate = (coldkeyName) => {
      const miners = groupedMiners.value[coldkeyName] || [];
      if (miners.length === 0) return false;
      const selectedCount = miners.filter((miner) =>
        selectedMiners.value.includes(miner.id)
      ).length;
      return selectedCount > 0 && selectedCount < miners.length;
    };

    const toggleColdkeySelection = (coldkeyName) => {
      const miners = groupedMiners.value[coldkeyName] || [];
      const isSelected = isColdkeySelected(coldkeyName);

      if (isSelected) {
        // 取消选择该coldkey下的所有矿工
        miners.forEach((miner) => {
          const index = selectedMiners.value.indexOf(miner.id);
          if (index > -1) {
            selectedMiners.value.splice(index, 1);
          }
        });
      } else {
        // 选择该coldkey下的所有矿工
        miners.forEach((miner) => {
          if (!selectedMiners.value.includes(miner.id)) {
            selectedMiners.value.push(miner.id);
          }
        });
      }
      updateSelectAllState();
    };

    // 展开/折叠某个Coldkey下的所有矿工注册记录
    const expandAllMinersInColdkey = (coldkeyName) => {
      const miners = groupedMiners.value[coldkeyName] || [];
      miners.forEach((miner) => {
        expandedMiners.value.add(miner.id);
      });
      expandedMiners.value = new Set(expandedMiners.value);
    };

    const collapseAllMinersInColdkey = (coldkeyName) => {
      const miners = groupedMiners.value[coldkeyName] || [];
      miners.forEach((miner) => {
        expandedMiners.value.delete(miner.id);
      });
      expandedMiners.value = new Set(expandedMiners.value);
    };

    // 全局Coldkey控制方法
    const expandAllColdkeys = () => {
      collapsedColdkeys.value.clear();
      collapsedColdkeys.value = new Set();
    };

    const collapseAllColdkeys = () => {
      const allColdkeys = Object.keys(groupedMiners.value);
      collapsedColdkeys.value = new Set(allColdkeys);
    };

    // 格式化时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return "-";
      const date = new Date(dateTime);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    // 获取状态文本和样式类
    const getStatusInfo = (registration) => {
      const status = registration.task_status || "unknown";
      let className = "status-unknown";
      let text = status;

      switch (status.toLowerCase()) {
        case "pending":
          className = "status-pending";
          text = "等待注册";
          break;
        case "running":
          className = "status-running";
          text = "正在注册";
          break;
        case "paused":
          className = "status-paused";
          text = "已暂停";
          break;
        case "cancelled":
          className = "status-cancelled";
          text = "已取消";
          break;
        case "completed":
          className = "status-completed";
          text = "注册成功";
          break;
        case "failed":
          className = "status-failed";
          text = "注册失败等待重新注册";
          break;
        default:
          text = status;
      }

      return { className, text };
    };

    // 注册记录操作权限判断函数
    const canEditRegistration = (registration) => {
      return ["pending", "running", "failed", "paused"].includes(
        registration.task_status
      );
    };

    const canPauseRegistration = (registration) => {
      return ["pending", "running", "failed"].includes(
        registration.task_status
      );
    };

    const canResumeRegistration = (registration) => {
      return registration.task_status === "paused";
    };

    const canCancelRegistration = (registration) => {
      return ["pending", "running", "failed", "paused"].includes(
        registration.task_status
      );
    };

    const canDeleteRegistration = () => {
      // 软删除：通过取消状态实现，所以这里暂时不显示删除按钮
      return false;
    };

    // 检查注册记录是否正在操作中
    const isRegistrationOperating = (registrationId) => {
      return operatingRegistrations.value.has(registrationId);
    };

    // 编辑注册记录
    const editRegistration = (registration, miner) => {
      editingRegistration.value = registration;
      editingMiner.value = miner;

      // 预填充表单数据（不包括network字段）
      registerForm.value = {
        subnet: registration.subnet,
        max_fee: registration.max_fee,
        network: registration.network, // 只用于显示，不允许修改
        start_time: registration.start_time
          ? new Date(registration.start_time)
              .toLocaleString("sv-SE")
              .replace(" ", "T")
              .slice(0, 16)
          : "",
        end_time: registration.end_time
          ? new Date(registration.end_time)
              .toLocaleString("sv-SE")
              .replace(" ", "T")
              .slice(0, 16)
          : "",
      };

      // 重置验证错误
      fieldErrors.value = {
        subnet: "",
        max_fee: "",
        network: "",
      };

      showEditRegistrationModal.value = true;
      registerError.value = "";
    };

    // 关闭编辑注册记录模态框
    const closeEditRegistrationModal = () => {
      showEditRegistrationModal.value = false;
      editingRegistration.value = null;
      editingMiner.value = null;
      registerError.value = "";
      editSuccessMessage.value = "";
      editErrorMessage.value = "";
    };

    // 显示确认模态框
    const showConfirmationModal = (type, registration) => {
      let title, message, confirmText, confirmClass;

      switch (type) {
        case "pause":
          title = "暂停注册";
          message = `确定要暂停注册记录 #${registration.id} 吗？\n\n暂停后可以随时恢复注册。`;
          confirmText = "暂停";
          confirmClass = "btn-warning";
          break;
        case "resume":
          title = "恢复注册";
          message = `确定要恢复注册记录 #${registration.id} 吗？\n\n恢复后将重新开始注册流程。`;
          confirmText = "恢复";
          confirmClass = "btn-success";
          break;
        case "cancel":
          title = "取消注册";
          message =
            `确定要取消注册记录 #${registration.id} 吗？\n\n` +
            `网络: ${registration.network}\n` +
            `子网: ${registration.subnet}\n` +
            `最大费用: ${registration.max_fee}\n\n` +
            `此操作不可撤销！`;
          confirmText = "取消注册";
          confirmClass = "btn-danger";
          break;
      }

      confirmModalData.value = {
        title,
        message,
        type,
        registration,
        confirmText,
        cancelText: "取消",
        confirmClass,
      };

      showConfirmModal.value = true;
    };

    // 关闭确认模态框
    const closeConfirmModal = () => {
      showConfirmModal.value = false;
      confirmModalData.value = {
        title: "",
        message: "",
        type: "",
        registration: null,
        confirmText: "确认",
        cancelText: "取消",
        confirmClass: "btn-primary",
      };
      confirmSuccessMessage.value = "";
      confirmErrorMessage.value = "";
      confirmLoading.value = false;
    };

    // 确认操作处理
    const handleConfirmAction = async () => {
      const { type, registration } = confirmModalData.value;

      // 清除之前的提示消息
      confirmSuccessMessage.value = "";
      confirmErrorMessage.value = "";
      confirmLoading.value = true;

      let status, actionName;
      switch (type) {
        case "pause":
          status = "paused";
          actionName = "暂停";
          break;
        case "resume":
          status = "pending";
          actionName = "恢复";
          break;
        case "cancel":
          status = "cancelled";
          actionName = "取消";
          break;
      }

      try {
        await api.put(
          `/wallets/miners/registrations/${registration.id}/status`,
          {
            status: status,
          }
        );

        await fetchAllMiners();
        confirmSuccessMessage.value = `注册记录 #${registration.id} ${actionName}成功！`;

        setTimeout(() => {
          closeConfirmModal();
        }, 1500);
      } catch (error) {
        console.error(`${actionName}失败:`, error);
        confirmErrorMessage.value =
          error.response?.data?.message ||
          error.message ||
          `${actionName}失败，请重试`;
      } finally {
        confirmLoading.value = false;
      }
    };

    // 暂停注册记录
    const pauseRegistration = (registration) => {
      showConfirmationModal("pause", registration);
    };

    // 恢复注册记录
    const resumeRegistration = (registration) => {
      showConfirmationModal("resume", registration);
    };

    // 取消注册记录
    const cancelRegistration = (registration) => {
      showConfirmationModal("cancel", registration);
    };

    // 删除注册记录（软删除，实际上是取消）
    const deleteRegistration = (registration) => {
      // 由于使用软删除，这个函数暂时不使用
      cancelRegistration(registration);
    };

    // 确认编辑注册记录
    const confirmEditRegistration = async () => {
      if (!isFormValid.value || !editingRegistration.value) return;

      registerLoading.value = true;
      registerError.value = "";
      editSuccessMessage.value = "";
      editErrorMessage.value = "";

      try {
        const apiData = {
          subnet: registerForm.value.subnet,
          max_fee: registerForm.value.max_fee,
        };

        // 添加可选的时间字段
        if (registerForm.value.start_time) {
          apiData.start_time = new Date(
            registerForm.value.start_time
          ).toISOString();
        }
        if (registerForm.value.end_time) {
          apiData.end_time = new Date(
            registerForm.value.end_time
          ).toISOString();
        }

        // 调用编辑API
        await api.put(
          `/wallets/miners/registrations/${editingRegistration.value.id}`,
          apiData
        );

        // 刷新数据
        await fetchAllMiners();
        editSuccessMessage.value = `注册记录 #${editingRegistration.value.id} 修改成功！`;

        setTimeout(() => {
          closeEditRegistrationModal();
        }, 1500);
      } catch (error) {
        console.error("注册记录修改失败:", error);
        registerError.value =
          error.response?.data?.message || error.message || "修改失败，请重试";
      } finally {
        registerLoading.value = false;
      }
    };

    // 打开批量注册模态框
    const openBatchRegisterModal = () => {
      if (selectedMiners.value.length === 0) return;

      // 重置统一参数表单
      sharedRegisterForm.value = {
        subnet: null,
        max_fee: null,
        network: "finney",
        start_time: "",
        end_time: "",
      };

      // 初始化单独参数表单
      batchRegisterForms.value = {};
      selectedMiners.value.forEach((minerId) => {
        batchRegisterForms.value[minerId] = {
          subnet: null,
          max_fee: null,
          network: "finney",
          start_time: "",
          end_time: "",
        };
      });

      // 重置状态
      batchRegisterModalVisible.value = true;
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchProgress.value = { current: 0, total: 0 };
      batchResults.value = [];
      useSharedParams.value = true;
    };

    // 关闭批量注册模态框
    const closeBatchRegisterModal = () => {
      batchRegisterModalVisible.value = false;
      sharedRegisterForm.value = {
        subnet: null,
        max_fee: null,
        network: "finney",
        start_time: "",
        end_time: "",
      };
      batchRegisterForms.value = {};
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchProgress.value = { current: 0, total: 0 };
      batchResults.value = [];
      useSharedParams.value = true;
    };

    // 参数模式切换处理
    const onSharedParamsToggle = () => {
      if (!useSharedParams.value) {
        // 切换到单独模式：将统一参数应用到所有输入框
        const sharedForm = sharedRegisterForm.value;
        selectedMiners.value.forEach((minerId) => {
          batchRegisterForms.value[minerId] = {
            subnet: sharedForm.subnet || null,
            max_fee: sharedForm.max_fee || null,
            network: sharedForm.network || "finney",
            start_time: sharedForm.start_time || "",
            end_time: sharedForm.end_time || "",
          };
        });
      }
      // 切换到统一模式时不需要特别处理，因为统一模式不使用batchRegisterForms
    };

    // 提交批量注册
    const submitBatchRegister = async () => {
      if (selectedMiners.value.length === 0) return;

      batchLoading.value = true;
      batchSuccessMessage.value = "";
      batchErrorMessage.value = "";
      batchResults.value = [];

      try {
        // 准备批量注册数据
        const registrations = selectedMiners.value
          .map((minerId) => {
            // 根据ID找到对应的矿工对象
            const miner = allMiners.value.find((m) => m.id === minerId);
            if (!miner) {
              console.error("找不到矿工对象，ID:", minerId);
              return null;
            }

            let formData;

            if (useSharedParams.value) {
              // 使用统一参数
              formData = sharedRegisterForm.value;
            } else {
              // 使用单独参数
              formData = batchRegisterForms.value[minerId];
            }

            const apiData = {
              miner_id: miner.id,
              subnet: formData.subnet,
              max_fee: formData.max_fee,
              network: formData.network,
            };

            // 处理可选的时间字段
            if (formData.start_time) {
              apiData.start_time = new Date(formData.start_time).toISOString();
            }
            if (formData.end_time) {
              apiData.end_time = new Date(formData.end_time).toISOString();
            }

            return apiData;
          })
          .filter(Boolean); // 过滤掉null值

        batchProgress.value = { current: 0, total: registrations.length };

        // 调用批量注册API
        await api.post("/wallets/miners/registrations/batch", {
          registrations,
        });

        // 提交注册请求成功
        batchSuccessMessage.value = `成功提交 ${selectedMiners.value.length} 个注册请求！`;

        // 刷新矿工列表
        await fetchAllMiners();

        // 2秒后自动关闭模态框并清除选择
        setTimeout(() => {
          closeBatchRegisterModal();
          clearSelection();
        }, 2000);
      } catch (error) {
        console.error("批量注册失败:", error);
        if (error.response?.data) {
          console.error("错误详情:", error.response.data);
        }

        batchErrorMessage.value =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "批量注册失败，请重试";
      } finally {
        batchLoading.value = false;
      }
    };

    // 检查矿工是否正在注册
    const isRegistering = (minerId) => {
      return registeringMiners.value.has(minerId);
    };

    // 打开注册模态框
    const registerMiner = (miner) => {
      selectedMiner.value = miner;
      registerError.value = "";
      // 重置表单
      registerForm.value = {
        subnet: null,
        max_fee: null,
        network: "finney",
        start_time: "",
        end_time: "",
      };
      // 重置验证错误
      fieldErrors.value = {
        subnet: "",
        max_fee: "",
        network: "",
      };
      showRegisterModal.value = true;
    };

    // 关闭注册模态框
    const closeRegisterModal = () => {
      showRegisterModal.value = false;
      selectedMiner.value = null;
      registerError.value = "";
      registerSuccessMessage.value = "";
    };

    // 确认注册矿工
    const confirmRegister = async () => {
      if (!isFormValid.value || !selectedMiner.value) return;

      registerLoading.value = true;
      registerError.value = "";
      registerSuccessMessage.value = "";

      try {
        // 准备API数据
        const apiData = {
          miner_id: selectedMiner.value.id,
          subnet: registerForm.value.subnet,
          max_fee: registerForm.value.max_fee,
          network: registerForm.value.network,
        };

        // 添加可选的时间字段
        if (registerForm.value.start_time) {
          apiData.start_time = new Date(
            registerForm.value.start_time
          ).toISOString();
        }
        if (registerForm.value.end_time) {
          apiData.end_time = new Date(
            registerForm.value.end_time
          ).toISOString();
        }

        // 调用注册API
        await api.post("/wallets/miners/registrations", apiData);

        // 注册成功后刷新数据
        await fetchAllMiners();

        // 保存矿工信息用于成功提示
        const minerInfo = {
          name: selectedMiner.value.name,
          wallet: selectedMiner.value.wallet,
        };

        // 显示成功提示
        registerSuccessMessage.value = `提交 ${minerInfo.name} (${minerInfo.wallet}) 注册请求成功！`;

        setTimeout(() => {
          closeRegisterModal();
        }, 1500);
      } catch (error) {
        console.error("矿工注册失败:", error);
        registerError.value =
          error.response?.data?.message || error.message || "注册失败，请重试";
      } finally {
        registerLoading.value = false;
      }
    };

    // 组件挂载时获取数据
    onMounted(() => {
      fetchAllMiners();
    });

    return {
      // 数据
      allMiners,
      loading,
      selectedMiners,
      sortField,
      sortDirection,
      statusOverview,
      statusOrder,
      statusLoading,
      registrationHistory,
      displayedRegistrationHistory,
      showAllRegistrationHistory,
      registrationHistoryLimit,
      batchLoading,

      // 计算属性
      sortedMiners,
      groupedMiners,
      coldkeyBalances,
      isAllSelected,

      // 方法
      fetchAllMiners,
      fetchStatusOverview,
      toggleSort,
      getSortIcon,
      toggleSelectAll,
      updateSelectAllState,
      clearSelection,

      // 展开相关方法
      expandedMiners,
      toggleMinerExpansion,
      isMinerExpanded,

      // Coldkey相关方法
      collapsedColdkeys,
      toggleColdkeyCollapse,
      isColdkeyCollapsed,
      isColdkeySelected,
      isColdkeyIndeterminate,
      toggleColdkeySelection,
      expandAllMinersInColdkey,
      collapseAllMinersInColdkey,
      expandAllColdkeys,
      collapseAllColdkeys,
      toggleStatusExpand,
      isStatusExpanded,
      jumpToStatusRecord,
      jumpToRegistrationCard,
      formatColdkeyBalance,
      formatDateTime,
      getStatusInfo,
      openBatchRegisterModal,
      closeBatchRegisterModal,
      isRegistering,
      registerMiner,
      closeRegisterModal,
      confirmRegister,

      // 单个注册模态框相关数据
      showRegisterModal,
      selectedMiner,
      registerLoading,
      registerError,
      registerSuccessMessage,
      registerForm,
      isFormValid,
      fieldErrors,
      validateField,

      // 批量注册相关数据
      batchRegisterModalVisible,
      batchSuccessMessage,
      batchErrorMessage,
      batchProgress,
      batchResults,
      useSharedParams,
      sharedRegisterForm,
      batchRegisterForms,
      isBatchFormValid,
      submitBatchRegister,
      onSharedParamsToggle,

      // 注册记录操作相关
      showEditRegistrationModal,
      editingRegistration,
      editingMiner,
      editSuccessMessage,
      editErrorMessage,
      showConfirmModal,
      confirmModalData,
      confirmSuccessMessage,
      confirmErrorMessage,
      confirmLoading,
      canEditRegistration,
      canPauseRegistration,
      canResumeRegistration,
      canCancelRegistration,
      canDeleteRegistration,
      isRegistrationOperating,
      editRegistration,
      closeEditRegistrationModal,
      confirmEditRegistration,
      showConfirmationModal,
      closeConfirmModal,
      handleConfirmAction,
      pauseRegistration,
      resumeRegistration,
      cancelRegistration,
      deleteRegistration,
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

.wallet-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.content-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.status-sidebar {
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 16px;
  border: 1px solid #e9ecef;
  position: sticky;
  top: 20px;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.status-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
}

.status-loading .spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 123, 255, 0.2);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
}

.status-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e9ecef;
  border-left: 4px solid #007bff;
}

.status-card.pending {
  border-left-color: #f0ad4e;
}

.status-card.running {
  border-left-color: #17a2b8;
}

.status-card.paused {
  border-left-color: #ffc107;
}

.status-card.cancelled {
  border-left-color: #6c757d;
}

.status-card.completed {
  border-left-color: #28a745;
}

.status-card.failed {
  border-left-color: #dc3545;
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #2c3e50;
}

.status-labels {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-name {
  font-weight: 600;
  text-transform: capitalize;
}

.status-count {
  display: inline-block;
  min-width: 32px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 999px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  font-size: 12px;
}

.status-items {
  margin-top: 10px;
}

.status-items ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-item:hover {
  border-color: #cfd4da;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.status-item .item-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.status-item .item-address {
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #6c757d;
  word-break: break-all;
}

.no-items {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 13px;
}

.history-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.history-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #6c757d;
}

.history-toggle {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #007bff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-toggle:hover {
  background: #f8f9fa;
  border-color: #cfd4da;
}

.history-list {
  margin-top: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: #cfd4da;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.history-reg-id {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
}

.history-hotkey {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.history-coldkey {
  font-weight: normal;
  color: #6c757d;
  margin-left: 4px;
}

.history-address {
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #6c757d;
  word-break: break-all;
  margin-bottom: 8px;
}

.history-params {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #495057;
}

.history-params span {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 999px;
  padding: 2px 8px;
}

.history-time {
  font-size: 12px;
  color: #6c757d;
}

@media (max-width: 992px) {
  .content-layout {
    flex-direction: column;
  }

  .status-sidebar {
    width: 100%;
    position: static;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-indicator .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(67, 97, 238, 0.3);
  border-radius: 50%;
  border-top-color: #4361ee;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.wallet-count-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.global-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.control-btn.expand-all {
  background: #28a745;
}

.control-btn.expand-all:hover {
  background: #1e7e34;
}

.control-btn.collapse-all {
  background: #6c757d;
}

.control-btn.collapse-all:hover {
  background: #545b62;
}

.table-scroll-container {
  overflow-x: auto;
}

.wallet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.wallet-table th {
  background: #f8f9fa;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.wallet-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.wallet-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 矿工行样式 */
.miner-row {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.miner-row:hover {
  background-color: #e8f4fd !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  border-left: 4px solid #007bff;
}

.miner-row.expanded {
  background-color: #e3f2fd;
  border-left: 4px solid #007bff;
}

.miner-row:hover::after {
  content: "点击查看注册记录";
  position: absolute;
  right: 140px;
  top: 50%;
  transform: translateY(-50%);
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0.9;
  pointer-events: none;
  z-index: 10;
}

.miner-row.expanded:hover::after {
  content: "点击收起注册记录";
}

/* Coldkey分组行样式 */
.coldkey-group-row {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.coldkey-group-row:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.coldkey-group-cell {
  padding: 16px 12px !important;
  border-bottom: 2px solid #dee2e6 !important;
}

.coldkey-group-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.collapse-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.coldkey-name {
  font-size: 16px;
  color: white;
}

.miner-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: normal;
}

.coldkey-balance {
  font-size: 13px;
  color: #e3f2fd;
  background: rgba(255, 255, 255, 0.12);
  padding: 4px 10px;
  border-radius: 12px;
}

.coldkey-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.coldkey-actions .action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.coldkey-actions .action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

/* 矿工行在分组下的样式调整 */
.miner-wallet-cell {
  padding-left: 24px !important;
  color: #6c757d;
  font-size: 13px;
}

/* 注册记录详情行 */
.registration-details-row {
  background-color: #f8f9fa;
}

.registration-details-cell {
  padding: 0 !important;
  border-bottom: 2px solid #dee2e6;
}

.registration-records {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.no-records {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: #6c757d;
  font-style: italic;
}

.no-records i {
  font-size: 18px;
  color: #adb5bd;
}

.records-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 注册记录卡片 */
.registration-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.registration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-running {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-paused {
  background-color: #ffeaa7;
  color: #856404;
  border: 1px solid #ffd32a;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-failed {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-unknown {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.registration-id {
  font-size: 12px;
  color: #6c757d;
  font-family: monospace;
}

.created-time {
  font-size: 12px;
  color: #6c757d;
}

.card-body {
  padding: 20px;
  background-color: #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #dee2e6;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 60px;
  flex-shrink: 0;
}

.info-item span {
  font-size: 14px;
  color: #212529;
  font-weight: 500;
  word-break: break-all;
  flex: 1;
}

/* Actions列样式 */
.actions-cell {
  text-align: center;
  width: 120px;
}

.register-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;
}

.register-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1e7e34);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.register-btn .spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.checkbox-column {
  width: 50px;
  text-align: center;
}

.select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.sortable-header {
  position: relative;
}

.sort-button {
  background: none;
  border: none;
  color: #495057;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  font-size: 14px;
  transition: color 0.2s ease;
}

.sort-button:hover {
  color: #007bff;
}

.sort-button.sort-active {
  color: #007bff;
}

.sort-icon {
  font-size: 12px;
  opacity: 0.7;
}

.address-cell {
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #6c757d;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-row {
  background: #f8f9fa;
  font-weight: 600;
}

.summary-row td {
  border-top: 2px solid #dee2e6;
  border-bottom: none;
}

.summary-label {
  color: #495057;
}

/* 批量操作样式 */
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
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.selected-count {
  font-weight: 600;
  font-size: 14px;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.batch-register-btn,
.clear-selection-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-register-btn {
  background: #28a745;
  color: white;
}

.batch-register-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.batch-register-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.clear-selection-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.clear-selection-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.batch-register-btn .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wallet-management-container {
    padding: 10px;
  }

  .header-section {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-section h2 {
    font-size: 1.5rem;
  }

  .wallet-table {
    font-size: 12px;
  }

  .wallet-table th,
  .wallet-table td {
    padding: 10px 8px;
  }

  .address-cell {
    max-width: 120px;
  }

  /* 移动端注册记录样式调整 */
  .registration-records {
    padding: 15px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .registration-card {
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .status-info {
    width: 100%;
  }

  /* 移动端隐藏悬停提示 */
  .miner-row:hover::after,
  .miner-row.expanded:hover::after {
    display: none;
  }
}

@media (max-width: 480px) {
  .wallet-table th,
  .wallet-table td {
    padding: 8px 6px;
  }

  .address-cell {
    max-width: 100px;
  }

  /* 小屏幕注册记录样式 */
  .registration-records {
    padding: 10px;
  }

  .registration-card {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    padding: 10px 12px;
  }

  .card-body {
    padding: 12px;
  }

  .info-item label {
    font-size: 11px;
  }

  .info-item span {
    font-size: 13px;
  }

  .status-badge {
    font-size: 11px;
    padding: 3px 6px;
  }
}

/* 模态框样式 */
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
  max-width: 650px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.register-modal {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: white;
  transition: color 0.2s;
  padding: 5px;
}

.close-btn:hover {
  color: #f8f9fa;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.miner-info-section {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.miner-info-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
  flex-shrink: 0;
}

.info-item span {
  color: #2c3e50;
  word-break: break-all;
  flex: 1;
  line-height: 1.4;
}

.address-item {
  align-items: center !important;
}

.address-item label {
  min-width: 100px !important;
  flex-shrink: 0;
}

.address-text {
  font-family: "Courier New", monospace;
  font-size: 0.75rem;
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex: 1;
  word-break: break-all;
}

.form-section h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.1rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
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

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.field-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

/* 操作状态提示样式 - 与钱包管理组件保持一致 */
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

.success-icon,
.error-icon {
  font-size: 1rem;
  font-weight: bold;
}

.modal-footer {
  padding: 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e6ed;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-footer .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 批量注册模态框样式 */
.batch-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.batch-info-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.batch-info-section p {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.selected-miners-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.miner-tag {
  display: inline-block;
  padding: 4px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.shared-params-form {
  margin-bottom: 20px;
}

.shared-params-form h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #34495e;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group input[type="datetime-local"] {
  font-family: inherit;
}

/* 批量注册按钮样式 */
.batch-register-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-register-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1e7e34);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.batch-register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.batch-register-btn .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 参数模式切换样式 */
.shared-params-option {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
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
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  transition: background 0.3s ease;
  margin-right: 12px;
}

.switch-slider::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.switch-container input:checked + .switch-slider {
  background: #2196f3;
}

.switch-container input:checked + .switch-slider::before {
  transform: translateX(26px);
}

.switch-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

/* 单独参数列表样式 */
.individual-params-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.miner-params-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  background: #fafbfc;
}

.miner-info {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e6ed;
}

.miner-info h5 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.miner-details {
  color: #7f8c8d;
  font-size: 12px;
}

.params-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.params-form .form-group {
  margin-bottom: 0;
}

.params-form .form-group label {
  font-size: 12px;
  margin-bottom: 3px;
}

.params-form .form-group input,
.params-form .form-group select {
  padding: 8px 10px;
  font-size: 13px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .params-form {
    grid-template-columns: 1fr;
  }

  .individual-params-list {
    max-height: 300px;
  }
}

/* 注册记录操作按钮样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  flex-wrap: wrap;
  gap: 8px;
}

.card-actions {
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-btn i {
  font-size: 10px;
}

/* 不同操作按钮的颜色 */
.edit-btn {
  background: #17a2b8;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #138496;
}

.pause-btn {
  background: #ffc107;
  color: #212529;
}

.pause-btn:hover:not(:disabled) {
  background: #e0a800;
}

.resume-btn {
  background: #28a745;
  color: white;
}

.resume-btn:hover:not(:disabled) {
  background: #218838;
}

.cancel-btn {
  background: #fd7e14;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #e8650e;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
}

/* 已完成和已取消状态的记录卡片灰化 */
.registration-card.disabled {
  opacity: 0.6;
  background-color: #f8f9fa;
}

.registration-card.disabled .card-header {
  background-color: #e9ecef;
}

.registration-card.disabled .card-body {
  background-color: #f8f9fa;
}

/* 只读输入框样式 */
.form-control.readonly {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* 全局消息提示样式 */
.global-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  max-width: 500px;
}

/* 操作按钮的加载状态 */
.action-btn .spinner {
  width: 10px;
  height: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 确认模态框样式 */
.confirm-modal {
  max-width: 500px;
  width: 90%;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.confirm-icon {
  margin-bottom: 20px;
}

.confirm-icon i {
  font-size: 48px;
}

.confirm-icon-warning {
  color: #ffc107;
}

.confirm-icon-success {
  color: #28a745;
}

.confirm-icon-danger {
  color: #dc3545;
}

.confirm-message {
  margin-bottom: 20px;
}

.message-line {
  margin: 8px 0;
  line-height: 1.5;
  color: #495057;
}

.message-line:empty {
  margin: 4px 0;
}

/* 确认按钮样式 */
.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #d39e00;
  color: #212529;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
  color: #fff;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
  color: #fff;
}

/* 模态框动画增强 */
.confirm-modal {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 - 操作按钮 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: flex-start;
  }

  .action-btn span {
    display: none; /* 移动端只显示图标 */
  }

  .action-btn {
    padding: 6px;
    min-width: 28px;
    justify-content: center;
  }

  .confirm-modal {
    max-width: 95%;
    margin: 20px;
  }

  .confirm-icon i {
    font-size: 36px;
  }

  .confirm-content {
    padding: 15px 0;
  }
}
</style>
