import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';
import UserRoleManager from './UserRoleManager';

type User = {
  id: string;
  full_name: string;
  user_type: string;
  city: string | null;
  is_verified: boolean;
  cnib_verified: boolean;
  cnam_verified: boolean;
  created_at: string;
  user_roles?: { role: string }[];
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; roles: string[] } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: allRoles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      handleError(error, 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const labels: Record<string, string> = {
      'locataire': 'Locataire',
      'proprietaire': 'Propriétaire',
      'agence': 'Agence',
    };

    return <Badge variant="outline">{labels[userType] || userType}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      'admin': { label: 'Admin', variant: 'destructive' },
      'super_admin': { label: 'Super Admin', variant: 'default' },
      'tiers_de_confiance': { label: 'Tiers', variant: 'secondary' },
    };

    const config = roleConfig[role] || { label: role, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>CNIB</TableHead>
                <TableHead>CNAM</TableHead>
                <TableHead>Vérifié</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{getUserTypeBadge(user.user_type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles && user.user_roles.length > 0 ? (
                          user.user_roles.map((ur) => (
                            <span key={ur.role}>{getRoleBadge(ur.role)}</span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.city || '-'}</TableCell>
                    <TableCell>
                      {user.cnib_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.cnam_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge variant="default">Vérifié</Badge>
                      ) : (
                        <Badge variant="secondary">Non vérifié</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedUser({
                            id: user.id,
                            name: user.full_name,
                            roles: user.user_roles?.map(ur => ur.role) || [],
                          })
                        }
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Gérer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserRoleManager
          userId={selectedUser.id}
          userName={selectedUser.name}
          currentRoles={selectedUser.roles}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onRolesChanged={fetchUsers}
        />
      )}
    </>
  );
};

export default AdminUsers;
