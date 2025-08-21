// Options page script for SecureTab extension
class OptionsManager {
  constructor() {
    this.settings = {
      timeoutMinutes: 5,
      passwordHash: '',
      passwordExpiry: null
    };
    
    this.currentView = 'main'; // 'main', 'setup', 'settings'
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.render();
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['securitySettings']);
      if (result.securitySettings) {
        this.settings = { ...this.settings, ...result.securitySettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await chrome.storage.local.set({ securitySettings: this.settings });
      this.showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }
  
  render() {
    const container = document.getElementById('options-root');
    
    if (!this.settings.passwordHash) {
      container.innerHTML = this.getPasswordSetupHTML();
      this.setupPasswordSetupListeners();
    } else if (this.currentView === 'settings') {
      container.innerHTML = this.getSettingsHTML();
      this.setupSettingsListeners();
    } else {
      container.innerHTML = this.getMainHTML();
      this.setupMainListeners();
    }
  }
  
  getPasswordSetupHTML() {
    return `
      <div class="options-container">
        <div class="setup-card">
          <div class="setup-header">
            <div class="setup-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <h1>Welcome to SecureTab</h1>
              <p>Set up your security password to protect your browsing</p>
            </div>
          </div>
          
          <form id="password-setup-form" class="setup-form">
            <div class="form-group">
              <label for="password">Master Password</label>
              <div class="password-input-container">
                <input type="password" id="password" placeholder="Enter a strong password" />
                <button type="button" id="toggle-password" class="toggle-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" id="confirm-password" placeholder="Confirm your password" />
            </div>
            
            <div id="password-requirements" class="requirements" style="display: none;">
              <div class="requirements-title">Password Requirements:</div>
              <div class="requirement" data-requirement="length">
                <span class="requirement-icon">✗</span>
                At least 8 characters
              </div>
              <div class="requirement" data-requirement="uppercase">
                <span class="requirement-icon">✗</span>
                One uppercase letter
              </div>
              <div class="requirement" data-requirement="lowercase">
                <span class="requirement-icon">✗</span>
                One lowercase letter
              </div>
              <div class="requirement" data-requirement="number">
                <span class="requirement-icon">✗</span>
                One number
              </div>
              <div class="requirement" data-requirement="special">
                <span class="requirement-icon">✗</span>
                One special character
              </div>
            </div>
            
            <div class="form-group">
              <div class="checkbox-container">
                <input type="checkbox" id="enable-expiry" />
                <label for="enable-expiry">Enable password expiry</label>
              </div>
              <div id="expiry-settings" class="expiry-settings" style="display: none;">
                <label for="expiry-days">Expires after (days):</label>
                <input type="number" id="expiry-days" value="30" min="1" max="365" />
              </div>
            </div>
            
            <button type="submit" id="setup-submit" class="btn-primary" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Set Up Security
            </button>
          </form>
        </div>
      </div>
      ${this.getStylesHTML()}
    `;
  }
  
  getMainHTML() {
    const isExpired = this.settings.passwordExpiry && Date.now() > this.settings.passwordExpiry;
    const expiryText = this.getPasswordExpiryText();
    
    return `
      <div class="options-container">
        <div class="main-header">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="header-content">
            <h1>SecureTab</h1>
            <p>Chrome Security Extension</p>
          </div>
          <button id="settings-btn" class="btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Settings
          </button>
        </div>
        
        <div class="cards-grid">
          <div class="status-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Security Status</h3>
            </div>
            <p class="card-description">Your tabs are protected with password lock</p>
            <div class="status-indicator">
              <div class="status-dot"></div>
              <span>Active Protection</span>
            </div>
          </div>
          
          <div class="status-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Auto-Lock</h3>
            </div>
            <p class="card-description">Locks after ${this.settings.timeoutMinutes} minutes of inactivity</p>
            <button id="lock-now-btn" class="btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
              </svg>
              Lock Now
            </button>
          </div>
          
          <div class="status-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Configuration</h3>
            </div>
            <p class="card-description">Customize timeout and security settings</p>
            <button id="configure-btn" class="btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Configure
            </button>
          </div>
        </div>
        
        <div class="info-card">
          <h3>How it works</h3>
          <div class="steps-grid">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">Monitor Activity</div>
                <div class="step-description">Tracks mouse and keyboard activity</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Auto Lock</div>
                <div class="step-description">Locks tabs after configured timeout</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">Secure Access</div>
                <div class="step-description">Requires password to unlock</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this.getStylesHTML()}
    `;
  }
  
  getSettingsHTML() {
    return `
      <div class="options-container">
        <div class="settings-header">
          <button id="back-btn" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2"/>
            </svg>
            Back
          </button>
          <div>
            <h1>Security Settings</h1>
            <p>Configure your security preferences</p>
          </div>
        </div>
        
        <form id="settings-form" class="settings-form">
          <div class="settings-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Auto-lock Timeout</h3>
            </div>
            <p class="card-description">Choose how long to wait before automatically locking tabs due to inactivity</p>
            
            <div class="form-group">
              <label for="timeout-select">Inactivity Timeout</label>
              <select id="timeout-select">
                <option value="1">1 minute</option>
                <option value="2">2 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>
          
          <div class="settings-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Password Management</h3>
            </div>
            <p class="card-description">Manage your master password and expiry settings</p>
            
            <div class="password-status">
              <div class="status-info">
                <div class="status-label">Password Status</div>
                <div class="status-text">${this.getPasswordExpiryText()}</div>
              </div>
              <div class="status-badge ${this.isPasswordExpired() ? 'expired' : 'active'}">
                ${this.isPasswordExpired() ? 'Expired' : 'Active'}
              </div>
            </div>
            
            <button type="button" id="reset-password-btn" class="btn-danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" stroke="currentColor" stroke-width="2"/>
              </svg>
              Reset Password
            </button>
          </div>
          
          <div class="settings-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h3>Security Tips</h3>
            </div>
            <div class="tips-list">
              <div class="tip">
                <div class="tip-dot"></div>
                <span>Use a strong, unique password that you don't use elsewhere</span>
              </div>
              <div class="tip">
                <div class="tip-dot"></div>
                <span>Set shorter timeout periods for enhanced security in public spaces</span>
              </div>
              <div class="tip">
                <div class="tip-dot"></div>
                <span>Enable password expiry to regularly update your credentials</span>
              </div>
              <div class="tip">
                <div class="tip-dot"></div>
                <span>Lock manually when stepping away from your device</span>
              </div>
            </div>
          </div>
          
          <button type="submit" id="save-settings-btn" class="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2"/>
              <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" stroke-width="2"/>
              <polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="2"/>
            </svg>
            Save Changes
          </button>
        </form>
      </div>
      ${this.getStylesHTML()}
    `;
  }
  
  getStylesHTML() {
    return `
      <style>
        .options-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .setup-card, .settings-card {
          background: linear-gradient(180deg, hsl(225 15% 12%) 0%, hsl(225 15% 10%) 100%);
          border: 1px solid hsl(225 15% 20%);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 8px 32px hsl(220 15% 4% / 0.5);
          margin-bottom: 24px;
        }
        
        .setup-header, .main-header, .settings-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .setup-icon, .header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(142 76% 36%) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(220 15% 8%);
          box-shadow: 0 0 30px hsl(217 91% 55% / 0.3);
        }
        
        .setup-header h1, .main-header h1, .settings-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: hsl(210 40% 95%);
          margin: 0;
        }
        
        .setup-header p, .main-header p, .settings-header p {
          font-size: 14px;
          color: hsl(217 10% 65%);
          margin: 0;
        }
        
        .setup-form, .settings-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: hsl(210 40% 95%);
        }
        
        .form-group input, .form-group select {
          background: hsl(225 15% 16% / 0.5);
          border: 1px solid hsl(225 15% 20%);
          border-radius: 8px;
          padding: 12px 16px;
          color: hsl(210 40% 95%);
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: hsl(217 91% 55%);
          box-shadow: 0 0 0 2px hsl(217 91% 55% / 0.2);
        }
        
        .password-input-container {
          position: relative;
        }
        
        .toggle-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: hsl(217 10% 65%);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          background: hsl(225 15% 20%);
        }
        
        .requirements {
          background: hsl(225 15% 16%);
          border: 1px solid hsl(225 15% 20%);
          border-radius: 8px;
          padding: 16px;
          margin-top: 8px;
        }
        
        .requirements-title {
          font-size: 13px;
          font-weight: 500;
          color: hsl(210 40% 95%);
          margin-bottom: 12px;
        }
        
        .requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: hsl(217 10% 65%);
          margin-bottom: 8px;
        }
        
        .requirement:last-child {
          margin-bottom: 0;
        }
        
        .requirement.valid {
          color: hsl(142 76% 36%);
        }
        
        .requirement-icon {
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }
        
        .requirement.valid .requirement-icon {
          color: hsl(142 76% 36%);
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .checkbox-container input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .expiry-settings {
          margin-top: 12px;
          padding: 12px;
          background: hsl(225 15% 16%);
          border-radius: 6px;
        }
        
        .btn-primary, .btn-secondary, .btn-outline, .btn-danger {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(142 76% 36%) 100%);
          color: hsl(220 15% 8%);
          box-shadow: 0 0 20px hsl(217 91% 55% / 0.3);
        }
        
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: hsl(225 15% 16%);
          color: hsl(210 40% 95%);
          border: 1px solid hsl(225 15% 20%);
        }
        
        .btn-secondary:hover {
          background: hsl(225 15% 20%);
        }
        
        .btn-outline {
          background: transparent;
          color: hsl(210 40% 95%);
          border: 1px solid hsl(225 15% 20%);
        }
        
        .btn-outline:hover {
          background: hsl(225 15% 16%);
        }
        
        .btn-danger {
          background: hsl(0 72% 51%);
          color: white;
        }
        
        .btn-danger:hover {
          background: hsl(0 72% 45%);
        }
        
        .back-btn {
          background: none;
          border: none;
          color: hsl(217 10% 65%);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .back-btn:hover {
          background: hsl(225 15% 16%);
          color: hsl(210 40% 95%);
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .status-card {
          background: linear-gradient(180deg, hsl(225 15% 12%) 0%, hsl(225 15% 10%) 100%);
          border: 1px solid hsl(225 15% 20%);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px hsl(220 15% 4% / 0.5);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .card-header svg {
          color: hsl(217 91% 55%);
        }
        
        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: hsl(210 40% 95%);
          margin: 0;
        }
        
        .card-description {
          font-size: 13px;
          color: hsl(217 10% 65%);
          margin: 0 0 16px 0;
          line-height: 1.4;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: hsl(142 76% 36%);
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(142 76% 36%);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .info-card {
          background: linear-gradient(180deg, hsl(225 15% 12%) 0%, hsl(225 15% 10%) 100%);
          border: 1px solid hsl(225 15% 20%);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px hsl(220 15% 4% / 0.5);
        }
        
        .info-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: hsl(210 40% 95%);
          margin: 0 0 20px 0;
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(217 91% 55% / 0.2);
          color: hsl(217 91% 55%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .step-title {
          font-size: 13px;
          font-weight: 500;
          color: hsl(210 40% 95%);
          margin-bottom: 4px;
        }
        
        .step-description {
          font-size: 12px;
          color: hsl(217 10% 65%);
          line-height: 1.4;
        }
        
        .password-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: hsl(225 15% 16% / 0.3);
          border: 1px solid hsl(225 15% 20% / 0.5);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .status-info .status-label {
          font-size: 13px;
          font-weight: 500;
          color: hsl(210 40% 95%);
        }
        
        .status-info .status-text {
          font-size: 12px;
          color: hsl(217 10% 65%);
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .status-badge.active {
          background: hsl(142 76% 36% / 0.2);
          color: hsl(142 76% 36%);
        }
        
        .status-badge.expired {
          background: hsl(0 72% 51% / 0.2);
          color: hsl(0 72% 51%);
        }
        
        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: hsl(217 10% 65%);
          line-height: 1.4;
        }
        
        .tip-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: hsl(217 91% 55%);
          margin-top: 8px;
          flex-shrink: 0;
        }
        
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
          background: hsl(142 76% 36% / 0.2);
          border: 1px solid hsl(142 76% 36% / 0.3);
          color: hsl(142 76% 36%);
        }
        
        .notification.error {
          background: hsl(0 72% 51% / 0.2);
          border: 1px solid hsl(0 72% 51% / 0.3);
          color: hsl(0 72% 51%);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      </style>
    `;
  }
  
  setupPasswordSetupListeners() {
    const form = document.getElementById('password-setup-form');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const toggleBtn = document.getElementById('toggle-password');
    const submitBtn = document.getElementById('setup-submit');
    const enableExpiryCheckbox = document.getElementById('enable-expiry');
    const expirySettings = document.getElementById('expiry-settings');
    const requirementsDiv = document.getElementById('password-requirements');
    
    let showPassword = false;
    
    toggleBtn.addEventListener('click', () => {
      showPassword = !showPassword;
      passwordInput.type = showPassword ? 'text' : 'password';
      confirmInput.type = showPassword ? 'text' : 'password';
    });
    
    enableExpiryCheckbox.addEventListener('change', () => {
      expirySettings.style.display = enableExpiryCheckbox.checked ? 'block' : 'none';
    });
    
    const validatePassword = () => {
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      
      if (password) {
        requirementsDiv.style.display = 'block';
      } else {
        requirementsDiv.style.display = 'none';
      }
      
      const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      Object.entries(requirements).forEach(([key, valid]) => {
        const element = document.querySelector(`[data-requirement="${key}"]`);
        if (element) {
          element.classList.toggle('valid', valid);
          const icon = element.querySelector('.requirement-icon');
          icon.textContent = valid ? '✓' : '✗';
        }
      });
      
      const isPasswordValid = Object.values(requirements).every(Boolean);
      const passwordsMatch = password === confirm && password.length > 0;
      
      submitBtn.disabled = !isPasswordValid || !passwordsMatch;
    };
    
    passwordInput.addEventListener('input', validatePassword);
    confirmInput.addEventListener('input', validatePassword);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = passwordInput.value;
      const enableExpiry = enableExpiryCheckbox.checked;
      const expiryDays = parseInt(document.getElementById('expiry-days').value);
      
      const passwordHash = btoa(password);
      const expiry = enableExpiry ? Date.now() + (expiryDays * 24 * 60 * 60 * 1000) : null;
      
      await this.saveSettings({
        passwordHash,
        passwordExpiry: expiry
      });
      
      this.currentView = 'main';
      this.render();
    });
  }
  
  setupMainListeners() {
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.currentView = 'settings';
      this.render();
    });
    
    document.getElementById('configure-btn').addEventListener('click', () => {
      this.currentView = 'settings';
      this.render();
    });
    
    document.getElementById('lock-now-btn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: 'LOCK_TAB' });
        this.showNotification('Current tab locked successfully!', 'success');
      } catch (error) {
        console.error('Error locking tab:', error);
        this.showNotification('Failed to lock tab', 'error');
      }
    });
  }
  
  setupSettingsListeners() {
    const form = document.getElementById('settings-form');
    const timeoutSelect = document.getElementById('timeout-select');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-password-btn');
    
    // Set current timeout value
    timeoutSelect.value = this.settings.timeoutMinutes.toString();
    
    backBtn.addEventListener('click', () => {
      this.currentView = 'main';
      this.render();
    });
    
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your password? This will require you to set up a new password.')) {
        this.settings.passwordHash = '';
        this.settings.passwordExpiry = null;
        this.saveSettings({ passwordHash: '', passwordExpiry: null });
        this.render();
      }
    });
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newTimeout = parseInt(timeoutSelect.value);
      await this.saveSettings({ timeoutMinutes: newTimeout });
      
      this.currentView = 'main';
      this.render();
    });
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
  
  isPasswordExpired() {
    return this.settings.passwordExpiry && Date.now() > this.settings.passwordExpiry;
  }
  
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});