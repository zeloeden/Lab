/**
 * Assets manager for images, fonts, and other resources
 */

import React, { useState, useRef } from 'react';
import { Asset } from '@/lib/label-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Image, 
  Type, 
  FileText, 
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  Trash2,
  Download,
  Eye,
  Edit,
  Copy,
  MoreVertical,
  Folder,
  FolderOpen
} from 'lucide-react';

interface AssetsProps {
  assets: Asset[];
  onUpload: (file: File, type: 'image' | 'font' | 'icon' | 'template') => Promise<void>;
  onDelete: (assetId: string) => void;
  onRename: (assetId: string, newName: string) => void;
  onSelect: (asset: Asset) => void;
}

export const Assets: React.FC<AssetsProps> = ({
  assets,
  onUpload,
  onDelete,
  onRename,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'font' | 'icon' | 'template'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group assets by type
  const groupedAssets = filteredAssets.reduce((groups, asset) => {
    if (!groups[asset.type]) {
      groups[asset.type] = [];
    }
    groups[asset.type].push(asset);
    return groups;
  }, {} as Record<string, Asset[]>);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        await onUpload(file, uploadType);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }

    setIsUploadDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'font': return <Type className="h-4 w-4" />;
      case 'icon': return <FileText className="h-4 w-4" />;
      case 'template': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAssetColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-green-100 text-green-800';
      case 'font': return 'bg-blue-100 text-blue-800';
      case 'icon': return 'bg-purple-100 text-purple-800';
      case 'template': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Assets</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="uploadType">Asset Type</Label>
                  <select
                    id="uploadType"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="image">Image</option>
                    <option value="font">Font</option>
                    <option value="icon">Icon</option>
                    <option value="template">Template</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="fileInput">Select Files</Label>
                  <Input
                    ref={fileInputRef}
                    id="fileInput"
                    type="file"
                    multiple
                    accept={
                      uploadType === 'image' ? 'image/*' :
                      uploadType === 'font' ? '.ttf,.otf,.woff,.woff2' :
                      uploadType === 'icon' ? '.svg,.png,.ico' :
                      '.json'
                    }
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="font">Fonts</option>
          <option value="icon">Icons</option>
          <option value="template">Templates</option>
        </select>
      </div>

      {/* Assets List */}
      <div className="space-y-4">
        {Object.keys(groupedAssets).length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assets found</p>
            <p className="text-sm text-gray-500">Upload your first asset to get started</p>
          </div>
        ) : (
          Object.entries(groupedAssets).map(([type, typeAssets]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getAssetIcon(type)}
                  <span className="capitalize">{type}s</span>
                  <Badge variant="secondary" className="text-xs">
                    {typeAssets.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {typeAssets.map((asset) => (
                      <AssetGridItem
                        key={asset.id}
                        asset={asset}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onRename={onRename}
                        getAssetColor={getAssetColor}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {typeAssets.map((asset) => (
                      <AssetListItem
                        key={asset.id}
                        asset={asset}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onRename={onRename}
                        getAssetColor={getAssetColor}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

interface AssetGridItemProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onRename: (assetId: string, newName: string) => void;
  getAssetColor: (type: string) => string;
}

const AssetGridItem: React.FC<AssetGridItemProps> = ({
  asset,
  onSelect,
  onDelete,
  onRename,
  getAssetColor
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="p-3 border rounded cursor-pointer hover:border-gray-300 transition-colors"
      onClick={() => onSelect(asset)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-2">
        {/* Asset Preview */}
        <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
          {asset.type === 'image' ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className={`w-8 h-8 rounded flex items-center justify-center ${getAssetColor(asset.type)}`}>
              {asset.type === 'font' ? <Type className="h-4 w-4" /> :
               asset.type === 'icon' ? <FileText className="h-4 w-4" /> :
               <FileText className="h-4 w-4" />}
            </div>
          )}
        </div>
        
        {/* Asset Info */}
        <div className="space-y-1">
          <div className="text-sm font-medium truncate">{asset.name}</div>
          <div className="text-xs text-gray-500">
            {asset.type} • {new Date(asset.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {/* Actions */}
        {isHovered && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(asset);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AssetListItemProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onRename: (assetId: string, newName: string) => void;
  getAssetColor: (type: string) => string;
  formatFileSize: (bytes: number) => string;
}

const AssetListItem: React.FC<AssetListItemProps> = ({
  asset,
  onSelect,
  onDelete,
  onRename,
  getAssetColor,
  formatFileSize
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="p-2 border rounded cursor-pointer hover:border-gray-300 transition-colors"
      onClick={() => onSelect(asset)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        {/* Asset Icon/Preview */}
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
          {asset.type === 'image' ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className={`w-6 h-6 rounded flex items-center justify-center ${getAssetColor(asset.type)}`}>
              {asset.type === 'font' ? <Type className="h-3 w-3" /> :
               asset.type === 'icon' ? <FileText className="h-3 w-3" /> :
               <FileText className="h-3 w-3" />}
            </div>
          )}
        </div>
        
        {/* Asset Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{asset.name}</div>
          <div className="text-xs text-gray-500">
            {asset.type} • {formatFileSize(asset.size)} • {new Date(asset.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {/* Actions */}
        {isHovered && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(asset);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
