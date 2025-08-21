import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

interface PasswordSetupProps {
  onPasswordSet: (password: string, expiryDays?: number) => void;
}

const PasswordSetup: React.FC<PasswordSetupProps> = ({ onPasswordSet }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);

  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = isPasswordValid && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onPasswordSet(password, enableExpiry ? expiryDays : undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-overlay flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card animate-fade-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Welcome to SecureTab</h1>
              <p className="text-sm text-muted-foreground">Set up your security password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Master Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-secondary/50 border-border"
                  placeholder="Enter a strong password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-secondary/80"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary/50 border-border"
                placeholder="Confirm your password"
              />
            </div>

            {password && (
              <div className="space-y-2 animate-slide-up">
                <Label className="text-sm font-medium text-foreground">Password Requirements</Label>
                <div className="space-y-1">
                  {Object.entries({
                    length: 'At least 8 characters',
                    uppercase: 'One uppercase letter',
                    lowercase: 'One lowercase letter', 
                    number: 'One number',
                    special: 'One special character'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      {passwordValidation[key as keyof typeof passwordValidation] ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-destructive" />
                      )}
                      <span className={`text-xs ${
                        passwordValidation[key as keyof typeof passwordValidation] 
                          ? 'text-success' 
                          : 'text-muted-foreground'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {confirmPassword && (
              <div className="flex items-center gap-2 animate-slide-up">
                {passwordsMatch ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <X className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm ${
                  passwordsMatch ? 'text-success' : 'text-destructive'
                }`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="expiry" 
                  checked={enableExpiry}
                  onCheckedChange={(checked) => setEnableExpiry(checked === true)}
                />
                <Label htmlFor="expiry" className="text-sm text-foreground">
                  Enable password expiry
                </Label>
              </div>
              
              {enableExpiry && (
                <div className="animate-slide-up">
                  <Label htmlFor="expiryDays" className="text-sm font-medium text-foreground">
                    Expires after (days)
                  </Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="bg-secondary/50 border-border mt-1"
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
              disabled={!canSubmit}
            >
              <Shield className="w-4 h-4 mr-2" />
              Set Up Security
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PasswordSetup;