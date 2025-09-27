import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, UserPlus } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-skeleton w-8 h-8 rounded-full"></div>
      </div>
    );
  }

  // Show login required message for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Login Required</CardTitle>
            <p className="text-muted-foreground">
              You need to sign up or log in to access this page.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up / Log In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};