import React, { useState, useEffect } from 'react';
import { Shield, Settings, Lock } from 'lucide-react';
import PasswordSetup from './PasswordSetup';
import LockScreen from './LockScreen';
import SettingsPanel from './SettingsPanel';
import ActivityMonitor from './ActivityMonitor';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface SecuritySettings {
  timeoutMinutes: number;
  passwordHash: string;
  passwordExpiry: number | null;
}

const SecurityExtensionApp = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    timeoutMinutes: 5,
    passwordHash: '',
    passwordExpiry: null
  });

  useEffect(() => {
    const stored = localStorage.getItem('security-settings');
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      setSettings(parsedSettings);
      setIsSetup(!!parsedSettings.passwordHash);
    }
  }, []);

  const handlePasswordSetup = (password: string, expiryDays?: number) => {
    const passwordHash = btoa(password); // Simple encoding for demo
    const expiry = expiryDays ? Date.now() + (expiryDays * 24 * 60 * 60 * 1000) : null;
    
    const newSettings = {
      ...settings,
      passwordHash,
      passwordExpiry: expiry
    };
    
    setSettings(newSettings);
    localStorage.setItem('security-settings', JSON.stringify(newSettings));
    setIsSetup(true);
  };

  const handleUnlock = (password: string) => {
    const inputHash = btoa(password);
    if (inputHash === settings.passwordHash) {
      setIsLocked(false);
    }
    return inputHash === settings.passwordHash;
  };

  const handleInactivity = () => {
    setIsLocked(true);
  };

  const handleSettingsUpdate = (newSettings: Partial<SecuritySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('security-settings', JSON.stringify(updatedSettings));
  };

  if (!isSetup) {
    return <PasswordSetup onPasswordSet={handlePasswordSetup} />;
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  if (showSettings) {
    return (
      <SettingsPanel 
        settings={settings}
        onSettingsUpdate={handleSettingsUpdate}
        onBack={() => setShowSettings(false)}
        onResetPassword={() => {
          setIsSetup(false);
          setSettings(prev => ({ ...prev, passwordHash: '', passwordExpiry: null }));
          localStorage.removeItem('security-settings');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-card animate-fade-in">
      <ActivityMonitor 
        timeoutMinutes={settings.timeoutMinutes}
        onInactivity={handleInactivity}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SecureTab</h1>
              <p className="text-muted-foreground">Chrome Security Extension</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Security Status</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Your tabs are protected with password lock
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></div>
              <span className="text-sm text-success">Active Protection</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Auto-Lock</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Locks after {settings.timeoutMinutes} minutes of inactivity
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsLocked(true)}
              className="gap-2"
            >
              <Lock className="w-3 h-3" />
              Lock Now
            </Button>
          </Card>

          <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Configuration</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Customize timeout and security settings
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="w-3 h-3" />
              Configure
            </Button>
          </Card>
        </div>

        <Card className="mt-8 p-6 bg-gradient-card border-border shadow-card animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="font-semibold text-foreground mb-4">How it works</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Monitor Activity</p>
                <p className="text-xs text-muted-foreground">Tracks mouse and keyboard activity</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Auto Lock</p>
                <p className="text-xs text-muted-foreground">Locks tabs after configured timeout</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Secure Access</p>
                <p className="text-xs text-muted-foreground">Requires password to unlock</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SecurityExtensionApp;