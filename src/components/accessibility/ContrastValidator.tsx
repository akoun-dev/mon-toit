import { useState, useEffect } from 'react';
import { Check, X, Eye, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ContrastRatio {
  ratio: number;
  level: 'AAA' | 'AA' | 'FAIL';
  normalText: boolean;
  largeText: boolean;
}

interface ContrastValidatorProps {
  enabled?: boolean;
  showInProduction?: boolean;
}

const ContrastValidator: React.FC<ContrastValidatorProps> = ({
  enabled = import.meta.env.DEV,
  showInProduction = false
}) => {
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [contrastRatio, setContrastRatio] = useState<ContrastRatio | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate luminance of a color
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  };

  // Calculate contrast ratio
  const calculateContrastRatio = (foreground: string, background: string): ContrastRatio => {
    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);

    // WCAG AA requires at least 4.5:1 for normal text and 3:1 for large text
    // WCAG AAA requires at least 7:1 for normal text and 4.5:1 for large text
    const normalTextAA = ratio >= 4.5;
    const largeTextAA = ratio >= 3;
    const normalTextAAA = ratio >= 7;
    const largeTextAAA = ratio >= 4.5;

    let level: 'AAA' | 'AA' | 'FAIL';
    if (normalTextAAA && largeTextAAA) {
      level = 'AAA';
    } else if (normalTextAA && largeTextAA) {
      level = 'AA';
    } else {
      level = 'FAIL';
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      level,
      normalText: normalTextAA,
      largeText: largeTextAA
    };
  };

  // Validate current colors
  useEffect(() => {
    const ratio = calculateContrastRatio(foregroundColor, backgroundColor);
    setContrastRatio(ratio);
  }, [foregroundColor, backgroundColor]);

  // Check if we should show the validator
  const shouldShow = enabled || (showInProduction && isVisible);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Validation Contrast
            </CardTitle>
            {!enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            Vérification du ratio de contrast WCAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Arrière-plan</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Texte</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor,
              color: foregroundColor
            }}
          >
            <p className="text-sm">Texte normal</p>
            <p className="text-lg font-bold">Texte large</p>
          </div>

          {/* Results */}
          {contrastRatio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ratio:</span>
                <Badge
                  variant={contrastRatio.level === 'FAIL' ? 'destructive' : 'default'}
                  className={contrastRatio.level === 'AAA' ? 'bg-green-100 text-green-800' : ''}
                >
                  {contrastRatio.ratio}:1 ({contrastRatio.level})
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {contrastRatio.normalText ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">Texte normal (WCAG AA)</span>
                </div>
                <div className="flex items-center gap-2">
                  {contrastRatio.largeText ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">Texte large (WCAG AA)</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>WCAG AA: 4.5:1 (normal), 3:1 (large)</p>
                <p>WCAG AAA: 7:1 (normal), 4.5:1 (large)</p>
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Presets rapides:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBackgroundColor('#FFFFFF');
                  setForegroundColor('#000000');
                }}
              >
                Noir sur Blanc
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBackgroundColor('#000000');
                  setForegroundColor('#FFFFFF');
                }}
              >
                Blanc sur Noir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBackgroundColor('#FFFFFF');
                  setForegroundColor('#1e40af');
                }}
              >
                Bleu sur Blanc
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBackgroundColor('#f8fafc');
                  setForegroundColor('#475569');
                }}
              >
                Gris sur Gris clair
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContrastValidator;