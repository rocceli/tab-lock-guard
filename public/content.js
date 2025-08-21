// Content script for SecureTab extension
class SecureTabContent {
  constructor() {
    this.isLocked = false;
    this.lockOverlay = null;
    this.activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    this.lastActivity = Date.now();
    
    this.init();
  }
  
  init() {
    this.setupActivityListeners();
    this.setupMessageListeners();
    this.checkInitialLockStatus();
  }
  
  setupActivityListeners() {
    // Throttled activity detection
    let activityTimeout;
    const reportActivity = () => {
      this.lastActivity = Date.now();
      
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        chrome.runtime.sendMessage({ type: 'ACTIVITY_DETECTED' });
      }, 1000); // Throttle to once per second
    };
    
    this.activityEvents.forEach(event => {
      document.addEventListener(event, reportActivity, { passive: true });
    });
  }
  
  setupMessageListeners() {
    // Listen for messages from background script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      
      switch (event.data.type) {
        case 'SECURETAB_LOCK':
          this.showLockOverlay();
          break;
        case 'SECURETAB_UNLOCK':
          this.hideLockOverlay();
          break;
      }
    });
    
    // Listen for runtime messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'LOCK_TAB':
          this.showLockOverlay();
          break;
        case 'UNLOCK_TAB':
          this.hideLockOverlay();
          break;
      }
    });
  }
  
  async checkInitialLockStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_LOCK_STATUS' });
      if (response && response.isLocked) {
        this.showLockOverlay();
      }
    } catch (error) {
      console.log('Could not check lock status:', error);
    }
  }
  
  showLockOverlay() {
    if (this.isLocked) return;
    
    this.isLocked = true;
    
    // Create overlay
    this.lockOverlay = document.createElement('div');
    this.lockOverlay.id = 'securetab-lock-overlay';
    this.lockOverlay.innerHTML = this.getLockOverlayHTML();
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = this.getLockOverlayCSS();
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(this.lockOverlay);
    
    // Setup unlock form
    this.setupUnlockForm();
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus password input
    setTimeout(() => {
      const passwordInput = document.getElementById('securetab-password-input');
      if (passwordInput) {
        passwordInput.focus();
      }
    }, 100);
  }
  
  hideLockOverlay() {
    if (!this.isLocked) return;
    
    this.isLocked = false;
    
    if (this.lockOverlay) {
      this.lockOverlay.remove();
      this.lockOverlay = null;
    }
    
    // Restore scrolling
    document.body.style.overflow = '';
  }
  
  setupUnlockForm() {
    const form = document.getElementById('securetab-unlock-form');
    const passwordInput = document.getElementById('securetab-password-input');
    const errorDiv = document.getElementById('securetab-error');
    let attempts = 0;
    const maxAttempts = 3;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = passwordInput.value;
      if (!password) return;
      
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'UNLOCK_TAB',
          password: password
        });
        
        if (response && response.success) {
          this.hideLockOverlay();
        } else {
          attempts++;
          passwordInput.value = '';
          
          if (attempts >= maxAttempts) {
            errorDiv.textContent = `Too many failed attempts. Extension locked for 30 seconds.`;
            errorDiv.style.display = 'block';
            form.style.pointerEvents = 'none';
            
            setTimeout(() => {
              attempts = 0;
              errorDiv.style.display = 'none';
              form.style.pointerEvents = '';
            }, 30000);
          } else {
            errorDiv.textContent = `Incorrect password. ${maxAttempts - attempts} attempts remaining.`;
            errorDiv.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error unlocking tab:', error);
        errorDiv.textContent = 'Error occurred. Please try again.';
        errorDiv.style.display = 'block';
      }
    });
  }
  
  getLockOverlayHTML() {
    return `
      <div class="securetab-overlay-content">
        <div class="securetab-lock-card">
          <div class="securetab-lock-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          
          <div class="securetab-lock-content">
            <h2>Tab Locked</h2>
            <p>Enter your password to unlock and continue</p>
            
            <div id="securetab-error" class="securetab-error" style="display: none;"></div>
            
            <form id="securetab-unlock-form" class="securetab-unlock-form">
              <input 
                type="password" 
                id="securetab-password-input"
                class="securetab-password-input" 
                placeholder="Enter password"
                autocomplete="off"
                spellcheck="false"
              />
              <button type="submit" class="securetab-unlock-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Unlock
              </button>
            </form>
            
            <div class="securetab-footer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>Secured by SecureTab Extension</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  getLockOverlayCSS() {
    return `
      #securetab-lock-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: linear-gradient(180deg, 
          hsl(220 15% 8% / 0.95) 0%, 
          hsl(220 15% 8% / 0.98) 100%) !important;
        backdrop-filter: blur(8px) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        animation: securetab-fade-in 0.3s ease-out !important;
      }
      
      @keyframes securetab-fade-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes securetab-pulse-glow {
        0%, 100% {
          box-shadow: 0 0 20px hsl(217 91% 55% / 0.3);
        }
        50% {
          box-shadow: 0 0 40px hsl(217 91% 55% / 0.6);
        }
      }
      
      .securetab-overlay-content {
        padding: 16px !important;
        width: 100% !important;
        max-width: 400px !important;
      }
      
      .securetab-lock-card {
        background: linear-gradient(180deg, 
          hsl(225 15% 12%) 0%, 
          hsl(225 15% 10%) 100%) !important;
        border: 1px solid hsl(225 15% 20%) !important;
        border-radius: 12px !important;
        padding: 32px !important;
        text-align: center !important;
        box-shadow: 0 8px 32px hsl(220 15% 4% / 0.5) !important;
      }
      
      .securetab-lock-icon {
        margin: 0 auto 24px !important;
        width: 64px !important;
        height: 64px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(142 76% 36%) 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: hsl(220 15% 8%) !important;
        animation: securetab-pulse-glow 2s ease-in-out infinite !important;
      }
      
      .securetab-lock-content h2 {
        color: hsl(210 40% 95%) !important;
        font-size: 20px !important;
        font-weight: 700 !important;
        margin: 0 0 8px 0 !important;
        line-height: 1.2 !important;
      }
      
      .securetab-lock-content p {
        color: hsl(217 10% 65%) !important;
        font-size: 14px !important;
        margin: 0 0 24px 0 !important;
        line-height: 1.4 !important;
      }
      
      .securetab-error {
        background: hsl(0 72% 51% / 0.1) !important;
        border: 1px solid hsl(0 72% 51% / 0.2) !important;
        color: hsl(0 72% 51%) !important;
        padding: 12px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        margin-bottom: 16px !important;
      }
      
      .securetab-unlock-form {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        margin-bottom: 24px !important;
      }
      
      .securetab-password-input {
        background: hsl(225 15% 16% / 0.5) !important;
        border: 1px solid hsl(225 15% 20%) !important;
        border-radius: 8px !important;
        padding: 12px 16px !important;
        color: hsl(210 40% 95%) !important;
        font-size: 14px !important;
        text-align: center !important;
        outline: none !important;
        transition: all 0.2s ease !important;
      }
      
      .securetab-password-input:focus {
        border-color: hsl(217 91% 55%) !important;
        box-shadow: 0 0 0 2px hsl(217 91% 55% / 0.2) !important;
      }
      
      .securetab-password-input::placeholder {
        color: hsl(217 10% 65%) !important;
      }
      
      .securetab-unlock-button {
        background: linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(142 76% 36%) 100%) !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 24px !important;
        color: hsl(220 15% 8%) !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        transition: opacity 0.2s ease !important;
        box-shadow: 0 0 20px hsl(217 91% 55% / 0.3) !important;
      }
      
      .securetab-unlock-button:hover {
        opacity: 0.9 !important;
      }
      
      .securetab-unlock-button:active {
        transform: scale(0.98) !important;
      }
      
      .securetab-unlock-button:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }
      
      .securetab-footer {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        font-size: 11px !important;
        color: hsl(217 10% 65%) !important;
        padding-top: 16px !important;
        border-top: 1px solid hsl(225 15% 20%) !important;
      }
    `;
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SecureTabContent();
  });
} else {
  new SecureTabContent();
}