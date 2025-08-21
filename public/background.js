// Background service worker for SecureTab extension
class SecurityManager {
  constructor() {
    this.activityTimers = new Map();
    this.isLocked = false;
    this.settings = {
      timeoutMinutes: 5,
      passwordHash: '',
      passwordExpiry: null
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.startMonitoring();
  }
  
  async loadSettings() {
    const result = await chrome.storage.local.get(['securitySettings']);
    if (result.securitySettings) {
      this.settings = { ...this.settings, ...result.securitySettings };
    }
  }
  
  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await chrome.storage.local.set({ securitySettings: this.settings });
  }
  
  setupEventListeners() {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.resetActivityTimer(tabId);
      }
    });
    
    // Listen for tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.resetActivityTimer(activeInfo.tabId);
    });
    
    // Listen for tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.clearActivityTimer(tabId);
    });
    
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.securitySettings) {
        this.settings = { ...this.settings, ...changes.securitySettings.newValue };
      }
    });
  }
  
  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'ACTIVITY_DETECTED':
        if (sender.tab) {
          this.resetActivityTimer(sender.tab.id);
        }
        break;
        
      case 'GET_SETTINGS':
        sendResponse(this.settings);
        break;
        
      case 'UPDATE_SETTINGS':
        await this.saveSettings(message.settings);
        sendResponse({ success: true });
        break;
        
      case 'UNLOCK_TAB':
        if (this.verifyPassword(message.password)) {
          await this.unlockTab(sender.tab.id);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;
        
      case 'LOCK_TAB':
        await this.lockTab(sender.tab.id);
        sendResponse({ success: true });
        break;
        
      case 'CHECK_LOCK_STATUS':
        const isLocked = await this.isTabLocked(sender.tab.id);
        sendResponse({ isLocked });
        break;
    }
  }
  
  verifyPassword(inputPassword) {
    if (!this.settings.passwordHash) return false;
    
    // Check if password has expired
    if (this.settings.passwordExpiry && Date.now() > this.settings.passwordExpiry) {
      return false;
    }
    
    const inputHash = btoa(inputPassword);
    return inputHash === this.settings.passwordHash;
  }
  
  resetActivityTimer(tabId) {
    // Clear existing timer
    this.clearActivityTimer(tabId);
    
    // Don't set timer if no password is set
    if (!this.settings.passwordHash) return;
    
    // Set new timer
    const timeoutMs = this.settings.timeoutMinutes * 60 * 1000;
    const timerId = setTimeout(() => {
      this.lockTab(tabId);
    }, timeoutMs);
    
    this.activityTimers.set(tabId, timerId);
  }
  
  clearActivityTimer(tabId) {
    const timerId = this.activityTimers.get(tabId);
    if (timerId) {
      clearTimeout(timerId);
      this.activityTimers.delete(tabId);
    }
  }
  
  async lockTab(tabId) {
    try {
      // Set lock status in storage
      await chrome.storage.local.set({ [`tabLocked_${tabId}`]: true });
      
      // Inject lock overlay
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.postMessage({ type: 'SECURETAB_LOCK' }, '*');
        }
      });
      
      console.log(`Tab ${tabId} locked due to inactivity`);
    } catch (error) {
      console.error('Error locking tab:', error);
    }
  }
  
  async unlockTab(tabId) {
    try {
      // Remove lock status from storage
      await chrome.storage.local.remove(`tabLocked_${tabId}`);
      
      // Remove lock overlay
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.postMessage({ type: 'SECURETAB_UNLOCK' }, '*');
        }
      });
      
      // Reset activity timer
      this.resetActivityTimer(tabId);
      
      console.log(`Tab ${tabId} unlocked`);
    } catch (error) {
      console.error('Error unlocking tab:', error);
    }
  }
  
  async isTabLocked(tabId) {
    const result = await chrome.storage.local.get([`tabLocked_${tabId}`]);
    return !!result[`tabLocked_${tabId}`];
  }
  
  async startMonitoring() {
    // Initial setup for all existing tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.id) {
        this.resetActivityTimer(tab.id);
      }
    });
  }
}

// Initialize the security manager
const securityManager = new SecurityManager();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open setup page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
});