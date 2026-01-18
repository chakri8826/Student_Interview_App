import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { interviewAPI, rolesAPI, cvsAPI, walletAPI, setAuthToken } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Brain,
  Play,
  Clock,
  AlertCircle,
  CheckCircle,
  Target,
  FileText,
  Star,
  Shield,
  DollarSign,
  Briefcase,
  TrendingUp,
  Users,
  Code,
  Award,
  Timer,
  Camera,
  Mic,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Interview = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('name');
    navigate('/login', { replace: true });
  }

  // Fetch user's selected roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: () => rolesAPI.getUserRoles(),
  });

  // Fetch user's CVs
  const { data: userCVs, isLoading: cvsLoading } = useQuery({
    queryKey: ['userCVs'],
    queryFn: () => cvsAPI.getUserCVs(),
  });

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletAPI.getWallet(),
  });

  const availableRoles = userRoles?.data?.roles || [];
  const availableCVs = userCVs?.data?.cvs || [];
  const credits = wallet?.data?.balance_credits || 0;

  // Auto-pick first available role when roles load
  useEffect(() => {
    if (!selectedRole && availableRoles.length > 0) {
      setSelectedRole(availableRoles[0].id.toString());
    }
  }, [availableRoles, selectedRole]);

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: (data: { role_id: number; cv_id?: number }) => interviewAPI.startInterview(data),
    onSuccess: (response) => {
      setShowStartDialog(false);
      setIsStarting(false);
      const joinUrl = response?.data?.join_url;
      if (joinUrl) {
        toast.success('AI Interview started! Redirecting...');
        window.location.assign(joinUrl);
        return;
      }
      // No join URL returned → show actionable error
      toast.error('Could not start the interview. Please check your Tavus API key and replica/persona IDs in backend .env, then retry.');
    },
    onError: (error: any) => {
      setIsStarting(false);
      setShowStartDialog(false);
      const message = error?.response?.data?.detail || 'Failed to start interview';
      toast.error(message);
    }
  });

  const handleStartInterview = () => {
    if (!selectedCV) {
      toast.error('Please select a CV to start the interview.');
      return;
    }

    if (credits < 5) {
      toast.error('Insufficient credits. You need at least 5 credits to start an interview.');
      return;
    }

    setShowStartDialog(true);
  };

  const confirmStartInterview = () => {
    setIsStarting(true);
    const fallbackRoleId = availableRoles.length > 0 ? availableRoles[0].id : 1;
    startInterviewMutation.mutate({
      role_id: parseInt((selectedRole || fallbackRoleId).toString()),
      cv_id: parseInt(selectedCV)
    });
  };

  if (rolesLoading || cvsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-center text-gray-600 mt-4">Loading data...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Start AI Interview</h1>
              <p className="text-gray-600">Select a CV and start your interview</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* CV Selection Only */}
          <div className="lg:col-span-2">
            {availableRoles.length === 0 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You haven't selected any AI interviewers yet. Please select them on the <Link to="/roles" className="text-blue-600 underline">Roles</Link> page.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Select CV
                </CardTitle>
                <CardDescription>
                  Choose a CV to provide context to your AI interviewer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCV} onValueChange={setSelectedCV}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a CV" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCVs.map((cv: any) => (
                      <SelectItem key={cv.id} value={cv.id.toString()}>
                        {cv.filename} - {formatDate(cv.created_at)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="mr-2 h-5 w-5" />
                  Interview Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium">30-45 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cost</span>
                  <span className="text-sm font-medium">5 Credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Format</span>
                  <span className="text-sm font-medium">Video + Audio</span>
                </div>
              </CardContent>
            </Card>

            {/* Start Interview Button */}
            <div className="space-y-4">
              <Button
                onClick={handleStartInterview}
                disabled={!selectedCV || credits < 5 || isStarting}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start AI Interview
                  </>
                )}
              </Button>

              {credits < 5 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need at least 5 credits to start an interview.
                    <Link to="/wallet" className="text-blue-600 hover:underline ml-1">
                      Buy credits
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        {/* Start Interview Confirmation Dialog */}
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Confirm AI Interview Start
              </DialogTitle>
              <DialogDescription>
                You're about to start an AI interview. This will consume 5 credits from your wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Interview Details:</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• Selected CV: {availableCVs.find((cv: any) => cv.id.toString() === selectedCV)?.filename}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowStartDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={confirmStartInterview} disabled={isStarting} className="flex-1">
                  {isStarting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Interview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Interview;
