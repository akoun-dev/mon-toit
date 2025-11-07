import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { handleError } from '@/lib/errorHandler';

interface UserRoleManagerProps {
  userId: string;
  userName: string;
  currentRoles: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRolesChanged: () => void;
}

type AppRole = 'admin' | 'super_admin' | 'tiers_de_confiance';

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string; icon: typeof Shield; color: string }[] = [
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Accès aux fonctions d\'administration',
    icon: Shield,
    color: 'hsl(var(--destructive))',
  },
  {
    value: 'super_admin',
    label: 'Super Administrateur',
    description: 'Accès complet au système',
    icon: ShieldCheck,
    color: 'hsl(var(--chart-1))',
  },
  {
    value: 'tiers_de_confiance',
    label: 'Tiers de Confiance',
    description: 'Vérification des identités',
    icon: UserCheck,
    color: 'hsl(var(--chart-2))',
  },
];

const UserRoleManager = ({ userId, userName, currentRoles, open, onOpenChange, onRolesChanged }: UserRoleManagerProps) => {
  const [roles, setRoles] = useState<string[]>(currentRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoles(currentRoles);
  }, [currentRoles]);

  const hasRole = (role: AppRole) => roles.includes(role);

  const addRole = async (role: AppRole) => {
    try {
      setLoading(true);
      setError(null);

      const { error: rpcError } = await supabase.rpc('add_role', {
        target_user_id: userId,
        new_role: role,
      });

      if (rpcError) throw rpcError;

      setRoles([...roles, role]);
      toast({
        title: 'Rôle ajouté',
        description: `Le rôle ${role} a été ajouté avec succès`,
      });
      onRolesChanged();
    } catch (err) {
      handleError(err, 'Impossible d\'ajouter le rôle');
      setError('Impossible d\'ajouter le rôle. Vérifiez vos permissions.');
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (role: AppRole) => {
    try {
      setLoading(true);
      setError(null);

      const { error: rpcError } = await supabase.rpc('remove_role', {
        target_user_id: userId,
        old_role: role,
      });

      if (rpcError) throw rpcError;

      setRoles(roles.filter(r => r !== role));
      toast({
        title: 'Rôle retiré',
        description: `Le rôle ${role} a été retiré avec succès`,
      });
      onRolesChanged();
    } catch (err) {
      handleError(err, 'Impossible de retirer le rôle');
      setError('Impossible de retirer le rôle. Vérifiez vos permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion des rôles</DialogTitle>
          <DialogDescription>
            Gérer les rôles de <span className="font-semibold">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {AVAILABLE_ROLES.map(({ value, label, description, icon: Icon, color }) => {
            const active = hasRole(value);
            
            return (
              <div
                key={value}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{label}</h4>
                      {active && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                </div>
                
                <div>
                  {active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRole(value)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Retirer'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addRole(value)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Ajouter'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles actuels
          </h4>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">Aucun rôle administratif</span>
            ) : (
              roles.map(role => (
                <Badge key={role} variant="secondary">
                  {AVAILABLE_ROLES.find(r => r.value === role)?.label || role}
                </Badge>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleManager;