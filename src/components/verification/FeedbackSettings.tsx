import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Volume2, Vibrate } from 'lucide-react';
import { useState } from 'react';
import {
  toggleSounds,
  toggleHaptics,
  areSoundsEnabled,
  areHapticsEnabled,
} from '@/utils/userFeedback';

export const FeedbackSettings = () => {
  const [sounds, setSounds] = useState(areSoundsEnabled());
  const [haptics, setHaptics] = useState(areHapticsEnabled());

  const handleSoundsToggle = (enabled: boolean) => {
    setSounds(enabled);
    toggleSounds(enabled);
  };

  const handleHapticsToggle = (enabled: boolean) => {
    setHaptics(enabled);
    toggleHaptics(enabled);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Préférences de notification</h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="sounds" className="cursor-pointer">
            Sons de notification
          </Label>
        </div>
        <Switch
          id="sounds"
          checked={sounds}
          onCheckedChange={handleSoundsToggle}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vibrate className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="haptics" className="cursor-pointer">
            Vibrations
          </Label>
        </div>
        <Switch
          id="haptics"
          checked={haptics}
          onCheckedChange={handleHapticsToggle}
        />
      </div>
    </Card>
  );
};
