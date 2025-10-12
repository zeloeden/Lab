import React from 'react';
import { useSound } from '@/contexts/SoundContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  MousePointer, 
  CheckSquare, 
  MessageSquare,
  Play,
  RotateCcw
} from 'lucide-react';

export const SoundSettings: React.FC = () => {
  const { settings, updateSettings, testSound, availableSounds } = useSound();

  const handleVolumeChange = (value: number[]) => {
    updateSettings({ volume: value[0] });
  };

  const handleTestSound = (soundType: string, category: 'notifications' | 'clicks') => {
    testSound(soundType);
    toast.success(`Testing ${category === 'notifications' ? 'notification' : 'click'} sound`);
  };

  const resetToDefaults = () => {
    updateSettings({
      enabled: true,
      volume: 0.7,
      notificationSounds: true,
      clickSounds: true,
      taskSounds: true,
      commentSounds: true,
      selectedNotificationSound: 'gentle-chime',
      selectedClickSound: 'soft-click'
    });
    toast.success('Sound settings reset to defaults');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settings.enabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
            <span>Sound Settings</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Configure sound notifications and audio feedback for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Sound Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Sounds</Label>
              <p className="text-sm text-gray-500">
                Master control for all application sounds
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <div className="space-y-2">
              <Label>Volume</Label>
              <div className="flex items-center space-x-4">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <Slider
                  value={[settings.volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 w-12">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Notification Sounds */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Notification Sounds</span>
              </Label>
              <p className="text-sm text-gray-500">
                Play sounds for task notifications and alerts
              </p>
            </div>
            <Switch
              checked={settings.notificationSounds}
              onCheckedChange={(checked) => updateSettings({ notificationSounds: checked })}
              disabled={!settings.enabled}
            />
          </div>

          {settings.enabled && settings.notificationSounds && (
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <Label>Notification Sound</Label>
                <div className="flex items-center space-x-2">
                  <Select
                    value={settings.selectedNotificationSound}
                    onValueChange={(value) => updateSettings({ selectedNotificationSound: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSounds.notifications.map((sound) => (
                        <SelectItem key={sound.id} value={sound.id}>
                          <div>
                            <div className="font-medium">{sound.name}</div>
                            <div className="text-xs text-gray-500">{sound.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSound(settings.selectedNotificationSound, 'notifications')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Individual notification types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                    <Label>Task Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.taskSounds}
                    onCheckedChange={(checked) => updateSettings({ taskSounds: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <Label>Comment Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.commentSounds}
                    onCheckedChange={(checked) => updateSettings({ commentSounds: checked })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Click Sounds */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center space-x-2">
                <MousePointer className="h-4 w-4" />
                <span>Click Sounds</span>
              </Label>
              <p className="text-sm text-gray-500">
                Play sounds when clicking buttons and interactive elements
              </p>
            </div>
            <Switch
              checked={settings.clickSounds}
              onCheckedChange={(checked) => updateSettings({ clickSounds: checked })}
              disabled={!settings.enabled}
            />
          </div>

          {settings.enabled && settings.clickSounds && (
            <div className="space-y-2 pl-6">
              <Label>Click Sound</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={settings.selectedClickSound}
                  onValueChange={(value) => updateSettings({ selectedClickSound: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSounds.clicks.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        <div>
                          <div className="font-medium">{sound.name}</div>
                          <div className="text-xs text-gray-500">{sound.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound(settings.selectedClickSound, 'clicks')}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sound Preview */}
        {settings.enabled && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-base font-medium">Sound Preview</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound('success-tone', 'notifications')}
                  className="flex items-center space-x-2"
                >
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  <span>Task Complete</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound('modern-bell', 'notifications')}
                  className="flex items-center space-x-2"
                >
                  <Bell className="h-4 w-4 text-blue-500" />
                  <span>Task Assigned</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound('subtle-pop', 'clicks')}
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span>New Comment</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound(settings.selectedClickSound, 'clicks')}
                  className="flex items-center space-x-2"
                >
                  <MousePointer className="h-4 w-4 text-gray-500" />
                  <span>Button Click</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};