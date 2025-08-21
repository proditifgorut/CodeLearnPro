import { supabase } from './supabaseClient.js';

// Function to check auth status and update UI
async function checkAuthStatus() {
    const loginBtn = document.getElementById('login-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (dashboardBtn) dashboardBtn.style.display = 'inline-flex';
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (dashboardBtn) dashboardBtn.style.display = 'none';
    }
}

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    if (navActions) navActions.classList.toggle('active'); // Toggle actions as well
  });

  // Close menu when clicking on a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      if (navActions) navActions.classList.remove('active');
    });
  });
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// WhatsApp Contact Function
function contactWhatsApp(service = '') {
  const phoneNumber = '6283119226089'; // Remove the + and any spaces
  let message = '';
  
  if (service) {
    message = `Halo CodeLearn Pro! Saya tertarik dengan layanan "${service}". Bisa tolong berikan informasi lebih lanjut?`;
  } else {
    message = 'Halo CodeLearn Pro! Saya ingin bertanya tentang layanan Anda.';
  }
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  // Open in new tab
  window.open(whatsappURL, '_blank');
}
window.contactWhatsApp = contactWhatsApp; // Make it globally accessible

// Form Submission Handler
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const phone = this.querySelector('input[type="tel"]').value;
    const service = this.querySelector('select').value;
    const message = this.querySelector('textarea').value;
    
    // Create WhatsApp message
    const whatsappMessage = `
Halo CodeLearn Pro!

Saya ingin menghubungi Anda melalui website.

Detail Kontak:
- Nama: ${name}
- Email: ${email}
- WhatsApp: ${phone}
- Layanan: ${service}
- Pesan: ${message}

Mohon dapat segera dihubungi. Terima kasih!
    `.trim();
    
    // Send to WhatsApp
    const phoneNumber = '6283119226089';
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    
    // Reset form
    this.reset();
    
    // Show success message
    showNotification('Pesan berhasil dikirim! Anda akan diarahkan ke WhatsApp.', 'success');
  });
}

// Notification Function
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 1001;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;
  
  // Add CSS animation
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      .notification-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Scroll-based Navigation Highlighting
function highlightNavigation() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// Add active styles for navigation
const navStyles = document.createElement('style');
navStyles.textContent = `
  .nav-link.active {
    color: var(--primary-color) !important;
  }
  .nav-link.active::after {
    width: 100% !important;
  }
`;
document.head.appendChild(navStyles);

// Scroll Event Listener
window.addEventListener('scroll', highlightNavigation);

// Intersection Observer for Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus(); // Check login status

  // Add initial styles for animation
  const animatedElements = document.querySelectorAll('.feature-card, .course-card, .service-card, .pricing-card');
  
  animatedElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
  });
  
  // Initialize navigation highlighting
  highlightNavigation();
});

// Course Video Links Click Tracking
document.querySelectorAll('.video-link').forEach(link => {
  link.addEventListener('click', function(e) {
    const videoTitle = this.textContent.trim();
    console.log(`Video clicked: ${videoTitle}`);
    showNotification(`Membuka video: ${videoTitle}`, 'info');
  });
});

// Export functions for global use if they are called from HTML onclick
window.CodeLearnPro = {
  contactWhatsApp,
  showNotification,
};
