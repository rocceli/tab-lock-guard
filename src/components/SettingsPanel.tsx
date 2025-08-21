import React, { useState } from 'react';
import { ArrowLeft, Clock, Shield, Trash2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SecuritySettings } from './SecurityExtensionApp';
import { useToast } from '../hooks/use-toast';

interface SettingsPanelProps {
  settings: SecuritySettings;
  onSettingsUpdate: (settings: Partial<SecuritySettings>) => void;
  onBack: () => void;
  onResetPassword: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsUpdate,
  onBack,
  onResetPassword
}) => {
  const [timeoutMinutes, setTimeoutMinutes] = useState(settings.timeoutMinutes);
  const { toast } = useToast();

  const timeoutOptions = [
    { value: 1, label: '1 minute' },
    { value: 2, label: '2 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' }
  ];

  const handleSave = () => {
    onSettingsUpdate({ timeoutMinutes });
    toast({
      title: "Settings Saved",
      description: "Your security settings have been updated successfully.",
    });
  };

  const handleResetPassword = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your password? This will require you to set up a new password.'
    );
    
    if (confirmed) {
      onResetPassword();
      toast({
        title: "Password Reset",
        description: "Your password has been reset. You'll need to set up a new one.",
        variant: "destructive"
      });
    }
  };

  const getPasswordExpiryText = () => {
    if (!settings.passwordExpiry) return 'Never expires';
    
    const expiryDate = new Date(settings.passwordExpiry);
    const now = new Date();
    
    if (expiryDate <= now) {
      return 'Expired';
    }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Expires in ${daysLeft} days`;
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-card">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
              <p className="text-muted-foreground">Configure your security preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Auto-lock Settings */}
            <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Auto-lock Timeout</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how long to wait before automatically locking tabs due to inactivity
              </p>
              
              <div className="space-y-3">
                <Label htmlFor="timeout" className="text-sm font-medium text-foreground">
                  Inactivity Timeout
                </Label>
                <Select
                  value={timeoutMinutes.toString()}
                  onValueChange={(value) => setTimeoutMinutes(Number(value))}
                >
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeoutOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Password Management */}
            <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Password Management</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your master password and expiry settings
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">Password Status</p>
                    <p className="text-xs text-muted-foreground">{getPasswordExpiryText()}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    !settings.passwordExpiry || new Date(settings.passwordExpiry) > new Date()
                      ? 'bg-success/20 text-success'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {!settings.passwordExpiry || new Date(settings.passwordExpiry) > new Date() ? 'Active' : 'Expired'}
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleResetPassword}
                  className="gap-2 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Password
                </Button>
              </div>
            </Card>

            {/* Security Tips */}
            <Card className="p-6 bg-gradient-card border-border shadow-card animate-slide-up" style={{animationDelay: '0.2s'}}>
              <h3 className="font-semibold text-foreground mb-3">Security Tips</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Use a strong, unique password that you don't use elsewhere</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Set shorter timeout periods for enhanced security in public spaces</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Enable password expiry to regularly update your credentials</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Lock manually when stepping away from your device</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow gap-2"
              disabled={timeoutMinutes === settings.timeoutMinutes}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;