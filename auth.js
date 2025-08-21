import { supabase } from './supabaseClient.js';

let isLoginMode = true;

// Toggle between login and register forms
function toggleAuthMode() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const switchText = document.getElementById('switch-text');

  isLoginMode = !isLoginMode;

  if (isLoginMode) {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authTitle.textContent = 'Masuk ke Akun Anda';
    authSubtitle.textContent = 'Lanjutkan perjalanan coding Anda';
    switchText.innerHTML = 'Belum punya akun? <a href="#" id="switch-link" onclick="toggleAuthMode()">Daftar sekarang</a>';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authTitle.textContent = 'Buat Akun Baru';
    authSubtitle.textContent = 'Mulai perjalanan coding Anda hari ini';
    switchText.innerHTML = 'Sudah punya akun? <a href="#" id="switch-link" onclick="toggleAuthMode()">Masuk sekarang</a>';
  }
}
window.toggleAuthMode = toggleAuthMode;

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}
window.togglePassword = togglePassword;

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = [];

  if (password.length >= 8) strength += 25; else feedback.push('Minimal 8 karakter');
  if (/[a-z]/.test(password)) strength += 25; else feedback.push('Huruf kecil');
  if (/[A-Z]/.test(password)) strength += 25; else feedback.push('Huruf besar');
  if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25; else feedback.push('Angka atau simbol');

  return { strength, feedback };
}

function updatePasswordStrength() {
  const passwordInput = document.getElementById('register-password');
  const strengthIndicator = document.getElementById('password-strength');
  if (!passwordInput || !strengthIndicator) return;

  const password = passwordInput.value;
  const { strength, feedback } = checkPasswordStrength(password);
  let strengthText = '', strengthClass = '';

  if (password.length === 0) {
    strengthIndicator.innerHTML = '';
    return;
  }

  if (strength < 50) { strengthText = 'Lemah'; strengthClass = 'weak'; } 
  else if (strength < 75) { strengthText = 'Sedang'; strengthClass = 'medium'; } 
  else { strengthText = 'Kuat'; strengthClass = 'strong'; }

  const missingText = feedback.length > 0 ? `<br><small>Perlu: ${feedback.join(', ')}</small>` : '';
  strengthIndicator.innerHTML = `
    <div class="strength-bar ${strengthClass}"><div class="strength-fill" style="width: ${strength}%"></div></div>
    <span class="strength-text ${strengthClass}">${strengthText}</span>${missingText}`;
}

// Social login handlers
async function socialLogin(provider) {
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) {
    showNotification(`Error login dengan ${provider}: ${error.message}`, 'error');
  }
}
window.socialLogin = socialLogin;

// Form validation
const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = phone => /^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(phone.replace(/\s/g, ''));

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!validateEmail(email) || password.length < 6) {
    showNotification('Email atau password tidak valid.', 'error');
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  setLoading(submitBtn, true);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showNotification(error.message, 'error');
  } else {
    showNotification('Login berhasil! Mengalihkan...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  }
  setLoading(submitBtn, false);
});

// Register form handler
document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const fullname = document.getElementById('register-fullname').value;
  const email = document.getElementById('register-email').value;
  const phone = document.getElementById('register-phone').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm').value;

  if (fullname.length < 2 || !validateEmail(email) || !validatePhone(phone) || password.length < 8 || password !== confirmPassword) {
    showNotification('Mohon periksa kembali data yang Anda masukkan.', 'error');
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  setLoading(submitBtn, true);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullname,
        phone: phone,
      }
    }
  });

  if (error) {
    showNotification(error.message, 'error');
  } else {
    showNotification('Pendaftaran berhasil! Silakan cek email untuk verifikasi.', 'success');
    setTimeout(() => toggleAuthMode(), 2000);
  }
  setLoading(submitBtn, false);
});

function setLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  } else {
    button.disabled = false;
    button.innerHTML = isLoginMode 
      ? '<i class="fas fa-sign-in-alt"></i> Masuk' 
      : '<i class="fas fa-user-plus"></i> Daftar Sekarang';
  }
}

// Password strength checker for register form
document.getElementById('register-password').addEventListener('input', updatePasswordStrength);

// Notification function
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">&times;</button>`;
  
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; padding: 1rem 1.5rem; border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); z-index: 1001;
    display: flex; align-items: center; gap: 1rem; animation: slideIn 0.3s ease;
  `;
  notification.querySelector('button').style.cssText = `
    background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;
  `;
  
  if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// Add styles for auth page
document.addEventListener('DOMContentLoaded', () => {
    const authStyles = document.createElement('style');
    authStyles.textContent = `
      .auth-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; }
      .auth-container { max-width: 450px; width: 100%; }
      .auth-card { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
      .auth-header { text-align: center; margin-bottom: 2rem; }
      .auth-logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.5rem; font-weight: bold; color: var(--primary-color); margin-bottom: 1rem; }
      .input-group { position: relative; display: flex; align-items: center; }
      .input-group i { position: absolute; left: 12px; color: var(--text-light); }
      .input-group input { padding-left: 40px; }
      .password-toggle { position: absolute; right: 12px; background: none; border: none; color: var(--text-light); cursor: pointer; }
      .form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.875rem; }
      .forgot-password, .terms-link, .auth-switch a { color: var(--primary-color); text-decoration: none; }
      .auth-btn { width: 100%; background: var(--primary-color); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
      .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      .auth-divider { text-align: center; margin: 1.5rem 0; position: relative; }
      .auth-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-color); z-index: 0; }
      .auth-divider span { background: white; padding: 0 1rem; color: var(--text-light); font-size: 0.875rem; position: relative; z-index: 1; }
      .social-auth { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
      .social-btn { width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; background: white; color: var(--text-color); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
      .auth-switch { text-align: center; }
    `;
    document.head.appendChild(authStyles);
});
