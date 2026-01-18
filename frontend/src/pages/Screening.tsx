import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { screeningAPI, cvsAPI, walletAPI, setAuthToken } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  Play,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  User,
  CreditCard,
  Star,
  Shield,
  DollarSign,
  Briefcase,
  TrendingUp,
  Users,
  Code,
  GraduationCap,
  Award,
  Timer,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  HelpCircle,
  RefreshCw,
  Brain,
  Search,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const Screening = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('name');
    navigate('/login', { replace: true });
  }

  // Fetch user's CVs with auto-refresh
  const { data: userCVs, isLoading: cvsLoading } = useQuery({
    queryKey: ['userCVs'],
    queryFn: () => cvsAPI.getUserCVs(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch wallet balance with auto-refresh
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletAPI.getWallet(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Start screening mutation
  const startScreeningMutation = useMutation({
    mutationFn: (cv_id: number) => screeningAPI.runScreening(cv_id),
    onSuccess: (response) => {
      toast.success('CV Screening started successfully!');
      // Immediately refresh wallet and CVs data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['userCVs'] });
      setIsStarting(false);
      // Navigate to screening results if ID is available
      if (response?.data?.id) {
        navigate(`/screening/${response.data.id}`, { state: { analysis: response?.data?.analysis || null } });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to start screening');
      setIsStarting(false);
    }
  });

  const handleStartScreening = () => {
    if (!selectedCV) {
      toast.error('Please select a CV to screen');
      return;
    }

    if ((wallet?.data?.balance_credits || 0) < 1) {
      toast.error('Insufficient credits. You need at least 1 credit to start screening.');
      return;
    }

    setIsStarting(true);
    startScreeningMutation.mutate(parseInt(selectedCV));
  };

  const availableCVs = userCVs?.data?.cvs || [];
  const credits = wallet?.data?.balance_credits || 0;

  if (cvsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
                <p className="text-center text-gray-600 mt-4">Loading CVs...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CV Screening</h1>
              <p className="text-gray-600">Get AI-powered analysis of your CV and skills</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* CV Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Select CV for Screening
                </CardTitle>
                <CardDescription>
                  Choose a CV to get AI-powered analysis and feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableCVs.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You haven't uploaded any CVs yet. Please upload a CV first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedCV} onValueChange={setSelectedCV}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a CV to screen" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCVs.map((cv: any) => (
                          <SelectItem key={cv.id} value={cv.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{cv.filename}</span>
                              <span className="text-gray-500">- {formatDate(cv.created_at)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedCV && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">CV Selected</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          {availableCVs.find((cv: any) => cv.id.toString() === selectedCV)?.filename}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Screening Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  What You'll Get
                </CardTitle>
                <CardDescription>
                  Comprehensive AI analysis of your CV and skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Skills Analysis</h4>
                      <p className="text-sm text-blue-700">Detailed breakdown of your technical and soft skills</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Role Matching</h4>
                      <p className="text-sm text-green-700">How well your CV matches different job roles</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">Improvement Tips</h4>
                      <p className="text-sm text-purple-700">Specific suggestions to enhance your CV</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Award className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Strengths Highlight</h4>
                      <p className="text-sm text-orange-700">Key strengths and achievements identified</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Screening Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="mr-2 h-5 w-5" />
                  Screening Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium">2-3 minutes</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cost</span>
                  <span className="text-sm font-medium">1 Credit</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Format</span>
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Report</span>
                  <span className="text-sm font-medium">Detailed PDF</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Analysis Includes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Skills extraction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Experience analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Education assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Format optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">ATS compatibility</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Instant feedback</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Professional insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Improvement roadmap</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Downloadable report</span>
                </div>
              </CardContent>
            </Card>

            {/* Start Screening Button */}
            <div className="space-y-4">
              <Button
                onClick={handleStartScreening}
                disabled={!selectedCV || credits < 1 || isStarting}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Starting Screening...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start CV Screening
                  </>
                )}
              </Button>

              {credits < 1 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need at least 1 credit to start screening.
                    <Link to="/wallet" className="text-blue-600 hover:underline ml-1">
                      Buy credits
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center">
                <Button variant="outline" onClick={() => navigate('/upload')} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload More CVs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Screening;
