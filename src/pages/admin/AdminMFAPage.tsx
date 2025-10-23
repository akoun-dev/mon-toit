import { Shield, Users, Smartphone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminMFAPage = () => {
  // Données simulées pour l'exemple
  const mfaStats = {
    totalUsers: 1247,
    usersWithMFA: 892,
    usersWithoutMFA: 355,
    recentAttempts: 23,
    failedAttempts: 3
  };

  const mfaAdoptionRate = Math.round((mfaStats.usersWithMFA / mfaStats.totalUsers) * 100);

  const recentMFAActivity = [
    { id: 1, user: 'admin@ansut.ci', action: '2FA Activée', time: 'Il y a 2 min', status: 'success' },
    { id: 2, user: 'user@example.com', action: 'Tentative 2FA échouée', time: 'Il y a 15 min', status: 'error' },
    { id: 3, user: 'proprietaire@mon-toit.ci', action: '2FA Désactivée', time: 'Il y a 1h', status: 'warning' },
    { id: 4, user: 'agence@mon-toit.ci', action: '2FA Activée', time: 'Il y a 2h', status: 'success' },
    { id: 5, user: 'locataire@mon-toit.ci', action: 'Backup codes régénérés', time: 'Il y a 3h', status: 'info' },
  ];

  const usersRequiringMFA = [
    { id: 1, email: 'admin@mon-toit.ci', role: 'Admin', lastLogin: 'Il y a 2 jours', riskLevel: 'high' },
    { id: 2, email: 'manager@agence.ci', role: 'Agency Manager', lastLogin: 'Il y a 1 jour', riskLevel: 'medium' },
    { id: 3, email: 'owner@prop.ci', role: 'Property Owner', lastLogin: 'Il y a 5 jours', riskLevel: 'low' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRiskBadge = (level: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      high: 'Risque élevé',
      medium: 'Risque moyen',
      low: 'Risque faible'
    };

    return (
      <Badge variant={variants[level as keyof typeof variants]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold">Sécurité 2FA</h1>
              <p className="text-muted-foreground">Gestion de l'authentification à deux facteurs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Exporter les logs</Button>
            <Button>Forcer 2FA Admin</Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'adoption 2FA</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mfaAdoptionRate}%</div>
              <Progress value={mfaAdoptionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {mfaStats.usersWithMFA} sur {mfaStats.totalUsers} utilisateurs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs sans 2FA</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{mfaStats.usersWithoutMFA}</div>
              <p className="text-xs text-muted-foreground">
                Requiert une attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tentatives récentes</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mfaStats.recentAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Dernières 24 heures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Échecs 2FA</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{mfaStats.failedAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Nécessite investigation
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activité récente</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs à risque</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activité 2FA récente</CardTitle>
                <CardDescription>
                  Dernières activités d'authentification à deux facteurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMFAActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs requérant 2FA</CardTitle>
                <CardDescription>
                  Utilisateurs à privilèges élevés n'ayant pas activé la 2FA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usersRequiringMFA.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getRiskBadge(user.riskLevel)}
                        <Button size="sm">Forcer 2FA</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Politiques 2FA</CardTitle>
                  <CardDescription>
                    Configuration des politiques d'authentification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">2FA obligatoire pour les admins</p>
                      <p className="text-sm text-muted-foreground">
                        Tous les administrateurs doivent avoir 2FA activé
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Activer</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">2FA recommandée pour les agences</p>
                      <p className="text-sm text-muted-foreground">
                        Suggérer 2FA pour les comptes agence
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configurer</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Méthodes 2FA autorisées</CardTitle>
                  <CardDescription>
                    Gérer les méthodes d'authentification acceptées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Application authentificateur</p>
                      <p className="text-sm text-muted-foreground">Google Authenticator, Authy</p>
                    </div>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS</p>
                      <p className="text-sm text-muted-foreground">Codes par SMS</p>
                    </div>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">Codes par email</p>
                    </div>
                    <Badge variant="secondary">Désactivé</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminMFAPage;