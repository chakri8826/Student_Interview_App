import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { setAuthToken } from "@/lib/api";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const error = params.get("error");

    if (error) {
      setStatus('error');
      setErrorMessage(error);
      return;
    }

    if (token) {
      try {
        if (name) localStorage.setItem("name", name);
        // set token + dispatch auth-changed so App updates immediately
        setAuthToken(token);
        setStatus('success');
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to save authentication data');
      }
    } else {
      setStatus('error');
      setErrorMessage('No authentication token received');
    }
  }, [navigate]);

  const handleRetry = () => {
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authentication</CardTitle>
          <CardDescription>
            Processing your login...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Logging you in...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-green-600 font-semibold">Login successful!</p>
              <p className="text-gray-600 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-red-600 font-semibold">Login failed</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'An unexpected error occurred during authentication.'}
                </AlertDescription>
              </Alert>

              <div className="flex space-x-3">
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
