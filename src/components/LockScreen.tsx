import React, { useState } from 'react';
import { Lock, Shield, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const maxAttempts = 3;
  const lockoutTime = 30000; // 30 seconds

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Too many attempts. Try again later.`);
      return;
    }

    const success = onUnlock(password);
    
    if (success) {
      setPassword('');
      setAttempts(0);
      setError('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      
      if (newAttempts >= maxAttempts) {
        setIsLocked(true);
        setError(`Too many failed attempts. Locked for ${lockoutTime / 1000} seconds.`);
        
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
          setError('');
        }, lockoutTime);
      } else {
        setError(`Incorrect password. ${maxAttempts - newAttempts} attempts remaining.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-overlay backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-sm bg-gradient-card border-border shadow-card">
        <div className="p-6 text-center">
          <div className="mb-6 animate-pulse-glow">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Tab Locked</h2>
            <p className="text-sm text-muted-foreground">
              Enter your password to unlock and continue
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-slide-up">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="text-center bg-secondary/50 border-border"
              disabled={isLocked}
              autoFocus
            />
            
            <Button 
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
              disabled={!password || isLocked}
            >
              <Shield className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Secured by SecureTab Extension</span>
            </div>
            {attempts > 0 && (
              <div className="mt-2">
                <div className="text-xs text-warning">
                  Failed attempts: {attempts}/{maxAttempts}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LockScreen;