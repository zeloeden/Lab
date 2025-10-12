import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Mail, User } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  
  // CRITICAL: Individual state variables to prevent focus loss
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stable handlers - CRITICAL: These must not change on re-render
  const handleEmailOrUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrUsername(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  }, [error]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const validateInput = (input: string): boolean => {
    // Check if input is email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if input is valid username (alphanumeric, underscore, hyphen, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    
    return emailRegex.test(input) || usernameRegex.test(input);
  };

  const getInputType = (input: string): 'email' | 'username' => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input) ? 'email' : 'username';
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateInput(emailOrUsername)) {
      setError('Please enter a valid email address or username (3-20 characters, letters, numbers, underscore, or hyphen only)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const inputType = getInputType(emailOrUsername);
      const success = await login(emailOrUsername, password, inputType);
      
      if (success) {
        toast.success(`Welcome! Logged in with ${inputType}`);
      } else {
        setError('Invalid credentials. Please check your email/username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [emailOrUsername, password, login]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to NBS LIMS
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in with your email address or username
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername" className="text-sm font-medium text-gray-700">
                Email or Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getInputType(emailOrUsername) === 'email' ? (
                    <Mail className="h-4 w-4 text-gray-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <Input
                  id="emailOrUsername"
                  type="text"
                  value={emailOrUsername}
                  onChange={handleEmailOrUsernameChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter email or username"
                  className="pl-10"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              {emailOrUsername && (
                <p className="text-xs text-gray-500">
                  {getInputType(emailOrUsername) === 'email' 
                    ? '✓ Email format detected' 
                    : '✓ Username format detected'
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !emailOrUsername || !password}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Demo credentials: <br />
              Email: <code className="bg-gray-100 px-1 rounded">admin@nbslims.com</code> <br />
              Username: <code className="bg-gray-100 px-1 rounded">admin</code> <br />
              Password: <code className="bg-gray-100 px-1 rounded">admin123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};