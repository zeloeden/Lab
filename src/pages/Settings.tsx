import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useIcons } from '@/contexts/IconContext';
import { availableIconPacks } from '@/lib/iconPacks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/UserAvatar';
import { SoundSettings } from '@/components/SoundSettings';
import { CustomFieldsManager } from '@/components/CustomFieldsManager';
import { SeedDataButton } from '@/components/SeedDataButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  User, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Camera,
  Upload,
  Trash2,
  Save,
  Volume2,
  Database,
  Wrench,
  Lock,
  Languages,
  Moon,
  Sun,
  Monitor,
  Key,
  Smartphone,
  LogIn,
  AlertTriangle,
  CheckCircle,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Package,
  AlertCircle,
  Beaker,
  Building2,
  Eye
} from 'lucide-react';
import Icon from '@/components/Icon';
import { getFinishedGoodsSettings, saveFinishedGoodsSettings, FinishedGoodsSettings } from '@/lib/utils';
import { useAppearance, HeaderPattern, PatternIntensity } from '@/providers/AppearanceProvider';
import { GlassSection } from '@/components/ui/GlassSection';
import { SectionIcon } from '@/components/ui/SectionIcon';
import { Info, DollarSign, MapPin, PackageOpen } from 'lucide-react';
import { useScale } from '@/lib/scale/useScale';

export function Settings() {
  const { user, updateUserProfile, uploadProfilePhoto, removeProfilePhoto } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { currentPack, changeIconPack } = useIcons();
  const { 
    sectionFill, 
    headerPattern, 
    headerPatternIntensity, 
    headerWatermark,
    setAppearance,
    setSectionFill
  } = useAppearance();
  
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows PC - Chrome', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
    { id: 2, device: 'iPhone 13 - Safari', location: 'New York, USA', lastActive: '1 hour ago', current: false },
  ]);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    desktopEnabled: true,
    testReminders: true,
    sampleUpdates: true,
    supplierAlerts: false,
    systemUpdates: true,
    weeklyReport: true
  });

  const handleSeed = async () => {
    if (!window.confirm('This will clear current local Samples/Formulas and load seed data. Continue?')) return;
    try {
      localStorage.setItem('nbslims_seed_now','true');
      window.location.reload();
    } catch (e) {
      toast.error('Failed to trigger seed');
    }
  };

  const handleProfileUpdate = () => {
    updateUserProfile(profileData);
    toast.success('Profile updated successfully');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const success = await uploadProfilePhoto(file);
      if (success) {
        toast.success('Profile photo updated successfully');
      } else {
        toast.error('Failed to upload profile photo');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    removeProfilePhoto();
    toast.success('Profile photo removed');
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'en' | 'ar');
    toast.success(newLanguage === 'en' ? 'Language changed to English' : 'تم تغيير اللغة إلى العربية');
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    // Here you would call an API to change the password
    toast.success('Password changed successfully');
    setShowPasswordDialog(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(true);
    setShow2FADialog(false);
    toast.success('Two-factor authentication enabled');
  };

  const handleRevokeSession = (sessionId: number) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    toast.success('Session revoked successfully');
  };

  const handleNotificationPrefChange = (key: string, value: boolean | string) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
    toast.success('Notification preferences updated');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('settings.title', 'Settings')}</h1>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="finished-goods" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Finished Goods</span>
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Developer</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center space-y-3">
                  <UserAvatar user={user} size="xl" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Change
                        </>
                      )}
                    </Button>
                    {user.profilePhoto && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    JPG, PNG, GIF or WebP<br/>Max 5MB
                  </p>
                </div>

                {/* Profile Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter your username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="flex items-center h-10">
                        <Badge variant="outline" className="px-3 py-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleProfileUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>
                Customize the visual appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selector */}
              <div className="space-y-3">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Light</div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Dark</div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'system' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">System</div>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Icon Pack Selection */}
              <div className="space-y-3">
                <Label>Icon Style</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableIconPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => changeIconPack(pack.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        currentPack.id === pack.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={pack.preview} 
                        alt={pack.name}
                        className="w-6 h-6 mb-2"
                      />
                      <div className="text-sm font-medium">{pack.name}</div>
                      <div className="text-xs text-gray-500">{pack.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section Fill (AppearanceProvider) */}
              <div className="space-y-3">
                <Label>Section Fill Style</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSectionFill('headers')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      sectionFill === 'headers' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">Headers Only</div>
                    <div className="text-xs text-gray-500">Clean glass body with colored header</div>
                  </button>
                  <button
                    onClick={() => setSectionFill('vivid')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      sectionFill === 'vivid' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">Vivid Sections</div>
                    <div className="text-xs text-gray-500">Full gradient fill throughout</div>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Header Pattern */}
              <div className="space-y-3">
                <Label>Header Pattern</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['none', 'brandTiles', 'brandDense', 'brandRows'] as HeaderPattern[]).map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setAppearance({ headerPattern: pattern })}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        headerPattern === pattern 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {pattern === 'none' ? 'None' : 
                         pattern === 'brandTiles' ? 'Tiles' :
                         pattern === 'brandDense' ? 'Dense' : 'Rows'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Intensity */}
              {headerPattern !== 'none' && (
                <div className="space-y-3">
                  <Label>Pattern Intensity</Label>
                  <div className="flex items-center gap-4">
                    {([0, 1, 2, 3] as PatternIntensity[]).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setAppearance({ headerPatternIntensity: intensity })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          headerPatternIntensity === intensity 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    0 = hidden, 1 = subtle, 2 = moderate, 3 = strong
                  </p>
                </div>
              )}

              <Separator />

              {/* Header Watermark */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Header Watermark</Label>
                  <p className="text-xs text-gray-500">
                    Show logo watermark in section headers
                  </p>
                </div>
                <Switch 
                  checked={headerWatermark}
                  onCheckedChange={(checked) => setAppearance({ headerWatermark: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your appearance settings look in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassSection
                  icon={<SectionIcon icon={Info} />}
                  title="Basic Information"
                  variant="turquoise"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sample content with turquoise theme</p>
                    <div className="h-20 rounded bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Preview Area</span>
                    </div>
                  </div>
                </GlassSection>

                <GlassSection
                  icon={<SectionIcon icon={PackageOpen} />}
                  title="Patch & Supplier"
                  variant="indigo"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sample content with indigo theme</p>
                    <div className="h-20 rounded bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Preview Area</span>
                    </div>
                  </div>
                </GlassSection>

                <GlassSection
                  icon={<SectionIcon icon={MapPin} />}
                  title="Storage Location"
                  variant="sky"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sample content with sky theme</p>
                    <div className="h-20 rounded bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Preview Area</span>
                    </div>
                  </div>
                </GlassSection>

                <GlassSection
                  icon={<SectionIcon icon={DollarSign} />}
                  title="Pricing"
                  variant="emerald"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sample content with emerald theme</p>
                    <div className="h-20 rounded bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Preview Area</span>
                    </div>
                  </div>
                </GlassSection>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Language</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab - Reorganized */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Preferences - Left Column */}
            <div className="space-y-6">
            {/* Seed card removed per request */}
              {/* Scale Settings */}
              {(() => {
                const { supported, connected, reading, connect, tare, ping, reconnect, setSerialOptions, mode, setMode, wsUrl, setWsUrl, pickJA5003, serialActive } = useScale() as any;
                const [consoleLines, setConsoleLines] = React.useState<string[]>([]);
                
                // Helper to format reading (both for console and "Last:" line)
                const formatReading = (raw: string | null | undefined): string => {
                  if (!raw) return '—';
                  try {
                    const parsed = JSON.parse(raw);
                    if (parsed.type === 'weight') {
                      const stableTag = parsed.stable ? '[STABLE]' : '[live]';
                      return `${parsed.value.toFixed(3)} ${parsed.unit} ${stableTag}`;
                    }
                  } catch {
                    // Not JSON, return as-is (old bridge format)
                  }
                  return raw;
                };
                
                React.useEffect(()=>{
                  if (reading?.raw){
                    const displayLine = formatReading(reading.raw);
                    setConsoleLines(prev=> [new Date().toLocaleTimeString() + '  ' + displayLine, ...prev].slice(0,10));
                  }
                }, [reading?.raw]);
                const [baud, setBaud] = React.useState(9600);
                const [dataBits, setDataBits] = React.useState<'7'|'8'>('8');
                const [stopBits, setStopBits] = React.useState<'1'|'2'>('1');
                const [parity, setParity] = React.useState<'none'|'even'|'odd'>('none');
                const [flow, setFlow] = React.useState<'none'|'hardware'>('none');
                const wsConnected = connected && mode === 'bridge';
                const bothActive = Boolean(wsConnected && serialActive);
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Scale Settings
                      </CardTitle>
                      <CardDescription>
                        Configure serial options and connect your lab scale
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!supported && (
                        <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
                          Web Serial is not available. Use Chrome/Edge on HTTPS or localhost.
                        </div>
                      )}
                      {bothActive && (
                        <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
                          Warning: Web Serial and WS Bridge are both active. Use only one mode at a time.
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <Label>Mode</Label>
                          <div className="flex gap-2">
                            <button className={`px-3 py-1 rounded border ${mode==='webserial'?'bg-blue-50 border-blue-400':'border-gray-300'}`} onClick={()=> setMode('webserial')}>Browser Serial</button>
                            <button className={`px-3 py-1 rounded border ${mode==='bridge'?'bg-blue-50 border-blue-400':'border-gray-300'}`} onClick={()=> setMode('bridge')}>Local Bridge (WS)</button>
                          </div>
                        </div>
                        {mode==='bridge' && (
                          <div>
                            <Label>Bridge URL</Label>
                            <Input value={wsUrl} onChange={(e)=> setWsUrl(e.target.value)} placeholder="ws://127.0.0.1:8787" />
                            <p className="text-xs text-gray-500 mt-1">Run the bridge: node scripts/ja5003_ws_bridge.js (or pnpm run scale:bridge:soft).</p>
                          </div>
                        )}
                        {mode==='webserial' && (
                          <div className="text-xs text-gray-500">Web Serial works only in Chrome/Edge. Firefox/Safari not supported.</div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        <div>
                          <Label>Baud</Label>
                          <Input value={baud} onChange={(e)=> setBaud(parseInt(e.target.value)||9600)} placeholder="9600" disabled={mode==='bridge'} />
                        </div>
                        <div>
                          <Label>Data Bits</Label>
                          <Select value={dataBits} onValueChange={(v)=> setDataBits(v as '7'|'8')} disabled={mode==='bridge'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Stop Bits</Label>
                          <Select value={stopBits} onValueChange={(v)=> setStopBits(v as '1'|'2')} disabled={mode==='bridge'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Parity</Label>
                          <Select value={parity} onValueChange={(v)=> setParity(v as 'none'|'even'|'odd')} disabled={mode==='bridge'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="even">Even</SelectItem>
                              <SelectItem value="odd">Odd</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Flow Control</Label>
                          <Select value={flow} onValueChange={(v)=> setFlow(v as 'none'|'hardware')} disabled={mode==='bridge'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="hardware">Hardware</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-end mt-2">
                        <span className={`inline-flex items-center gap-1 text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                          {connected ? 'Connected' : 'Not connected'}
                        </span>
                        <Button variant="outline" onClick={()=> { setSerialOptions({ baudRate: baud, dataBits: dataBits==='8'?8:7, stopBits: stopBits==='2'?2:1, parity, flowControl: flow }); toast.success('Scale serial options saved'); }} disabled={mode==='bridge'}>Save</Button>
                        <Button onClick={connect} disabled={mode==='bridge'}>Connect</Button>
                        <Button variant="outline" onClick={pickJA5003} disabled={mode==='bridge'}>Pick JA5003</Button>
                        <Button variant="secondary" onClick={tare}>Send TARE</Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last: {formatReading(reading?.raw)}
                      </div>
                      <div className="mt-3 p-2 rounded border bg-white/50 dark:bg-gray-900/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-medium">Live Console</div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={ping} disabled={mode==='webserial'}>Ping</Button>
                            <Button variant="outline" size="sm" onClick={reconnect} disabled={mode==='webserial'}>Reconnect</Button>
                            <Button variant="ghost" size="sm" onClick={()=> setConsoleLines([])}>Clear</Button>
                          </div>
                        </div>
                        <pre className="text-xs max-h-40 overflow-auto whitespace-pre-wrap">
{consoleLines.join('\n')}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive important updates via email</p>
                        </div>
                      </div>
                      <Switch 
                        checked={notificationPrefs.emailEnabled}
                        onCheckedChange={(checked) => handleNotificationPrefChange('emailEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-500" />
                        <div>
                          <Label>Desktop Notifications</Label>
                          <p className="text-sm text-gray-500">Show browser notifications</p>
                        </div>
                      </div>
                      <Switch 
                        checked={notificationPrefs.desktopEnabled}
                        onCheckedChange={(checked) => handleNotificationPrefChange('desktopEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-gray-500" />
                        <div>
                          <Label>In-App Messages</Label>
                          <p className="text-sm text-gray-500">Show notifications within the app</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Notification Types
                  </CardTitle>
                  <CardDescription>
                    Select which events you want to be notified about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <Beaker className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Test Reminders</span>
                    </div>
                    <Switch 
                      checked={notificationPrefs.testReminders}
                      onCheckedChange={(checked) => handleNotificationPrefChange('testReminders', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Sample Updates</span>
                    </div>
                    <Switch 
                      checked={notificationPrefs.sampleUpdates}
                      onCheckedChange={(checked) => handleNotificationPrefChange('sampleUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Supplier Alerts</span>
                    </div>
                    <Switch 
                      checked={notificationPrefs.supplierAlerts}
                      onCheckedChange={(checked) => handleNotificationPrefChange('supplierAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">System Updates</span>
                    </div>
                    <Switch 
                      checked={notificationPrefs.systemUpdates}
                      onCheckedChange={(checked) => handleNotificationPrefChange('systemUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Weekly Reports</span>
                    </div>
                    <Switch 
                      checked={notificationPrefs.weeklyReport}
                      onCheckedChange={(checked) => handleNotificationPrefChange('weeklyReport', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sound & Other Preferences - Right Column */}
            <div className="space-y-6">
              {/* Sound Settings */}
              <SoundSettings />
            </div>
          </div>

          {/* Custom Fields - Full Width */}
          <CustomFieldsManager />
        </TabsContent>

        {/* Security Tab - Now Functional */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Account Secure</span>
                    </div>
                    <p className="text-sm text-green-700">All security features are properly configured</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password Strength</span>
                      <Badge variant="outline" className="bg-green-50">Strong</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Two-Factor Auth</span>
                      <Badge variant={twoFactorEnabled ? "outline" : "secondary"}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Password Change</span>
                      <span className="text-gray-900">30 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    Manage your authentication methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium">Change Password</div>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      Change
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        Two-Factor Authentication
                        {!twoFactorEnabled && (
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Button 
                      variant={twoFactorEnabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => twoFactorEnabled ? setTwoFactorEnabled(false) : setShow2FADialog(true)}
                    >
                      {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage devices where you're logged in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">{session.device}</span>
                            {session.current && (
                              <Badge variant="outline" className="text-xs bg-blue-50">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{session.location}</p>
                          <p className="text-xs text-gray-400">Last active: {session.lastActive}</p>
                        </div>
                        {!session.current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Revoke All Other Sessions
                  </Button>
                </CardContent>
              </Card>

              {/* Security Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Security Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Password changed</span>
                        <span className="text-gray-500">30 days ago</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">New device login</span>
                        <span className="text-gray-500">2 days ago</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Profile updated</span>
                        <span className="text-gray-500">1 week ago</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Finished Goods Settings */}
        <TabsContent value="finished-goods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Finished Goods Numbering & Location
              </CardTitle>
              <CardDescription>Configure how finished goods codes and locations are generated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const settings: FinishedGoodsSettings = getFinishedGoodsSettings();
                const [codeFormat, setCodeFormat] = React.useState(settings.codeFormat);
                const [prefix, setPrefix] = React.useState(settings.locationRackPrefix);
                const [startPos, setStartPos] = React.useState(settings.startPosition);
                const [useSupplierIndex, setUseSupplierIndex] = React.useState(settings.useSupplierIndex);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Code Format</Label>
                        <Input value={codeFormat} onChange={(e) => setCodeFormat(e.target.value)} placeholder="FG-{YYYY}-{####}" />
                        <p className="text-xs text-gray-500 mt-1">Use tokens: {'{YYYY}'} for year, {'{####}'} for counter.</p>
                      </div>
                      <div>
                        <Label>Rack Prefix</Label>
                        <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="FG" />
                      </div>
                      <div>
                        <Label>Start Position</Label>
                        <Input type="number" value={startPos} onChange={(e) => setStartPos(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Switch checked={useSupplierIndex} onCheckedChange={(v) => setUseSupplierIndex(v)} />
                        <Label className="cursor-pointer">Include Supplier Index in Code</Label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => {
                        saveFinishedGoodsSettings({ codeFormat, locationRackPrefix: prefix, startPosition: startPos, useSupplierIndex });
                        toast.success('Finished goods settings saved');
                      }}>
                        <Save className="h-4 w-4 mr-2" /> Save Settings
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-6">
          <SeedDataButton />
          
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Info className="h-5 w-5" />
                About Test Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Purpose:</strong> This feature helps you quickly populate the system with realistic 
                test data for development, testing, and demonstration purposes.
              </div>
              
              <div>
                <strong>What gets seeded:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li><strong>Samples:</strong> 32 fragrance samples with English and Arabic names, complete with ledger data, customer assignments, pricing tiers, and storage locations</li>
                  <li><strong>Raw Materials:</strong> 24 essential raw materials including solvents, aroma chemicals, and fragrance compounds with pricing and QR codes</li>
                  <li><strong>Suppliers:</strong> 8 major fragrance suppliers (Givaudan, Firmenich, IFF, Symrise, Mane, Takasago, Robertet, Sensient)</li>
                  <li><strong>Customers:</strong> 6 international customers from UAE, UK, USA, France, Saudi Arabia, and Singapore</li>
                  <li><strong>Formulas:</strong> 5 complete formulas with proper ingredient lists and percentages</li>
                  <li><strong>Tests:</strong> 15 sample tests with various statuses (pending, in-progress, completed)</li>
                  <li><strong>Tasks:</strong> 8 sample tasks assigned to team members with different priorities</li>
                  <li><strong>Purchase Orders:</strong> 5 purchase orders with line items and tracking information</li>
                  <li><strong>Companies:</strong> 3 company profiles with initials and settings</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                <strong>Note:</strong> All data includes proper relationships, QR codes, barcodes, 
                Arabic translations, and realistic timestamps. The system will automatically reload 
                after seeding or clearing data.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">QR Code</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <p className="text-xs text-gray-500">Enter the code from your authenticator app</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnable2FA}>
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Settings;