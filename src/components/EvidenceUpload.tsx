import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Shield,
  Clock,
  User
} from 'lucide-react';
import { evidenceService, FileValidationResult, ChainOfCustodyEntry } from '@/services/evidenceService';
import { toast } from 'sonner';

interface EvidenceUploadProps {
  disputeId: string;
  onEvidenceUploaded?: (evidence: any) => void;
  userId?: string;
  userName?: string;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'validating' | 'processing' | 'completed' | 'error';
  validation?: FileValidationResult;
  error?: string;
}

export default function EvidenceUpload({ 
  disputeId, 
  onEvidenceUploaded, 
  userId, 
  userName,
  className = '' 
}: EvidenceUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO'>('IMAGE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'validating'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Validate file
      const validation = await evidenceService.validateFile(file, selectedType);
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, validation, status: validation.isValid ? 'processing' : 'error', error: validation.errors.join(', ') }
            : f
        )
      );

      if (!validation.isValid) {
        toast.error(`File validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast.warning(`File warnings: ${validation.warnings.join(', ')}`);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Upload evidence
      const result = await evidenceService.uploadEvidence(
        disputeId,
        file,
        selectedType,
        `Evidence uploaded for dispute ${disputeId}`,
        userId,
        userName
      );

      clearInterval(progressInterval);

      if (result.success && result.data) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        );

        toast.success('Evidence uploaded successfully');
        onEvidenceUploaded?.(result.data);

        // Remove from uploading files after 3 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.file !== file));
        }, 3000);
      } else {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, status: 'error', error: result.error || 'Upload failed' }
              : f
          )
        );
        toast.error(result.error || 'Failed to upload evidence');
      }
    } catch (error) {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: 'An error occurred during upload' }
            : f
        )
      );
      toast.error('An error occurred during upload');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <Image className="h-4 w-4" />;
      case 'DOCUMENT':
        return <File className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'AUDIO':
        return <Music className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validating':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getFileTypeConfig = (type: string) => {
    return evidenceService.getFileTypeConfig(type as any);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {(['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO'] as const).map((type) => {
              const config = getFileTypeConfig(type);
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type)}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                >
                  {getFileIcon(type)}
                  <span className="text-sm font-medium">{type}</span>
                  {config && (
                    <span className="text-xs text-muted-foreground">
                      Max {formatFileSize(config.maxSize)}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* File Type Info */}
          {(() => {
            const config = getFileTypeConfig(selectedType);
            if (!config) return null;

            return (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-sm mb-2">File Requirements for {selectedType}:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Allowed extensions: {config.allowedExtensions.join(', ')}</div>
                  <div>Max size: {formatFileSize(config.maxSize)}</div>
                  <div>MIME types: {config.mimeTypes.slice(0, 3).join(', ')}{config.mimeTypes.length > 3 ? '...' : ''}</div>
                  {config.validationRules.minWidth && (
                    <div>Min dimensions: {config.validationRules.minWidth}x{config.validationRules.minHeight}</div>
                  )}
                  {config.validationRules.maxDuration && (
                    <div>Max duration: {config.validationRules.maxDuration}s</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Upload evidence files for this dispute
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getFileTypeConfig(selectedType)?.mimeTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploading Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(selectedType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {uploadingFile.file.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(uploadingFile.file.size)}
                      </Badge>
                    </div>
                    
                    {uploadingFile.status === 'uploading' || uploadingFile.status === 'processing' ? (
                      <Progress value={uploadingFile.progress} className="h-2" />
                    ) : uploadingFile.status === 'error' ? (
                      <Alert className="py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {uploadingFile.error}
                        </AlertDescription>
                      </Alert>
                    ) : uploadingFile.status === 'completed' ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Upload completed
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getStatusIcon(uploadingFile.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Evidence Security</h4>
              <p className="text-sm text-blue-800">
                All evidence files are encrypted and stored securely. A complete chain of custody 
                is maintained for legal purposes. Files are automatically validated and metadata 
                is extracted for verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
