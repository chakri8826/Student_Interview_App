import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { personaAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Brain,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Share2,
  Star,
  Zap,
  Users,
  Briefcase,
  GraduationCap,
  Code,
  Shield,
  DollarSign,
  Lightbulb,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const Persona = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isComputing, setIsComputing] = useState(false);

  const handleLogout = () => {
    try { const { setAuthToken } = require('@/lib/api'); setAuthToken(null); } catch { }
    localStorage.removeItem('name');
    navigate('/login', { replace: true });
  }

  // Fetch user persona
  const { data: persona, isLoading, error } = useQuery({
    queryKey: ['persona'],
    queryFn: () => personaAPI.getPersona(),
    retry: false
  });

  // Compute persona mutation
  const computePersonaMutation = useMutation({
    mutationFn: () => personaAPI.computePersona(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] });
      toast.success('Persona updated successfully!');
      setIsComputing(false);
    },
    onError: () => {
      toast.error('Failed to compute persona. Please try again.');
      setIsComputing(false);
    }
  });

  const handleComputePersona = () => {
    setIsComputing(true);
    computePersonaMutation.mutate();
  };

  const getSkillIcon = (skill: string) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('java')) {
      return <Code className="h-4 w-4" />;
    } else if (skillLower.includes('security') || skillLower.includes('cyber')) {
      return <Shield className="h-4 w-4" />;
    } else if (skillLower.includes('finance') || skillLower.includes('accounting')) {
      return <DollarSign className="h-4 w-4" />;
    } else if (skillLower.includes('product') || skillLower.includes('management')) {
      return <Briefcase className="h-4 w-4" />;
    } else if (skillLower.includes('analytics') || skillLower.includes('data')) {
      return <TrendingUp className="h-4 w-4" />;
    } else if (skillLower.includes('hr') || skillLower.includes('human')) {
      return <Users className="h-4 w-4" />;
    } else if (skillLower.includes('ai') || skillLower.includes('ml') || skillLower.includes('machine')) {
      return <Brain className="h-4 w-4" />;
    }
    return <Star className="h-4 w-4" />;
  };

  const getSkillColor = (skill: string) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('java')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (skillLower.includes('security') || skillLower.includes('cyber')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (skillLower.includes('finance') || skillLower.includes('accounting')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (skillLower.includes('product') || skillLower.includes('management')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (skillLower.includes('analytics') || skillLower.includes('data')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (skillLower.includes('hr') || skillLower.includes('human')) {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    } else if (skillLower.includes('ai') || skillLower.includes('ml') || skillLower.includes('machine')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
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
                <p className="text-center text-gray-600 mt-4">Loading your AI persona...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !persona?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">AI Persona</h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl">No Persona Found</CardTitle>
                <CardDescription className="text-lg">
                  Your AI persona hasn't been created yet. Let's analyze your profile and CV to build your personalized AI interviewer profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    To create your persona, make sure you have uploaded your CV and selected your preferred AI interviewer roles.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Button
                    onClick={handleComputePersona}
                    disabled={isComputing}
                    className="w-full"
                    size="lg"
                  >
                    {isComputing ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Your Profile...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-5 w-5" />
                        Create My AI Persona
                      </>
                    )}
                  </Button>

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => navigate('/upload')} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Upload CV
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/roles')} className="flex-1">
                      <Target className="mr-2 h-4 w-4" />
                      Select Roles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const personaData = persona.data;

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
              <h1 className="text-3xl font-bold text-gray-900">AI Persona</h1>
              <p className="text-gray-600">Your personalized AI interviewer profile</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Persona Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Persona Summary</CardTitle>
                    <CardDescription>
                      Generated on {formatDate(personaData.updated_at)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {personaData.summary && (
                  <div className="prose max-w-none">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        <Lightbulb className="mr-2 h-5 w-5" />
                        Professional Summary
                      </h3>
                      <p className="text-blue-800 leading-relaxed">
                        {personaData.summary.professional_summary ||
                          "Your AI persona analyzes your CV, selected roles, and profile to create a comprehensive professional summary that helps AI interviewers understand your background and tailor questions accordingly."}
                      </p>
                    </div>
                  </div>
                )}

                {personaData.summary?.strengths && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Key Strengths
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {personaData.summary.strengths.map((strength: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-green-800">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {personaData.summary?.areas_for_improvement && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Areas for Development
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {personaData.summary.areas_for_improvement.map((area: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <Target className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                          <span className="text-yellow-800">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skills Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Skills Analysis
                </CardTitle>
                <CardDescription>
                  {personaData.skills?.length || 0} skills identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                {personaData.skills && personaData.skills.length > 0 ? (
                  <div className="space-y-3">
                    {personaData.skills.map((skill: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        {getSkillIcon(skill)}
                        <Badge
                          variant="outline"
                          className={`${getSkillColor(skill)} border`}
                        >
                          {skill}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No skills identified yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Persona Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completeness</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Skills Identified</span>
                  <span className="text-sm font-medium">{personaData.skills?.length || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">
                    {formatDate(personaData.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/roles')}>
                  <Target className="mr-2 h-4 w-4" />
                  Select AI Interviewers
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/upload')}>
                  <Download className="mr-2 h-4 w-4" />
                  Update CV
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Persona;
