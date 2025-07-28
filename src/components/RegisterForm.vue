<template>
  <div class="login-container" role="main">
    <!-- 背景部分 -->
    <div class="background-section" aria-hidden="true">
      <div class="welcome-content">
        <h1 id="welcome-heading">Create Your Account!</h1>
        <div
          class="feature-list"
          role="list"
          aria-labelledby="features-heading"
        >
          <div class="sr-only" id="features-heading">Registration Benefits</div>
          <div class="feature-item" role="listitem">
            <div class="feature-icon" aria-hidden="true">🚀</div>
            <div class="feature-text">Simple Registration</div>
          </div>
          <div class="feature-item" role="listitem">
            <div class="feature-icon" aria-hidden="true">🔒</div>
            <div class="feature-text">Secure Authentication</div>
          </div>
          <div class="feature-item" role="listitem">
            <div class="feature-icon" aria-hidden="true">🎯</div>
            <div class="feature-text">Instant Access</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单部分 -->
    <div class="form-section">
      <div id="registerForm" role="form" aria-labelledby="register-heading">
        <h1 id="register-heading" class="h2">Sign Up</h1>
        <p id="form-instructions" class="sr-only">
          Please enter your username, password and confirm password to create a
          new account
        </p>

        <form
          @submit.prevent="handleRegister"
          @keydown.enter="handleRegister"
          aria-describedby="form-instructions"
        >
          <!-- 用户名输入框 -->
          <div class="input-container">
            <label for="regUsername" class="input-label">Username</label>
            <input
              id="regUsername"
              v-model.lazy="username"
              @input="handleUsernameInput"
              @blur="validateUsername"
              placeholder="Enter your username"
              required
              :class="{
                'input-error': usernameError,
                'input-success': !usernameError && username,
                shake: usernameErrorShake,
              }"
              tabindex="1"
              ref="username"
              :aria-describedby="usernameError ? 'username-error' : null"
              :aria-invalid="usernameError ? 'true' : 'false'"
              autocomplete="username"
              name="username"
              aria-required="true"
            />
            <div
              v-if="usernameError"
              id="username-error"
              class="error-tooltip"
              role="alert"
              aria-live="assertive"
            >
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ usernameError }}</span>
            </div>
          </div>

          <!-- 密码输入框 -->
          <div class="input-container">
            <label for="regPassword" class="input-label">Password</label>
            <div class="password-wrapper">
              <input
                id="regPassword"
                :type="showPassword ? 'text' : 'password'"
                v-model.lazy="password"
                @input="handlePasswordInput"
                @blur="validatePassword"
                placeholder="Create a strong password"
                required
                :class="{
                  'input-error': passwordError,
                  'input-success': !passwordError && password,
                  shake: passwordErrorShake,
                }"
                tabindex="2"
                :aria-describedby="passwordError ? 'password-error' : null"
                :aria-invalid="passwordError ? 'true' : 'false'"
                autocomplete="new-password"
                name="new-password"
                aria-required="true"
              />
              <span
                v-if="!passwordError && password"
                class="success-icon"
                aria-hidden="true"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#2ecc71"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <button
                type="button"
                class="toggle-password"
                @click="togglePasswordVisibility"
                tabindex="3"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword ? 'true' : 'false'"
              >
                <svg
                  v-if="showPassword"
                  class="eye-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
                  />
                </svg>
                <svg
                  v-else
                  class="eye-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.8,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
                  />
                </svg>
              </button>
            </div>
            <div
              v-if="passwordError"
              id="password-error"
              class="error-tooltip"
              role="alert"
              aria-live="assertive"
            >
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ passwordError }}</span>
            </div>

            <!-- 密码强度指示器 -->
            <div v-if="password" class="password-strength">
              <div
                :class="['strength-bar', strengthClass]"
                role="progressbar"
                :aria-valuenow="passwordStrength"
                aria-valuemin="0"
                aria-valuemax="4"
                :aria-valuetext="strengthText"
              ></div>
              <div id="password-strength-text" class="strength-text">
                {{ strengthText }}
              </div>
            </div>
          </div>

          <!-- 确认密码输入框 -->
          <div class="input-container">
            <label for="confirmPassword" class="input-label"
              >Confirm Password</label
            >
            <div class="password-wrapper">
              <input
                id="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                v-model.lazy="confirmPassword"
                @input="handleConfirmPasswordInput"
                @blur="validateConfirmPassword"
                placeholder="Re-enter your password"
                required
                :class="{
                  'input-error': confirmPasswordError,
                  'input-success': !confirmPasswordError && confirmPassword,
                  shake: confirmPasswordErrorShake,
                }"
                tabindex="4"
                :aria-describedby="
                  confirmPasswordError ? 'confirm-error' : null
                "
                :aria-invalid="confirmPasswordError ? 'true' : 'false'"
                autocomplete="new-password"
                name="confirm-password"
                aria-required="true"
              />
              <span
                v-if="!confirmPasswordError && confirmPassword"
                class="success-icon"
                aria-hidden="true"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#2ecc71"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <!-- 新增的确认密码显示/隐藏按钮 -->
              <button
                type="button"
                class="toggle-password"
                @click="togglePasswordVisibility"
                tabindex="5"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword ? 'true' : 'false'"
              >
                <!-- 在确认密码输入框的显示密码图标中 -->
                <svg
                  v-if="showPassword"
                  class="eye-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
                  />
                </svg>
                <svg
                  v-else
                  class="eye-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.8,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
                  />
                </svg>
              </button>
            </div>
            <div
              v-if="confirmPasswordError"
              id="confirm-error"
              class="error-tooltip"
              role="alert"
              aria-live="assertive"
            >
              <span class="error-icon" aria-hidden="true">❌</span>
              <span>{{ confirmPasswordError }}</span>
            </div>
          </div>

          <!-- 按钮区域 -->
          <div class="button-container">
            <button
              type="submit"
              id="registerButton"
              :disabled="isFormInvalid || loading"
              tabindex="6"
              :aria-busy="loading"
              aria-describedby="register-instructions"
            >
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
              <span :aria-hidden="loading">{{
                loading ? "Creating account..." : "Sign Up"
              }}</span>
              <div
                v-if="loading"
                class="progress-indicator"
                :style="{ width: progress + '%' }"
              ></div>
            </button>
            <span id="register-instructions" class="sr-only"
              >Press Ctrl+Enter to submit the form</span
            >

            <button
              type="button"
              id="resetButton"
              @click="resetForm"
              tabindex="7"
              aria-label="Clear form fields"
              :disabled="loading"
            >
              Reset
            </button>
          </div>
        </form>

        <div class="register-link" aria-labelledby="login-prompt">
          <span id="login-prompt">Already have an account?</span>
          <a
            href="#"
            @click.prevent="goToLoginPage"
            tabindex="8"
            aria-label="Log in to your account"
            >Log In</a
          >
        </div>

        <!-- 成功消息 -->
        <transition name="fade">
          <div
            v-if="successMessage"
            id="success"
            role="status"
            aria-live="polite"
            class="success-message"
          >
            <span class="success-icon" aria-hidden="true">✓</span>
            <span>{{ successMessage }}</span>
          </div>
        </transition>

        <!-- 错误消息 -->
        <transition name="fade">
          <div
            v-if="error"
            id="error"
            role="alert"
            aria-live="assertive"
            class="error-message"
          >
            <span class="error-icon" aria-hidden="true">❌</span>
            <span>{{ error }}</span>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "RegisterForm",
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      usernameError: "",
      passwordError: "",
      confirmPasswordError: "",
      error: "",
      successMessage: "",
      loading: false,
      progress: 0,
      progressInterval: null,
      usernameErrorShake: false,
      passwordErrorShake: false,
      confirmPasswordErrorShake: false,
      usernameValidationTimeout: null,
      passwordValidationTimeout: null,
      confirmPasswordValidationTimeout: null,
    };
  },
  computed: {
    isFormInvalid() {
      return (
        this.usernameError ||
        this.passwordError ||
        this.confirmPasswordError ||
        !this.username ||
        !this.password ||
        !this.confirmPassword
      );
    },
    isPasswordValid() {
      return this.password.length >= 8 && this.password.length <= 20;
    },
    isUsernameValid() {
      return this.username.length >= 8 && this.username.length <= 20;
    },
    passwordStrength() {
      if (!this.password) return 0;
      let strength = 0;
      if (this.password.length >= 8) strength += 1;
      if (this.password.length >= 12) strength += 1;
      if (/[A-Z]/.test(this.password)) strength += 1;
      if (/[0-9]/.test(this.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(this.password)) strength += 1;
      return strength;
    },
    strengthClass() {
      return "strength-" + Math.min(4, this.passwordStrength);
    },
    strengthText() {
      const texts = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
      return texts[Math.min(4, this.passwordStrength)] || "";
    },
  },
  watch: {
    username() {
      this.scheduleUsernameValidation();
    },
    password() {
      this.schedulePasswordValidation();
      this.scheduleConfirmPasswordValidation();
    },
    confirmPassword() {
      this.scheduleConfirmPasswordValidation();
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleKeyDown);
    this.$nextTick(() => this.$refs.username.focus());
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    if (this.progressInterval) clearInterval(this.progressInterval);
    if (this.usernameValidationTimeout)
      clearTimeout(this.usernameValidationTimeout);
    if (this.passwordValidationTimeout)
      clearTimeout(this.passwordValidationTimeout);
    if (this.confirmPasswordValidationTimeout)
      clearTimeout(this.confirmPasswordValidationTimeout);
  },
  methods: {
    ...mapActions(["register"]),
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    handleKeyDown(e) {
      if (e.ctrlKey && e.key === "Enter" && !this.isFormInvalid)
        this.handleRegister();
      if (e.key === "Escape") this.closeKeyboard();
    },
    closeKeyboard() {
      document.activeElement.blur();
    },
    handleUsernameInput() {
      this.scheduleUsernameValidation();
    },
    handlePasswordInput() {
      this.schedulePasswordValidation();
    },
    handleConfirmPasswordInput() {
      this.scheduleConfirmPasswordValidation();
    },
    scheduleUsernameValidation() {
      if (this.usernameValidationTimeout)
        clearTimeout(this.usernameValidationTimeout);
      this.usernameValidationTimeout = setTimeout(
        () => this.validateUsername(),
        300
      );
    },
    schedulePasswordValidation() {
      if (this.passwordValidationTimeout)
        clearTimeout(this.passwordValidationTimeout);
      this.passwordValidationTimeout = setTimeout(
        () => this.validatePassword(),
        300
      );
    },
    scheduleConfirmPasswordValidation() {
      if (this.confirmPasswordValidationTimeout)
        clearTimeout(this.confirmPasswordValidationTimeout);
      this.confirmPasswordValidationTimeout = setTimeout(
        () => this.validateConfirmPassword(),
        300
      );
    },
    validateUsername() {
      this.usernameError = "";
      this.usernameErrorShake = false;
      if (!this.username) return;

      if (this.username.length < 8) {
        this.usernameError = "Username must be at least 8 characters";
      } else if (this.username.length > 20) {
        this.usernameError = "Username can't exceed 20 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
        this.usernameError = "Only letters, numbers and underscores allowed";
      }
    },
    validatePassword() {
      this.passwordError = "";
      this.passwordErrorShake = false;
      if (!this.password) return;

      if (this.password.length < 8) {
        this.passwordError = "Password must be at least 8 characters";
      } else if (this.password.length > 20) {
        this.passwordError = "Password can't exceed 20 characters";
      } else if (!/[A-Z]/.test(this.password)) {
        this.passwordError = "Include at least one uppercase letter";
      } else if (!/[a-z]/.test(this.password)) {
        this.passwordError = "Include at least one lowercase letter";
      } else if (!/[0-9]/.test(this.password)) {
        this.passwordError = "Include at least one number";
      }
    },
    validateConfirmPassword() {
      this.confirmPasswordError = "";
      this.confirmPasswordErrorShake = false;
      if (!this.confirmPassword) return;

      if (this.password !== this.confirmPassword) {
        this.confirmPasswordError = "Passwords do not match";
      }
    },
    resetForm() {
      this.username = "";
      this.password = "";
      this.confirmPassword = "";
      this.usernameError = "";
      this.passwordError = "";
      this.confirmPasswordError = "";
      this.error = "";
      this.successMessage = "";
      this.$refs.username.focus();
    },
    async handleRegister() {
      this.validateUsername();
      this.validatePassword();
      this.validateConfirmPassword();

      const hasErrors =
        this.usernameError || this.passwordError || this.confirmPasswordError;
      if (hasErrors) {
        if (this.usernameError) {
          this.usernameErrorShake = true;
          setTimeout(() => (this.usernameErrorShake = false), 500);
        }
        if (this.passwordError) {
          this.passwordErrorShake = true;
          setTimeout(() => (this.passwordErrorShake = false), 500);
        }
        if (this.confirmPasswordError) {
          this.confirmPasswordErrorShake = true;
          setTimeout(() => (this.confirmPasswordErrorShake = false), 500);
        }
        return;
      }

      this.error = "";
      this.successMessage = "";
      this.loading = true;
      this.progress = 0;
      this.progressInterval = setInterval(
        () => this.progress < 90 && (this.progress += 10),
        200
      );

      try {
        await this.register({
          username: this.username,
          password: this.password,
        });

        this.progress = 100;
        this.successMessage =
          "Registration successful! Redirecting to login...";

        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.$router.push("/login"); // 确保重定向到登录页
      } catch (error) {
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
            default:
              errorMessage = error.response.data?.message || errorMessage;
          }
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection";
        }
        this.error = errorMessage;
      } finally {
        clearInterval(this.progressInterval);
        this.loading = false;
        setTimeout(() => (this.progress = 0), 300);
      }
    },
    goToLoginPage() {
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
/* 确保包含所有必要的样式 */
/* 可访问性增强样式 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 高对比度模式支持 */
@media (prefers-contrast: more) {
  .input-container input {
    border-width: 2px;
  }

  .input-error {
    border-color: #ff0000 !important;
    outline: 3px solid #ff0000;
  }

  .input-success {
    border-color: #00ff00 !important;
  }

  #registerButton,
  #resetButton {
    border: 2px solid currentColor;
  }

  .error-message {
    border: 2px solid #ff0000;
  }
}

/* 增强焦点样式 */
input:focus,
button:focus,
a:focus {
  outline: 3px solid #3498db;
  outline-offset: 2px;
}

/* 高对比度模式下的焦点样式 */
@media (prefers-contrast: more) {
  input:focus,
  button:focus,
  a:focus {
    outline: 3px solid #ffff00;
  }
}

/* 禁用状态样式增强 */
#registerButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 整体布局样式 */
.login-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.background-section {
  flex: 1;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.background-section::before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.welcome-content {
  max-width: 500px;
  z-index: 1;
}

.welcome-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 18px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.2);
}

.feature-icon {
  font-size: 1.8rem;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
}

.feature-text {
  font-size: 1.1rem;
  font-weight: 500;
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: white;
  position: relative;
}

#registerForm {
  width: 100%;
  max-width: 420px;
  padding: 1.8rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

#registerForm .h2 {
  font-size: 1.7rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.8rem;
  color: #2c3e50;
}

.input-container {
  position: relative;
  margin-bottom: 1.4rem;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.input-container input {
  width: 100%;
  padding: 13px 15px;
  font-size: 1rem;
  border-radius: 8px;
  border: 2px solid #e0e6ed;
  box-sizing: border-box;
  transition: all 0.3s ease, box-shadow 0.3s ease;
  background-color: #f9fafb;
  color: #2c3e50;
}

.input-container input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2),
    0 5px 15px rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.input-error {
  border-color: #e74c3c !important;
  background-color: #fff5f5 !important;
}

.input-success {
  border-color: #2ecc71 !important;
  background-color: #f5fff9 !important;
}

.error-tooltip {
  position: absolute;
  bottom: -24px;
  left: 0;
  font-size: 0.8rem;
  color: #e74c3c;
  width: 100%;
  text-align: left;
  padding-left: 5px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  padding: 3px 5px;
}

.password-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-password:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #3498db;
}

.eye-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.success-icon {
  position: absolute;
  right: 46px;
  top: 50%;
  transform: translateY(-50%);
  color: #2ecc71;
  font-size: 1.1rem;
}

/* 按钮区域优化 */
.button-container {
  margin-top: 1.6rem;
  display: flex;
  gap: 12px;
}

#registerButton {
  flex: 1;
  padding: 13px;
  background: linear-gradient(135deg, #3498db, #2c80c5);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease, transform 0.1s ease-in-out;
  position: relative;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.25);
  transform: translateY(0);
}

#registerButton:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #2575b0);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.3);
}

#registerButton:active:not(:disabled) {
  transform: scale(0.98);
}

#registerButton:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

#resetButton {
  flex: 1;
  padding: 13px;
  background: #f0f2f5;
  color: #34495e;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8极;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

#resetButton:hover {
  background: #e4e7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.register-link {
  text-align: center;
  margin-top: 1.6rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
  transition: color 0.2s;
}

.register-link a:hover {
  text-decoration: underline;
  color: #1d6fa5;
}

.error-message {
  color: #e74c3c;
  font-size: 0.88rem;
  margin-top: 1.4rem;
  padding: 11px 14px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.success-message {
  color: #2ecc71;
  font-size: 0.88rem;
  margin-top: 1.4rem;
  padding: 11px 14px;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 10px;
}

.strength-bar {
  height: 5px;
  border-radius: 3px;
  background: #e0e0e0;
  margin-bottom: 5px;
  transition: width 0.3s, background 0.3s;
}

.strength-0 {
  width: 20%;
  background: #ff5252;
}
.strength-1 {
  width: 40%;
  background: #ffb142;
}
.strength-2 {
  width: 60%;
  background: #ffb142;
}
.strength-3 {
  width: 80%;
  background: #2ed573;
}
.strength-4 {
  width: 100%;
  background: #2ed573;
}

.strength-text {
  font-size: 0.78rem;
  color: #7f8c8d;
  font-weight: 500;
}

/* 加载指示器 */
.spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 17px;
  height: 17px;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 进度指示器 */
.progress-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.6);
  transition: width 0.3s ease;
}

/* 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 抖动动画 */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.shake {
  animation: shake 0.5s ease;
}

/* 自动填充样式优化 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #f9fafb inset !important;
  -webkit-text-fill-color: #2c3e50 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    height: auto;
  }

  .background-section {
    padding: 1.3rem;
    min-height: 180px;
  }

  .form-section {
    padding: 1.3rem;
    width: 100%;
  }

  .welcome-content h1 {
    font-size: 1.8rem;
  }

  .feature-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
  }

  .feature-item {
    flex: 1 0 40%;
    max-width: 160px;
    flex-direction: column;
    text-align: center;
    padding: 9px;
  }

  .feature-icon {
    margin-bottom: 6px;
    font-size: 1.6rem;
    width: 40px;
    height: 40px;
  }

  .feature-text {
    font-size: 1rem;
  }

  #registerForm {
    padding: 1.4rem;
    max-width: 380px;
  }
}

@media (max-width: 480px) {
  #registerForm {
    padding: 1.2rem;
  }

  input[type="text"],
  input[type="password"] {
    font-size: 16px;
    padding: 12px 14px;
  }

  .button-container {
    flex-direction: column;
    gap: 10px;
  }

  #registerButton,
  #resetButton {
    width: 100%;
    padding: 12px;
  }

  .feature-item {
    flex: 1 0 100%;
    max-width: none;
    flex-direction: row;
    text-align: left;
    padding: 10px;
  }

  .toggle-password {
    width: 32px;
    height: 32px;
  }
}
</style>
