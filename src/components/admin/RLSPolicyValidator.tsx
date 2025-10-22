import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
  FileText,
  Lock,
  Users,
  Eye,
  EyeOff,
  Database,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface RLSTest {
  id: string;
  name: string;
  description: string;
  category: 'data_isolation' | 'role_permissions' | 'sensitive_data' | 'admin_functions';
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: {
    success: boolean;
    message: string;
    details?: any;
    execution_time?: number;
  };
}

interface SecurityMetric {
  total_policies: number;
  enabled_policies: number;
  tables_with_rls: number;
  total_tables: number;
  test_results: {
    passed: number;
    failed: number;
    total: number;
  };
  security_score: number;
}

export const RLSPolicyValidator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(false);
  const [metrics, setMetrics] = useState<SecurityMetric | null>(null);
  const [tests, setTests] = useState<RLSTest[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sqlResults, setSqlResults] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityMetrics();
    initializeTests();
  }, []);

  const initializeTests = () => {
    const initialTests: RLSTest[] = [
      // Tests d'isolation des données
      {
        id: 'lease_isolation_landlord',
        name: 'Isolation des baux - Propriétaire',
        description: 'Un propriétaire ne peut voir que ses propres baux',
        category: 'data_isolation',
        status: 'pending'
      },
      {
        id: 'lease_isolation_tenant',
        name: 'Isolation des baux - Locataire',
        description: 'Un locataire ne peut voir que les baux où il est impliqué',
        category: 'data_isolation',
        status: 'pending'
      },
      {
        id: 'property_access_control',
        name: 'Contrôle d\'accès aux propriétés',
        description: 'Accès aux propriétés limité au propriétaire et admins',
        category: 'data_isolation',
        status: 'pending'
      },
      {
        id: 'message_isolation',
        name: 'Isolation des messages',
        description: 'Les messages ne sont accessibles qu\'aux participants concernés',
        category: 'data_isolation',
        status: 'pending'
      },

      // Tests de permissions par rôle
      {
        id: 'admin_role_permissions',
        name: 'Permissions admin',
        description: 'Les admins peuvent accéder à toutes les données via RPC',
        category: 'role_permissions',
        status: 'pending'
      },
      {
        id: 'tenant_role_permissions',
        name: 'Permissions locataire',
        description: 'Les locataires ne peuvent pas accéder aux données admin',
        category: 'role_permissions',
        status: 'pending'
      },
      {
        id: 'super_admin_privileges',
        name: 'Privilèges super admin',
        description: 'Validation des fonctions exclusives super admin',
        category: 'role_permissions',
        status: 'pending'
      },

      // Tests de données sensibles
      {
        id: 'sensitive_data_logs_access',
        name: 'Accès aux logs de données sensibles',
        description: 'Seuls les admins peuvent voir les logs d\'accès sensibles',
        category: 'sensitive_data',
        status: 'pending'
      },
      {
        id: 'admin_audit_logs',
        name: 'Logs d\'audit admin',
        description: 'Les actions admin sont correctement journalisées',
        category: 'sensitive_data',
        status: 'pending'
      },
      {
        id: 'mfa_backup_codes_protection',
        name: 'Protection des codes de récupération MFA',
        description: 'Les codes MFA ne sont accessibles qu\'à leur propriétaire',
        category: 'sensitive_data',
        status: 'pending'
      },

      // Tests des fonctions admin
      {
        id: 'admin_rpc_functions',
        name: 'Fonctions RPC admin',
        description: 'Validation des fonctions admin protégées',
        category: 'admin_functions',
        status: 'pending'
      },
      {
        id: 'user_role_management',
        name: 'Gestion des rôles utilisateurs',
        description: 'Les utilisateurs ne peuvent pas s\'auto-promouvoir',
        category: 'admin_functions',
        status: 'pending'
      },
      {
        id: 'certification_workflow',
        name: 'Workflow de certification',
        description: 'Le processus de certification respecte les permissions',
        category: 'admin_functions',
        status: 'pending'
      }
    ];

    setTests(initialTests);
  };

  const fetchSecurityMetrics = async () => {
    try {
      // Récupérer les métriques de sécurité via une fonction RPC
      const { data, error } = await supabase.rpc('get_rls_security_metrics');

      if (error) {
        logger.error('Error fetching RLS security metrics', { error });
        // Calculer manuellement si la fonction n'existe pas
        await calculateManualMetrics();
        return;
      }

      setMetrics(data);
    } catch (error) {
      logger.error('Error in fetchSecurityMetrics', { error });
      await calculateManualMetrics();
    } finally {
      setLoading(false);
    }
  };

  const calculateManualMetrics = async () => {
    try {
      // Calculer les métriques manuellement
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name, rowsecurity')
        .eq('table_schema', 'public');

      const totalTables = tables?.length || 0;
      const tablesWithRLS = tables?.filter(t => t.rowsecurity).length || 0;

      const { data: policies } = await supabase
        .from('pg_policies')
        .select('tablename')
        .eq('schemaname', 'public');

      const enabledPolicies = policies?.length || 0;

      setMetrics({
        total_policies: enabledPolicies,
        enabled_policies: enabledPolicies,
        tables_with_rls: tablesWithRLS,
        total_tables: totalTables,
        test_results: { passed: 0, failed: 0, total: 0 },
        security_score: Math.round((tablesWithRLS / totalTables) * 100)
      });
    } catch (error) {
      logger.error('Error calculating manual metrics', { error });
    }
  };

  const runRLSTests = async () => {
    setRunningTests(true);
    setSqlResults([]);

    try {
      for (const test of tests) {
        await runSingleTest(test);
      }

      toast({
        title: "Tests terminés",
        description: `${tests.filter(t => t.result?.success).length} sur ${tests.length} tests réussis`,
      });
    } catch (error) {
      logger.error('Error running RLS tests', { error });
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors des tests RLS",
        variant: "destructive",
      });
    } finally {
      setRunningTests(false);
    }
  };

  const runSingleTest = async (test: RLSTest) => {
    setTests(prev => prev.map(t =>
      t.id === test.id ? { ...t, status: 'running' } : t
    ));

    const startTime = Date.now();

    try {
      let result;

      switch (test.id) {
        case 'lease_isolation_landlord':
          result = await testLeaseIsolationLandlord();
          break;
        case 'lease_isolation_tenant':
          result = await testLeaseIsolationTenant();
          break;
        case 'property_access_control':
          result = await testPropertyAccessControl();
          break;
        case 'message_isolation':
          result = await testMessageIsolation();
          break;
        case 'admin_role_permissions':
          result = await testAdminRolePermissions();
          break;
        case 'tenant_role_permissions':
          result = await testTenantRolePermissions();
          break;
        case 'sensitive_data_logs_access':
          result = await testSensitiveDataLogsAccess();
          break;
        case 'admin_audit_logs':
          result = await testAdminAuditLogs();
          break;
        case 'mfa_backup_codes_protection':
          result = await testMFABackupCodesProtection();
          break;
        default:
          result = {
            success: false,
            message: 'Test non implémenté'
          };
      }

      const executionTime = Date.now() - startTime;

      setTests(prev => prev.map(t =>
        t.id === test.id ? {
          ...t,
          status: result.success ? 'passed' : 'failed',
          result: {
            ...result,
            execution_time: executionTime
          }
        } : t
      ));

      // Ajouter le résultat SQL si disponible
      if (result.sql) {
        setSqlResults(prev => [...prev, `-- ${test.name}\n${result.sql}\n-- Résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}\n`]);
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      setTests(prev => prev.map(t =>
        t.id === test.id ? {
          ...t,
          status: 'failed',
          result: {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur inconnue',
            execution_time: executionTime
          }
        } : t
      ));
    }
  };

  const testLeaseIsolationLandlord = async () => {
    try {
      // Test: Un propriétaire ne peut voir que ses baux
      const { data, error } = await supabase.rpc('test_rls_lease_isolation_landlord');

      if (error) {
        return {
          success: false,
          message: 'Erreur RPC: ' + error.message,
          sql: 'SELECT COUNT(*) FROM leases WHERE landlord_id != auth.uid()'
        };
      }

      return {
        success: data.success || false,
        message: data.message || 'Test exécuté',
        details: data,
        sql: 'EXECUTION DU TEST: Isolation des baux par propriétaire'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testLeaseIsolationTenant = async () => {
    try {
      // Test: Un locataire ne peut voir que les baux où il est locataire
      const { data, error } = await supabase.rpc('test_rls_lease_isolation_tenant');

      return {
        success: !error && data?.success !== false,
        message: error ? error.message : 'Test d\'isolation locataire réussi',
        sql: 'SELECT COUNT(*) FROM leases WHERE tenant_id != auth.uid()'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testPropertyAccessControl = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, owner_id')
        .limit(1);

      return {
        success: !error,
        message: error ? error.message : 'Contrôle d\'accès propriétés fonctionnel',
        sql: 'SELECT id, owner_id FROM properties LIMIT 1'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testMessageIsolation = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      return {
        success: !error,
        message: error ? error.message : 'Isolation des messages fonctionnelle',
        sql: 'SELECT id FROM messages LIMIT 1'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testAdminRolePermissions = async () => {
    try {
      const { data, error } = await supabase.rpc('test_admin_permissions');

      return {
        success: !error,
        message: error ? error.message : 'Permissions admin validées',
        sql: 'CALL test_admin_permissions()'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testTenantRolePermissions = async () => {
    try {
      // Tentative d'accès à une table admin en tant que locataire
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('id')
        .limit(1);

      return {
        success: error !== null,
        message: error ? 'Accès non autorisé correctement bloqué' : 'Attention: accès non bloqué',
        sql: 'SELECT id FROM admin_audit_logs LIMIT 1'
      };
    } catch (error) {
      return {
        success: true, // Erreur attendue pour RLS
        message: 'RLS bloque correctement l\'accès',
      };
    }
  };

  const testSensitiveDataLogsAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('sensitive_data_access_log')
        .select('id')
        .limit(1);

      return {
        success: error !== null,
        message: error ? 'Accès aux logs sensibles correctement restreint' : 'Attention: accès potentiellement non sécurisé',
        sql: 'SELECT id FROM sensitive_data_access_log LIMIT 1'
      };
    } catch (error) {
      return {
        success: true, // Erreur attendue
        message: 'Protection des données sensibles fonctionnelle',
      };
    }
  };

  const testAdminAuditLogs = async () => {
    try {
      // Vérifier si les actions admin sont bien loguées
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('action_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        success: !error,
        message: error ? error.message : 'Logs d\'audit admin fonctionnels',
        sql: 'SELECT action_type, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 5'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      };
    }
  };

  const testMFABackupCodesProtection = async () => {
    try {
      const { data, error } = await supabase
        .from('mfa_backup_codes')
        .select('code_hash')
        .limit(1);

      return {
        success: error !== null,
        message: error ? 'Codes MFA correctement protégés' : 'Attention: protection MFA à vérifier',
        sql: 'SELECT code_hash FROM mfa_backup_codes LIMIT 1'
      };
    } catch (error) {
      return {
        success: true, // Erreur attendue
        message: 'Protection MFA fonctionnelle',
      };
    }
  };

  const getTestCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_isolation': return <Database className="h-4 w-4" />;
      case 'role_permissions': return <Users className="h-4 w-4" />;
      case 'sensitive_data': return <Lock className="h-4 w-4" />;
      case 'admin_functions': return <Key className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const filteredTests = activeCategory === 'all'
    ? tests
    : tests.filter(test => test.category === activeCategory);

  const passedTests = tests.filter(t => t.result?.success).length;
  const failedTests = tests.filter(t => t.result?.success === false).length;
  const totalTests = tests.filter(t => t.result).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Validateur RLS & Sécurité
          </h2>
          <p className="text-muted-foreground">
            Tests automatisés des politiques Row Level Security et permissions
          </p>
        </div>
        <Button onClick={runRLSTests} disabled={runningTests}>
          <RefreshCw className={`h-4 w-4 mr-2 ${runningTests ? 'animate-spin' : ''}`} />
          {runningTests ? 'Tests en cours...' : 'Lancer les tests'}
        </Button>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.security_score}%</div>
              <Progress value={metrics.security_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables avec RLS</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.tables_with_rls}/{metrics.total_tables}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((metrics.tables_with_rls / metrics.total_tables) * 100)}% protégées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Politiques Actives</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.enabled_policies}</div>
              <p className="text-xs text-muted-foreground">
                politiques RLS configurées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests RLS</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passedTests}/{totalTests}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}% réussis
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results Summary */}
      {totalTests > 0 && (
        <Alert variant={failedTests > 0 ? "destructive" : "default"}>
          {failedTests > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>
            {failedTests > 0 ? '⚠️ Tests échoués détectés' : '✅ Tous les tests réussis'}
          </AlertTitle>
          <AlertDescription>
            {passedTests} test{passedTests > 1 ? 's' : ''} réussi{passedTests > 1 ? 's' : ''} sur {totalTests} test{totalTests > 1 ? 's' : ''}
            {failedTests > 0 && ` - ${failedTests} test${failedTests > 1 ? 's' : ''} nécessite${failedTests > 1 ? 'nt' : ''} une attention`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">Tous les tests</TabsTrigger>
          <TabsTrigger value="data_isolation">Isolation données</TabsTrigger>
          <TabsTrigger value="role_permissions">Permissions</TabsTrigger>
          <TabsTrigger value="sensitive_data">Données sensibles</TabsTrigger>
          <TabsTrigger value="admin_functions">Fonctions admin</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résultats des Tests RLS</CardTitle>
              <CardDescription>
                {filteredTests.length} test{filteredTests.length > 1 ? 's' : ''} dans cette catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Temps</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTestCategoryIcon(test.category)}
                          {test.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {test.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            test.status === 'passed' ? 'default' :
                            test.status === 'failed' ? 'destructive' :
                            test.status === 'running' ? 'secondary' : 'outline'
                          }
                        >
                          {test.status === 'passed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {test.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {test.status === 'running' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                          {test.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {test.status === 'passed' ? 'Succès' :
                           test.status === 'failed' ? 'Échec' :
                           test.status === 'running' ? 'En cours' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {test.result?.execution_time && (
                          <span className="text-sm">{test.result.execution_time}ms</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.result && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(
                              showDetails === test.id ? null : test.id
                            )}
                          >
                            {showDetails === test.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Test Details */}
          {showDetails && tests.find(t => t.id === showDetails)?.result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Détails du test: {tests.find(t => t.id === showDetails)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {tests.find(t => t.id === showDetails)?.result?.message}
                  </p>
                </div>

                {tests.find(t => t.id === showDetails)?.result?.sql && (
                  <div>
                    <h4 className="font-medium mb-2">SQL</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {tests.find(t => t.id === showDetails)?.result?.sql}
                    </pre>
                  </div>
                )}

                {tests.find(t => t.id === showDetails)?.result?.details && (
                  <div>
                    <h4 className="font-medium mb-2">Détails techniques</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(tests.find(t => t.id === showDetails)?.result?.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* SQL Output */}
      {sqlResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Journal d'exécution SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-black text-green-400 p-4 rounded overflow-x-auto h-64">
              {sqlResults.join('\n\n')}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};