import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { cvsAPI, rolesAPI, setAuthToken } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';
import {
  ArrowLeft,
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Eye,
  Trash2,
  Plus,
  Target,
  Briefcase,
  Clock,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  cvId?: number;
}

const Upload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('none');

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('name');
    navigate('/login', { replace: true });
  }

  // Fetch user's selected roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: rolesAPI.getUserRoles,
  });

  // Fetch user's CVs
  const { data: userCVs, isLoading: cvsLoading } = useQuery({
    queryKey: ['userCVs'],
    queryFn: () => cvsAPI.getUserCVs(0, 10),
  });

  // Delete CV mutation
  const deleteCVMutation = useMutation({
    mutationFn: cvsAPI.deleteCV,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCVs'] });
      toast.success('CV deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete CV');
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        toast.error(`${file.name}: Invalid file type. Only PDF, DOC, and DOCX are allowed.`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: File size exceeds 10MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to upload queue
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading',
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files
    for (const uploadFile of newFiles) {
      try {
        await uploadFileToServer(uploadFile);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }, [selectedRole]);

  const uploadFileToServer = async (uploadFile: UploadedFile) => {
    try {
      // Step 1: Get presigned URL
      const presignResponse = await cvsAPI.presignUpload({
        filename: uploadFile.file.name,
        mime_type: uploadFile.file.type,
        role_id: selectedRole !== 'none' ? parseInt(selectedRole) : undefined,
      });

      const { url, fields } = presignResponse.data;

      // Step 2: Upload to storage (PUT to presigned URL)
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': uploadFile.file.type,
        },
        body: uploadFile.file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Step 3: Confirm upload
      const confirmResponse = await cvsAPI.confirmUpload({
        filename: uploadFile.file.name,
        storage_filename: fields.filename,
        role_id: selectedRole !== 'none' ? parseInt(selectedRole) : undefined,
        size_bytes: uploadFile.file.size,
      });

      // Update file status
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100, cvId: confirmResponse.data.id }
          : f
      ));

      toast.success(`${uploadFile.file.name} uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['userCVs'] });

    } catch (error: any) {
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'error', error: error.message || 'Upload failed' }
          : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDeleteCV = (cvId: number) => {
    if (window.confirm('Are you sure you want to delete this CV?')) {
      deleteCVMutation.mutate(cvId);
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-600" />;
      default:
        return <File className="h-5 w-5 text-slate-600" />;
    }
  };

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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">InterviewPro</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload CV</h1>
          <p className="text-slate-600">
            Upload your CV documents to get them mapped to your selected job roles.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Role (Optional)</CardTitle>
                <CardDescription>
                  Choose a specific role to map your CV to, or leave blank for general mapping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific role</SelectItem>
                    {Array.isArray(userRoles?.data) && userRoles!.data.map((role: any) => (
                      <SelectItem key={role.role_id} value={role.role_id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{role.role_title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload CV Files</CardTitle>
                <CardDescription>
                  Drag and drop your CV files here, or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400'
                    }`}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="text-slate-600 mb-2">
                        Drag and drop your CV files here, or click to browse
                      </p>
                      <p className="text-sm text-slate-500">
                        Supports PDF, DOC, DOCX files up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium text-slate-900">Upload Progress</h3>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        {getFileIcon(file.file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.file.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {formatFileSize(file.file.size)}
                          </p>
                          {file.status === 'uploading' && (
                            <Progress value={file.progress} className="mt-2" />
                          )}
                          {file.status === 'error' && (
                            <p className="text-xs text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Supported Formats</p>
                    <p className="text-xs text-slate-600">PDF, DOC, DOCX files</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">File Size Limit</p>
                    <p className="text-xs text-slate-600">Maximum 10MB per file</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Multiple Files</p>
                    <p className="text-xs text-slate-600">Upload multiple CVs at once</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Secure Storage</p>
                    <p className="text-xs text-slate-600">Your files are encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Select Roles First
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  View My Roles
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Existing CVs */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Uploaded CVs</CardTitle>
            <CardDescription>
              Manage your previously uploaded CV documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cvsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading CVs...</p>
              </div>
            ) : Array.isArray(userCVs?.data?.cvs) && userCVs.data.cvs.length > 0 ? (
              <div className="space-y-4">
                {userCVs.data.cvs.map((cv: any) => (
                  <div key={cv.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(cv.filename)}
                      <div>
                        <h3 className="font-medium text-slate-900">{cv.filename}</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>{formatFileSize(cv.size_bytes)}</span>
                          <span>•</span>
                          <span>Uploaded {new Date(cv.created_at).toLocaleDateString()}</span>
                          <Badge variant={cv.status === 'uploaded' ? 'default' : 'secondary'}>
                            {cv.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>CV Details</DialogTitle>
                            <DialogDescription>
                              Information about your uploaded CV
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-slate-900">Filename</label>
                              <p className="text-sm text-slate-600">{cv.filename}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-900">File Size</label>
                              <p className="text-sm text-slate-600">{formatFileSize(cv.size_bytes)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-900">Status</label>
                              <Badge variant={cv.status === 'uploaded' ? 'default' : 'secondary'}>
                                {cv.status}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-900">Upload Date</label>
                              <p className="text-sm text-slate-600">
                                {new Date(cv.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCV(cv.id)}
                        disabled={deleteCVMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No CVs uploaded yet</h3>
                <p className="text-slate-600 mb-4">Drag and drop your CVs above to get started.</p>
                <div className="flex items-center justify-center space-x-3">
                  <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Upload Now
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/roles')}>
                    Select Roles
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
