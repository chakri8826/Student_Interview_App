import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { rolesAPI, authAPI, setAuthToken } from '@/lib/api'
import {
  ArrowLeft,
  Search,
  Filter,
  Check,
  Plus,
  Briefcase,
  Code,
  Database,
  Palette,
  BarChart3,
  Users,
  Shield,
  Zap,
  Target,
  Star,
  Clock,
  TrendingUp,
  Brain,
  LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'

const Roles = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])

  // Replace selection endpoint
  const setRolesMutation = useMutation({
    mutationFn: rolesAPI.setUserRoles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] })
      toast.success('Role selection updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update roles')
    },
  })

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch { }
    setAuthToken(null)
    localStorage.removeItem('name')
    navigate('/login', { replace: true })
  }

  // Fetch available roles (AxiosResponse)
  const { data: roles, isLoading: rolesLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesAPI.getRoles,
  })

  // Fallback roles if API returns empty to keep page dynamic/usable
  const roleDescriptions: { [key: string]: string } = {
    'AiRo AI Interviewer - Software Engineer': 'Master coding interviews with our AI interviewer specialized in software engineering, algorithms, and system design.',
    'AiRo AI Interviewer - Cybersecurity': 'Prepare for cybersecurity roles with AI interviewer trained in security protocols, threat analysis, and compliance.',
    'AiRo AI Interviewer - Finance': 'Excel in finance interviews with AI interviewer expert in financial modeling, risk assessment, and market analysis.',
    'AiRo AI Interviewer - Product Engineer': 'Ace product engineering interviews with AI interviewer focused on product development, user experience, and technical strategy.',
    'AiRo AI Interviewer - Business Analyst': 'Succeed in business analyst interviews with AI interviewer specialized in data analysis, process improvement, and stakeholder management.',
    'AiRo AI Interviewer - Human Resources': 'Prepare for HR interviews with AI interviewer trained in talent acquisition, employee relations, and organizational development.',
    'AiRo AI Interviewer - AI/ML': 'Master AI/ML interviews with AI interviewer expert in machine learning, deep learning, and artificial intelligence concepts.',
  }

  const fallbackRoles = [
    { id: 1, title: 'AiRo AI Interviewer - Software Engineer', description: roleDescriptions['AiRo AI Interviewer - Software Engineer'], tags: ['Algorithms', 'System Design', 'DSA'] },
    { id: 2, title: 'AiRo AI Interviewer - Cybersecurity', description: roleDescriptions['AiRo AI Interviewer - Cybersecurity'], tags: ['Threat Analysis', 'Compliance', 'SIEM'] },
    { id: 3, title: 'AiRo AI Interviewer - Finance', description: roleDescriptions['AiRo AI Interviewer - Finance'], tags: ['Modeling', 'Valuation', 'Markets'] },
    { id: 4, title: 'AiRo AI Interviewer - Product Engineer', description: roleDescriptions['AiRo AI Interviewer - Product Engineer'], tags: ['UX', 'Strategy', 'Roadmaps'] },
    { id: 5, title: 'AiRo AI Interviewer - Business Analyst', description: roleDescriptions['AiRo AI Interviewer - Business Analyst'], tags: ['SQL', 'Requirements', 'Dashboards'] },
    { id: 6, title: 'AiRo AI Interviewer - Human Resources', description: roleDescriptions['AiRo AI Interviewer - Human Resources'], tags: ['Talent', 'Policy', 'Culture'] },
    { id: 7, title: 'AiRo AI Interviewer - AI/ML', description: roleDescriptions['AiRo AI Interviewer - AI/ML'], tags: ['ML', 'DL', 'MLOps'] },
  ]

  const availableRoles = Array.isArray(roles?.data) && roles.data.length > 0 ? roles.data : fallbackRoles

  // Fetch user's selected roles (AxiosResponse)
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: rolesAPI.getUserRoles,
  })

  // preload current selections AFTER userRoles is defined
  useEffect(() => {
    const current = (userRoles?.data || []).map((r: any) => r.role_id)
    setSelectedRoles(current)
  }, [userRoles?.data])

  const roleIcons: { [key: string]: React.ReactNode } = {
    'AiRo AI Interviewer - Software Engineer': <Code className="h-5 w-5" />,
    'AiRo AI Interviewer - Cybersecurity': <Shield className="h-5 w-5" />,
    'AiRo AI Interviewer - Finance': <TrendingUp className="h-5 w-5" />,
    'AiRo AI Interviewer - Product Engineer': <Target className="h-5 w-5" />,
    'AiRo AI Interviewer - Business Analyst': <BarChart3 className="h-5 w-5" />,
    'AiRo AI Interviewer - Human Resources': <Users className="h-5 w-5" />,
    'AiRo AI Interviewer - AI/ML': <Brain className="h-5 w-5" />,
  }

  const roleColors: { [key: string]: string } = {
    'AiRo AI Interviewer - Software Engineer': 'bg-blue-500',
    'AiRo AI Interviewer - Cybersecurity': 'bg-red-500',
    'AiRo AI Interviewer - Finance': 'bg-green-500',
    'AiRo AI Interviewer - Product Engineer': 'bg-purple-500',
    'AiRo AI Interviewer - Business Analyst': 'bg-orange-500',
    'AiRo AI Interviewer - Human Resources': 'bg-pink-500',
    'AiRo AI Interviewer - AI/ML': 'bg-indigo-500',
  }

  const getRoleIcon = (title: string) => roleIcons[title] || <Briefcase className="h-5 w-5" />

  const filteredRoles = (availableRoles || []).filter((role: any) => {
    const matchesSearch = role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' ||
      (role.tags || []).some((tag: string) => tag.toLowerCase().includes(selectedCategory))
    return matchesSearch && matchesCategory
  })

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId])
  }

  const handleSaveRoles = () => {
    setRolesMutation.mutate(selectedRoles)
  }

  const isRoleSelected = (roleId: number) => selectedRoles.includes(roleId)

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading roles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load roles. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-4">
            <Brain className="h-5 w-5" />
            <span className="font-semibold">AI-Powered Interviewers</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Roles</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">Select roles you want to practice interviews for.</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Roles</CardTitle>
            <CardDescription>Find the perfect roles for your career goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search roles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'tech', label: 'Technology' },
                    { value: 'security', label: 'Cybersecurity' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'product', label: 'Product' },
                    { value: 'business', label: 'Business' },
                    { value: 'hr', label: 'Human Resources' },
                    { value: 'ai', label: 'AI/ML' },
                  ].map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Selected Roles Summary */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected</h3>
                <p className="text-sm text-blue-700">You can select or deselect roles. Click Save to apply.</p>
              </div>
              <Button onClick={handleSaveRoles} disabled={setRolesMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {setRolesMutation.isPending ? 'Saving...' : 'Save Selection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Interviewer Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoles.map((role: any) => {
            const isSelected = isRoleSelected(role.id)
            const isCurrentlySelected = selectedRoles.includes(role.id)
            const roleColor = roleColors[role.title] || 'bg-blue-500'
            const roleDescription = role.description

            return (
              <Card key={role.id} className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${isCurrentlySelected ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50' :
                isSelected ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'hover:shadow-lg'
                }`} onClick={() => handleRoleToggle(role.id)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${roleColor} text-white shadow-lg`}>
                        {getRoleIcon(role.title)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Interviewer
                          </Badge>
                          {isSelected && (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight">{role.title}</CardTitle>
                      </div>
                    </div>
                    {isCurrentlySelected && (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-slate-600 leading-relaxed">{roleDescription}</CardDescription>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Specialized Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {(role.tags || []).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">5 credits</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>Expert Level</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>30-45 min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredRoles.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No roles found</h3>
              <p className="text-slate-600 mb-4">Try adjusting your search terms or category filter</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>Clear Filters</Button>
            </CardContent>
          </Card>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Continue to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}

export default Roles

