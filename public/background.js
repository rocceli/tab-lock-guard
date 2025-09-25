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
    this.isInitialized = false;
    
    this.init();
  }
  
  async init() {
    try {
      console.log('Initializing SecurityManager...');
      await this.loadSettings();
      this.setupEventListeners();
      await this.startMonitoring();
      this.isInitialized = true;
      console.log('SecurityManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SecurityManager:', error);
    }
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
    try {
      console.log(`Received message: ${message.type}`, { message, sender });
      
      // Ensure we're initialized before handling messages
      if (!this.isInitialized) {
        console.log('SecurityManager not initialized yet, initializing...');
        await this.init();
      }
      
      switch (message.type) {
        case 'ACTIVITY_DETECTED':
          if (sender.tab) {
            console.log(`Activity detected in tab ${sender.tab.id}`);
            this.resetActivityTimer(sender.tab.id);
            sendResponse({ success: true });
          } else {
            console.warn('ACTIVITY_DETECTED: No sender tab available');
            sendResponse({ success: false, error: 'No tab context available' });
          }
          break;
          
        case 'GET_SETTINGS':
          sendResponse(this.settings);
          break;
          
        case 'UPDATE_SETTINGS':
          try {
            await this.saveSettings(message.settings);
            sendResponse({ success: true });
          } catch (error) {
            console.error('Error updating settings:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        case 'UNLOCK_TAB':
          if (!message.password) {
            sendResponse({ success: false, error: 'No password provided' });
            break;
          }
          
          if (this.verifyPassword(message.password)) {
            if (sender.tab) {
              await this.unlockTab(sender.tab.id);
              sendResponse({ success: true });
            } else {
              console.error('UNLOCK_TAB: No sender tab available');
              sendResponse({ success: false, error: 'No tab context available' });
            }
          } else {
            console.log('Password verification failed');
            sendResponse({ success: false, error: 'Invalid password' });
          }
          break;
          
        case 'LOCK_TAB':
          if (sender.tab) {
            await this.lockTab(sender.tab.id);
            sendResponse({ success: true });
          } else {
            console.error('LOCK_TAB: No sender tab available');
            sendResponse({ success: false, error: 'No tab context available' });
          }
          break;
          
        case 'LOCK_TAB_REQUEST':
          if (message.tabId) {
            console.log(`Lock tab request for tab ${message.tabId}`);
            await this.lockTab(message.tabId);
            sendResponse({ success: true });
          } else {
            console.error('LOCK_TAB_REQUEST: No tabId provided');
            sendResponse({ success: false, error: 'No tabId provided' });
          }
          break;
          
        case 'CHECK_LOCK_STATUS':
          if (sender.tab) {
            const isLocked = await this.isTabLocked(sender.tab.id);
            sendResponse({ isLocked });
          } else {
            console.warn('CHECK_LOCK_STATUS: No sender tab available');
            sendResponse({ isLocked: false });
          }
          break;
          
        case 'PING':
          sendResponse({ success: true, message: 'pong' });
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: 'Unknown message type' });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    // Return true to keep the message channel open for async responses
    return true;
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
    if (!this.settings.passwordHash) {
      console.log(`No password set, skipping timer for tab ${tabId}`);
      return;
    }
    
    // Set new timer
    const timeoutMs = this.settings.timeoutMinutes * 60 * 1000;
    console.log(`Setting activity timer for tab ${tabId}: ${timeoutMs}ms (${this.settings.timeoutMinutes} minutes)`);
    
    const timerId = setTimeout(() => {
      console.log(`Activity timer expired for tab ${tabId}, locking now`);
      this.lockTab(tabId);
    }, timeoutMs);
    
    this.activityTimers.set(tabId, timerId);
    console.log(`Activity timer set for tab ${tabId}, timer ID: ${timerId}`);
  }
  
  clearActivityTimer(tabId) {
    const timerId = this.activityTimers.get(tabId);
    if (timerId) {
      console.log(`Clearing activity timer for tab ${tabId}, timer ID: ${timerId}`);
      clearTimeout(timerId);
      this.activityTimers.delete(tabId);
    }
  }
  
  async lockTab(tabId) {
    try {
      console.log(`Attempting to lock tab ${tabId}`);
      
      // Get tab info
      const tab = await chrome.tabs.get(tabId);
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return;
      }
      
      if (tab.url && (tab.url.startsWith('chrome-extension://') || 
                      tab.url.startsWith('chrome://') || 
                      tab.url.startsWith('moz-extension://') ||
                      tab.url.startsWith('edge://'))) {
        // Don't lock browser/extension pages
        console.warn(`Skipping lock for browser/extension page: ${tab.url}`);
        return;
      }
      
      // Log the URL being processed for debugging
      console.log(`Processing lock request for URL: ${tab.url}`);

      // Set lock status in storage
      await chrome.storage.local.set({ [`tabLocked_${tabId}`]: true });
      console.log(`Lock status set for tab ${tabId}`);

      // Inject lock overlay using executeScript
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            window.postMessage({ type: 'SECURETAB_LOCK' }, '*');
          }
        });
        console.log(`Lock overlay injected into tab ${tabId}`);
      } catch (scriptError) {
        console.error(`Failed to inject lock overlay for tab ${tabId}:`, scriptError);
        console.error(`Script error details:`, {
          name: scriptError.name,
          message: scriptError.message,
          stack: scriptError.stack
        });
        
        // Fallback: try to send a message to content script
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'LOCK_TAB' });
          console.log(`Fallback lock message sent to tab ${tabId}`);
        } catch (messageError) {
          console.error(`Failed to send lock message to tab ${tabId}:`, messageError);
          console.error(`Message error details:`, {
            name: messageError.name,
            message: messageError.message
          });
        }
      }

      console.log(`Tab ${tabId} locked successfully`);
    } catch (error) {
      console.error(`Error locking tab ${tabId}:`, error);
    }
  }
  
  async unlockTab(tabId) {
    try {
      console.log(`Attempting to unlock tab ${tabId}`);
      
      // Remove lock status from storage
      await chrome.storage.local.remove(`tabLocked_${tabId}`);
      console.log(`Lock status removed for tab ${tabId}`);
      
      // Remove lock overlay
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            window.postMessage({ type: 'SECURETAB_UNLOCK' }, '*');
          }
        });
        console.log(`Unlock overlay injected into tab ${tabId}`);
      } catch (scriptError) {
        console.error(`Failed to inject unlock overlay for tab ${tabId}:`, scriptError);
        // Fallback: try to send a message to content script
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'UNLOCK_TAB' });
          console.log(`Fallback unlock message sent to tab ${tabId}`);
        } catch (messageError) {
          console.error(`Failed to send unlock message to tab ${tabId}:`, messageError);
        }
      }
      
      // Reset activity timer
      this.resetActivityTimer(tabId);
      
      console.log(`Tab ${tabId} unlocked successfully`);
    } catch (error) {
      console.error(`Error unlocking tab ${tabId}:`, error);
    }
  }
  
  async isTabLocked(tabId) {
    const result = await chrome.storage.local.get([`tabLocked_${tabId}`]);
    return !!result[`tabLocked_${tabId}`];
  }
  
  async startMonitoring() {
    try {
      console.log('Starting monitoring for existing tabs...');
      // Initial setup for all existing tabs
      const tabs = await chrome.tabs.query({});
      console.log(`Found ${tabs.length} tabs to monitor`);
      
      tabs.forEach(tab => {
        if (tab.id && !tab.url?.startsWith('chrome-extension://')) {
          console.log(`Setting up monitoring for tab ${tab.id}: ${tab.url}`);
          this.resetActivityTimer(tab.id);
        } else if (tab.url?.startsWith('chrome-extension://')) {
          console.log(`Skipping extension tab ${tab.id}: ${tab.url}`);
        }
      });
      
      console.log('Monitoring setup complete');
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  }
}

// Initialize the security manager
let securityManager;

// Initialize or reinitialize the security manager
function initializeSecurityManager() {
  try {
    securityManager = new SecurityManager();
  } catch (error) {
    console.error('Failed to create SecurityManager:', error);
  }
}

// Initialize on startup
initializeSecurityManager();

// Handle service worker lifecycle
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker starting up...');
  initializeSecurityManager();
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  initializeSecurityManager();
  
  if (details.reason === 'install') {
    // Open setup page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
});

// Handle service worker suspension/restart
self.addEventListener('activate', () => {
  console.log('Service worker activated');
  initializeSecurityManager();
});

// Keep service worker alive with periodic pings
setInterval(() => {
  console.log('Service worker heartbeat');
}, 20000); // Every 20 seconds