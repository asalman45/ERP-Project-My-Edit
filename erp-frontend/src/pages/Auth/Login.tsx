import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ShieldCheck, User } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      toast({
        title: 'Missing credentials',
        description: 'Please provide both username and password.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ username, password });
      toast({
        title: 'Welcome back! 🎉',
        description: 'You have been signed in successfully.',
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      const description = error?.message || error?.response?.message || 'Unable to sign in with provided credentials.';
      toast({
        title: 'Login failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-20" />
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

      <Card className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-lg border border-white/30 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">EmpclERP Admin Access</CardTitle>
          <CardDescription className="text-slate-600">
            Sign in with your secure administrator credentials to manage operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter admin username"
                  disabled={isSubmitting}
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  disabled={isSubmitting}
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-semibold">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in securely'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm text-slate-500">
          <p>
            Authorized personnel only. All access is monitored and audited.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
