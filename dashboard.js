import { supabase } from './supabaseClient.js';

let currentUser = null;

async function initializeDashboard() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  
  currentUser = user;
  updateUserInterface();
  // Add other loading functions here (notifications, courses, etc.)
}

function updateUserInterface() {
  if (!currentUser) return;

  const userName = currentUser.user_metadata?.full_name || 'User';
  const userAvatar = currentUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
  const userEmail = currentUser.email;

  // Header
  document.getElementById('user-name').textContent = userName;
  document.getElementById('user-avatar').src = userAvatar;
  
  // Profile Section
  document.getElementById('profile-name').textContent = userName;
  document.getElementById('profile-email').textContent = userEmail;
  document.getElementById('profile-picture').src = userAvatar;
  
  // Profile Form
  const nameParts = userName.split(' ');
  document.getElementById('first-name').value = nameParts[0] || '';
  document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
  document.getElementById('profile-email-input').value = userEmail;
  document.getElementById('phone-number').value = currentUser.user_metadata?.phone || '';
}

async function updateProfile(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('.update-profile-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  const updates = {
    data: { 
      full_name: `${document.getElementById('first-name').value} ${document.getElementById('last-name').value}`,
      phone: document.getElementById('phone-number').value,
      // Add other metadata fields here
    }
  };

  const { data, error } = await supabase.auth.updateUser(updates);

  if (error) {
    showNotification(`Error: ${error.message}`, 'error');
  } else {
    showNotification('Profil berhasil diperbarui!', 'success');
    currentUser = data.user; // Update local user object
    updateUserInterface();
  }
  
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
}

async function logout() {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } else {
      window.location.href = 'index.html';
    }
  }
}
window.logout = logout;

// --- Existing UI Functions (showSection, toggleSidebar, etc.) ---
// These functions can remain largely the same.
// Make sure to export or attach them to window if they are called from HTML.

let isSidebarOpen = true;

function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`${sectionName}-section`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');
  document.getElementById('current-section').textContent = document.querySelector(`[onclick="showSection('${sectionName}')"] span`).textContent;
}
window.showSection = showSection;

function toggleSidebar() {
  const sidebar = document.querySelector('.dashboard-sidebar');
  const main = document.querySelector('.dashboard-main');
  isSidebarOpen = !isSidebarOpen;
  if (isSidebarOpen) {
    sidebar.style.transform = 'translateX(0)';
    main.style.marginLeft = '280px';
  } else {
    sidebar.style.transform = 'translateX(-100%)';
    main.style.marginLeft = '0';
  }
}
window.toggleSidebar = toggleSidebar;

function toggleNotifications() {
  document.getElementById('notification-panel').classList.toggle('active');
}
window.toggleNotifications = toggleNotifications;

function filterCourses(status) {
    document.querySelectorAll('.my-course-card').forEach(course => {
        course.style.display = (status === 'all' || course.dataset.status === status) ? 'block' : 'none';
    });
}
window.filterCourses = filterCourses;

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.dashboard-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `dashboard-notification notification-${type}`;
  notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">&times;</button>`;
  
  notification.style.cssText = `
    position: fixed; top: 80px; right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; padding: 1rem 1.5rem; border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); z-index: 1001;
    display: flex; align-items: center; gap: 1rem; animation: slideIn 0.3s ease;
  `;
  notification.querySelector('button').style.cssText = `
    background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
  document.querySelector('.profile-form').addEventListener('submit', updateProfile);
  // Add other event listeners as needed
});
