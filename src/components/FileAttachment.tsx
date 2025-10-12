import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Paperclip,
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  X
} from 'lucide-react';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface FileAttachmentProps {
  attachments: FileAttachment[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (attachmentId: string) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
  showUploadButton?: boolean;
  className?: string;
}

export const FileAttachmentComponent: React.FC<FileAttachmentProps> = ({
  attachments,
  onUpload,
  onDelete,
  maxFileSize = 10,
  allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  maxFiles = 10,
  showUploadButton = true,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (type === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (type.includes('word') || type.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (type.includes('excel') || type.includes('sheet')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxSizeBytes = maxFileSize * 1024 * 1024;

    if (attachments.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid, errors };
    }

    files.forEach(file => {
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: File size must be less than ${maxFileSize}MB`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    if (valid.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(valid);
      toast.success(`${valid.length} file(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onUpload, maxFileSize, allowedTypes, maxFiles, attachments.length]);

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canPreview = (type: string) => {
    return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('text/');
  };

  const renderPreview = (file: FileAttachment) => {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={file.url} 
          alt={file.name}
          className="max-w-full max-h-96 object-contain rounded"
        />
      );
    } else if (file.type === 'application/pdf') {
      return (
        <iframe
          src={file.url}
          className="w-full h-96 border rounded"
          title={file.name}
        />
      );
    } else if (file.type.startsWith('text/')) {
      return (
        <div className="w-full h-96 border rounded p-4 bg-gray-50 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap">
            Loading content...
          </pre>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-96 border rounded bg-gray-50">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Preview not available for this file type</p>
          <Button onClick={() => handleDownload(file)} className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      {showUploadButton && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || attachments.length >= maxFiles}
            className="flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload Files</span>
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-xs text-gray-500">
            Max {maxFiles} files, {maxFileSize}MB each
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            Attachments ({attachments.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(attachment.size)}</span>
                        <span>•</span>
                        <span>by {attachment.uploadedBy}</span>
                        <span>•</span>
                        <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {canPreview(attachment.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(attachment)}
                        className="p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      className="p-1"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(attachment.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(previewFile.type)}
                    <span>{previewFile.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {formatFileSize(previewFile.size)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(previewFile)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Uploaded by {previewFile.uploadedBy} on {new Date(previewFile.uploadedAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-auto">
                {renderPreview(previewFile)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};