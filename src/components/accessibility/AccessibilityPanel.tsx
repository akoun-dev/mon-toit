import { useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Eye,
  EyeOff,
  Type,
  Zap,
  Keyboard,
  Monitor,
  Volume2,
  Settings
} from 'lucide-react';

interface AccessibilityPanelProps {
  trigger?: React.ReactNode;
  showInProduction?: boolean;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  trigger,
  showInProduction = false
}) => {
  const { settings, updateSetting, announce } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const shouldShow = showInProduction || import.meta.env.DEV;

  if (!shouldShow) {
    return null;
  }

  const toggleSetting = (key: keyof typeof settings, value: any) => {
    updateSetting(key, value);
    announce(`${key} ${value ? 'activé' : 'désactivé'}`);
  };

  const fontSizes = [
    { key: 'small', label: 'Petit', class: 'text-sm' },
    { key: 'medium', label: 'Moyen', class: 'text-base' },
    { key: 'large', label: 'Grand', class: 'text-lg' },
    { key: 'extra-large', label: 'Très grand', class: 'text-xl' }
  ] as const;

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-40 rounded-full w-12 h-12 p-0"
      aria-label="Options d'accessibilité"
    >
      <Settings className="h-5 w-5" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibilité
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'affichage selon vos besoins
          </DialogDescription>
        </DialogHeader>

        <CardContent className="space-y-4">
          {/* Keyboard Navigation Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <span className="text-sm font-medium">Navigation clavier</span>
            </div>
            <Badge variant={settings.keyboardNavigation ? 'default' : 'secondary'}>
              {settings.keyboardNavigation ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="text-sm font-medium">Taille du texte</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fontSizes.map((size) => (
                <Button
                  key={size.key}
                  variant={settings.fontSize === size.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('fontSize', size.key)}
                  className={size.class}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Contraste élevé</span>
            </div>
            <Button
              variant={settings.highContrast ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSetting('highContrast', !settings.highContrast)}
            >
              {settings.highContrast ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Activer
                </>
              )}
            </Button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Réduire les animations</span>
            </div>
            <Button
              variant={settings.reducedMotion ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSetting('reducedMotion', !settings.reducedMotion)}
            >
              {settings.reducedMotion ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Activé
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Désactivé
                </>
              )}
            </Button>
          </div>

          {/* Screen Reader Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm font-medium">Lecteur d'écran</span>
            </div>
            <Badge variant={settings.screenReader ? 'default' : 'secondary'}>
              {settings.screenReader ? 'Détecté' : 'Non détecté'}
            </Badge>
          </div>

          {/* System Preferences */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">Préférences système détectées</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Mouvement réduit:</span>
                <span>{settings.reducedMotion ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex justify-between">
                <span>Contraste élevé:</span>
                <span>{settings.highContrast ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex justify-between">
                <span>Navigation clavier:</span>
                <span>{settings.keyboardNavigation ? 'Oui' : 'Non'}</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              updateSetting('fontSize', 'medium');
              updateSetting('highContrast', false);
              updateSetting('reducedMotion', false);
              announce('Paramètres d\'accessibilité réinitialisés');
            }}
          >
            Réinitialiser les paramètres
          </Button>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center">
            Utilisez la touche Tab pour naviguer et Entrée pour valider
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilityPanel;