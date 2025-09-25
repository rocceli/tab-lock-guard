// Popup script for SecureTab extension
class PopupManager {
  constructor() {
    this.settings = null;
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.renderContent();
    this.setupEventListeners();
  }
  
  async loadSettings() {
    try {
      this.settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {
        timeoutMinutes: 5,
        passwordHash: '',
        passwordExpiry: null
      };
    }
  }
  
  renderContent() {
    const container = document.getElementById('popup-content');
    
    if (!this.settings.passwordHash) {
      container.innerHTML = this.getSetupPromptHTML();
    } else {
      container.innerHTML = this.getMainContentHTML();
    }
  }
  
  getSetupPromptHTML() {
    return `
      <div class="setup-prompt">
        <div class="setup-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="setup-title">Welcome to SecureTab</div>
        <div class="setup-description">
          Set up your master password to start protecting your tabs with automatic locking.
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary" id="setup-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Set Up Password
          </button>
        </div>
      </div>
    `;
  }
  
  getMainContentHTML() {
    const isExpired = this.settings.passwordExpiry && Date.now() > this.settings.passwordExpiry;
    const expiryText = this.getPasswordExpiryText();
    
    return `
      <div class="status-card">
        <div class="status-row">
          <span class="status-label">Protection Status</span>
          <div class="status-indicator">
            <div class="status-dot"></div>
            <span style="color: hsl(142 76% 36%);">Active</span>
          </div>
        </div>
        <div class="status-row">
          <span class="status-label">Auto-lock Timeout</span>
          <span class="status-value">${this.settings.timeoutMinutes} min${this.settings.timeoutMinutes !== 1 ? 's' : ''}</span>
        </div>
        <div class="status-row">
          <span class="status-label">Password Status</span>
          <span class="status-value" style="color: ${isExpired ? 'hsl(0 72% 51%)' : 'hsl(142 76% 36%)'}">${expiryText}</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-primary" id="lock-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
          </svg>
          Lock Current Tab
        </button>
        <button class="btn btn-secondary" id="settings-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Settings
        </button>
      </div>
    `;
  }
  
  getPasswordExpiryText() {
    if (!this.settings.passwordExpiry) return 'Never expires';
    
    const expiryDate = new Date(this.settings.passwordExpiry);
    const now = new Date();
    
    if (expiryDate <= now) {
      return 'Expired';
    }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  }
  
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      switch (e.target.id) {
        case 'setup-btn':
          this.openOptionsPage();
          break;
        case 'lock-btn':
          this.lockCurrentTab();
          break;
        case 'settings-btn':
          this.openOptionsPage();
          break;
      }
    });
  }
  
  async lockCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to background script to lock the specific tab
      const response = await chrome.runtime.sendMessage({ 
        type: 'LOCK_TAB_REQUEST', 
        tabId: tab.id 
      });
      
      if (response && response.success) {
        // Close popup after successful lock
        window.close();
      } else {
        const errorMsg = response?.error || 'Unknown error';
        console.error('Failed to lock tab:', errorMsg);
        // Show user-friendly error message
        alert(`Failed to lock tab: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error locking tab:', error);
    }
  }
  
  openOptionsPage() {
    chrome.runtime.openOptionsPage();
    window.close();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});