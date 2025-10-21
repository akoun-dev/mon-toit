/**
 * SERVICE DE TESTS RLS AUTOMATISÉS
 * Gère l'exécution et le reporting des tests de sécurité Row Level Security
 */

interface RLS TestResult {
  id: string;
  testName: string;
  testType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  userRole: 'tenant' | 'owner' | 'agency' | 'trust' | 'admin';
  expectedResult: string;
  actualResult: string;
  testStatus: 'PASS' | 'FAIL' | 'ERROR';
  testDetails?: string;
  testTimestamp: string;
  executionTimeMs: number;
}

interface RLS TestSuite {
  id: string;
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  successRate: number;
  executionTimeMs: number;
  createdAt: string;
}

interface TestConfiguration {
  enableAutomaticTests: boolean;
  testScheduleHours: number;
  notificationThreshold: number;
  testTimeoutMs: number;
  retryAttempts: number;
}

class RLS TestingService {
  private baseUrl: string;
  private config: TestConfiguration;
  private testResults: RLS TestResult[] = [];
  private isTestRunning = false;

  constructor(baseUrl: string = '/api', config: Partial<TestConfiguration> = {}) {
    this.baseUrl = baseUrl;
    this.config = {
      enableAutomaticTests: true,
      testScheduleHours: 24,
      notificationThreshold: 90,
      testTimeoutMs: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Exécute la suite complète de tests RLS
   */
  async runFullTestSuite(): Promise<RLS TestSuite> {
    if (this.isTestRunning) {
      throw new Error('Tests already running');
    }

    this.isTestRunning = true;
    const startTime = Date.now();

    try {
      // 1. Initialisation des données de test
      await this.initializeTestData();

      // 2. Exécution des tests par table
      const testResults = await Promise.all([
        this.runTestsForTable('properties'),
        this.runTestsForTable('applications'),
        this.runTestsForTable('messages'),
        this.runTestsForTable('favorites'),
        this.runTestsForTable('reviews'),
        this.runTestsForTable('visits'),
        this.runTestsForTable('payments'),
        this.runTestsForTable('leases')
      ]);

      // 3. Agrégation des résultats
      const allResults = testResults.flat();
      this.testResults = allResults;

      // 4. Calcul des statistiques
      const suite: RLS TestSuite = this.calculateTestStatistics(
        `RLS_TEST_SUITE_${new Date().toISOString()}`,
        allResults,
        Date.now() - startTime
      );

      // 5. Sauvegarde des résultats
      await this.saveTestResults(allResults, suite);

      // 6. Notifications si nécessaire
      if (suite.successRate < this.config.notificationThreshold) {
        await this.sendTestFailureNotification(suite);
      }

      return suite;

    } catch (error) {
      console.error('RLS test suite execution failed:', error);
      throw error;
    } finally {
      this.isTestRunning = false;
    }
  }

  /**
   * Exécute les tests pour une table spécifique
   */
  private async runTestsForTable(tableName: string): Promise<RLS TestResult[]> {
    const results: RLS TestResult[] = [];

    try {
      // Test pour chaque rôle
      const roles = ['tenant', 'owner', 'agency', 'trust', 'admin'] as const;

      for (const role of roles) {
        const roleTests = await this.runTestsForTableAndRole(tableName, role);
        results.push(...roleTests);
      }

    } catch (error) {
      console.error(`Failed to run tests for table ${tableName}:`, error);

      // Ajouter un résultat d'erreur pour la table
      results.push({
        id: `${tableName}_error_${Date.now()}`,
        testName: `TABLE_${tableName.toUpperCase()}_ERROR`,
        testType: 'SELECT',
        tableName,
        userRole: 'admin',
        expectedResult: 'ALL_TESTS_PASS',
        actualResult: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testStatus: 'ERROR',
        testDetails: `Failed to execute tests for table ${tableName}`,
        testTimestamp: new Date().toISOString(),
        executionTimeMs: 0
      });
    }

    return results;
  }

  /**
   * Exécute les tests pour une table et un rôle spécifiques
   */
  private async runTestsForTableAndRole(
    tableName: string,
    userRole: 'tenant' | 'owner' | 'agency' | 'trust' | 'admin'
  ): Promise<RLS TestResult[]> {
    const results: RLS TestResult[] = [];

    // Définir les tests basés sur la table et le rôle
    const tests = this.getTestsForTableAndRole(tableName, userRole);

    for (const test of tests) {
      const result = await this.executeSingleTest(test);
      results.push(result);
    }

    return results;
  }

  /**
   * Définit les tests à exécuter pour chaque table/rôle
   */
  private getTestsForTableAndRole(tableName: string, userRole: string): Array<{
    name: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    query: string;
    expectedCount?: number;
    expectedError?: string;
  }> {
    const tests: Array<{
      name: string;
      type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
      query: string;
      expectedCount?: number;
      expectedError?: string;
    }> = [];

    switch (tableName) {
      case 'properties':
        switch (userRole) {
          case 'tenant':
            tests.push(
              {
                name: 'TENANT_VIEW_PUBLISHED_ONLY',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM properties WHERE status = \'published\'',
                expectedCount: 2
              },
              {
                name: 'TENANT_NO_UPDATE_PROPERTIES',
                type: 'UPDATE',
                query: 'UPDATE properties SET title = \'HACKED\' LIMIT 1',
                expectedError: 'insufficient_privilege'
              }
            );
            break;
          case 'owner':
            tests.push(
              {
                name: 'OWNER_VIEW_OWN_PROPERTIES',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM properties WHERE owner_id = current_user_id()',
                expectedCount: 2
              },
              {
                name: 'OWNER_UPDATE_OWN_PROPERTIES',
                type: 'UPDATE',
                query: 'UPDATE properties SET title = \'Updated by owner\' WHERE owner_id = current_user_id() LIMIT 1',
                expectedCount: 1
              }
            );
            break;
          case 'admin':
            tests.push(
              {
                name: 'ADMIN_VIEW_ALL_PROPERTIES',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM properties',
                expectedCount: 3
              }
            );
            break;
        }
        break;

      case 'applications':
        switch (userRole) {
          case 'tenant':
            tests.push(
              {
                name: 'TENANT_VIEW_OWN_APPLICATIONS',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM applications WHERE tenant_id = current_user_id()',
                expectedCount: 1
              },
              {
                name: 'TENANT_NO_UPDATE_APPLICATIONS',
                type: 'UPDATE',
                query: 'UPDATE applications SET status = \'accepted\' WHERE tenant_id = current_user_id() LIMIT 1',
                expectedError: 'insufficient_privilege'
              }
            );
            break;
          case 'owner':
            tests.push(
              {
                name: 'OWNER_VIEW_PROPERTY_APPLICATIONS',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM applications WHERE property_id IN (SELECT id FROM properties WHERE owner_id = current_user_id())',
                expectedCount: 2
              },
              {
                name: 'OWNER_UPDATE_APPLICATION_STATUS',
                type: 'UPDATE',
                query: 'UPDATE applications SET status = \'reviewed\' WHERE property_id IN (SELECT id FROM properties WHERE owner_id = current_user_id()) LIMIT 1',
                expectedCount: 1
              }
            );
            break;
        }
        break;

      case 'messages':
        switch (userRole) {
          case 'tenant':
            tests.push(
              {
                name: 'TENANT_VIEW_OWN_MESSAGES',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM messages WHERE sender_id = current_user_id() OR receiver_id = current_user_id()',
                expectedCount: 2
              },
              {
                name: 'TENANT_SEND_MESSAGE',
                type: 'INSERT',
                query: 'INSERT INTO messages (sender_id, receiver_id, property_id, content) VALUES (current_user_id(), (SELECT id FROM profiles WHERE role = \'owner\' LIMIT 1), (SELECT id FROM properties LIMIT 1), \'Test message\')',
                expectedCount: 1
              }
            );
            break;
          case 'owner':
            tests.push(
              {
                name: 'OWNER_VIEW_PROPERTY_MESSAGES',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM messages WHERE property_id IN (SELECT id FROM properties WHERE owner_id = current_user_id())',
                expectedCount: 3
              }
            );
            break;
        }
        break;

      case 'favorites':
        switch (userRole) {
          case 'tenant':
            tests.push(
              {
                name: 'TENANT_VIEW_OWN_FAVORITES',
                type: 'SELECT',
                query: 'SELECT COUNT(*) FROM favorites WHERE user_id = current_user_id()',
                expectedCount: 1
              },
              {
                name: 'TENANT_MANAGE_FAVORITES',
                type: 'INSERT',
                query: 'INSERT INTO favorites (user_id, property_id) VALUES (current_user_id(), (SELECT id FROM properties LIMIT 1)) ON CONFLICT DO NOTHING',
                expectedCount: 1
              }
            );
            break;
        }
        break;
    }

    return tests;
  }

  /**
   * Exécute un test individuel
   */
  private async executeSingleTest(test: {
    name: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    query: string;
    expectedCount?: number;
    expectedError?: string;
  }): Promise<RLS TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/test/rls/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          query: test.query,
          role: this.extractRoleFromTestName(test.name)
        })
      });

      const executionTime = Date.now() - startTime;
      const data = await response.json();

      if (test.expectedError) {
        // Test expecting an error
        const hasExpectedError = data.error?.includes(test.expectedError) ||
                                data.message?.includes(test.expectedError);

        return {
          id: `${test.name}_${Date.now()}`,
          testName: test.name,
          testType: test.type,
          tableName: this.extractTableFromTestName(test.name),
          userRole: this.extractRoleFromTestName(test.name),
          expectedResult: `ERROR: ${test.expectedError}`,
          actualResult: data.error || data.message || 'NO_ERROR',
          testStatus: hasExpectedError ? 'PASS' : 'FAIL',
          testDetails: `Expected error: ${test.expectedError}`,
          testTimestamp: new Date().toISOString(),
          executionTimeMs: executionTime
        };
      } else {
        // Test expecting a specific count
        const actualCount = data.count || data.rowCount || 0;
        const hasExpectedCount = actualCount === test.expectedCount;

        return {
          id: `${test.name}_${Date.now()}`,
          testName: test.name,
          testType: test.type,
          tableName: this.extractTableFromTestName(test.name),
          userRole: this.extractRoleFromTestName(test.name),
          expectedResult: `COUNT=${test.expectedCount}`,
          actualResult: `COUNT=${actualCount}`,
          testStatus: hasExpectedCount ? 'PASS' : 'FAIL',
          testDetails: `Expected: ${test.expectedCount}, Got: ${actualCount}`,
          testTimestamp: new Date().toISOString(),
          executionTimeMs: executionTime
        };
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        id: `${test.name}_${Date.now()}`,
        testName: test.name,
        testType: test.type,
        tableName: this.extractTableFromTestName(test.name),
        userRole: this.extractRoleFromTestName(test.name),
        expectedResult: `SUCCESS`,
        actualResult: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testStatus: 'ERROR',
        testDetails: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testTimestamp: new Date().toISOString(),
        executionTimeMs: executionTime
      };
    }
  }

  /**
   * Initialise les données de test
   */
  private async initializeTestData(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/test/rls/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
    } catch (error) {
      console.error('Failed to initialize test data:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques des tests
   */
  private calculateTestStatistics(
    suiteName: string,
    results: RLS TestResult[],
    executionTimeMs: number
  ): RLS TestSuite {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.testStatus === 'PASS').length;
    const failedTests = results.filter(r => r.testStatus === 'FAIL').length;
    const errorTests = results.filter(r => r.testStatus === 'ERROR').length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      id: `suite_${Date.now()}`,
      suiteName,
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      successRate,
      executionTimeMs,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Sauvegarde les résultats des tests
   */
  private async saveTestResults(results: RLS TestResult[], suite: RLS TestSuite): Promise<void> {
    try {
      await Promise.all([
        fetch(`${this.baseUrl}/test/rls/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({ results })
        }),
        fetch(`${this.baseUrl}/test/rls/suite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({ suite })
        })
      ]);
    } catch (error) {
      console.error('Failed to save test results:', error);
      // Ne pas bloquer l'exécution si la sauvegarde échoue
    }
  }

  /**
   * Envoie une notification en cas d'échec des tests
   */
  private async sendTestFailureNotification(suite: RLS TestSuite): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/notifications/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          type: 'RLS_TESTS_FAILURE',
          title: '⚠️ Tests RLS en échec',
          message: `Le taux de succès des tests RLS est de ${suite.successRate}% (seuil: ${this.config.notificationThreshold}%)`,
          details: {
            suiteName: suite.suiteName,
            totalTests: suite.totalTests,
            passedTests: suite.passedTests,
            failedTests: suite.failedTests,
            errorTests: suite.errorTests
          },
          priority: 'high'
        })
      });
    } catch (error) {
      console.error('Failed to send test failure notification:', error);
    }
  }

  /**
   * Extrait le rôle à partir du nom du test
   */
  private extractRoleFromTestName(testName: string): 'tenant' | 'owner' | 'agency' | 'trust' | 'admin' {
    if (testName.includes('TENANT')) return 'tenant';
    if (testName.includes('OWNER')) return 'owner';
    if (testName.includes('AGENCY')) return 'agency';
    if (testName.includes('TRUST')) return 'trust';
    if (testName.includes('ADMIN')) return 'admin';
    return 'tenant'; // Valeur par défaut
  }

  /**
   * Extrait la table à partir du nom du test
   */
  private extractTableFromTestName(testName: string): string {
    const tables = ['properties', 'applications', 'messages', 'favorites', 'reviews', 'visits', 'payments', 'leases'];
    for (const table of tables) {
      if (testName.toUpperCase().includes(table.toUpperCase())) {
        return table;
      }
    }
    return 'unknown';
  }

  /**
   * Récupère les résultats des tests récents
   */
  async getRecentTestResults(days: number = 7): Promise<RLS TestResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/test/rls/results?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch recent test results:', error);
      return [];
    }
  }

  /**
   * Récupère le résumé des tests
   */
  async getTestSummary(days: number = 30): Promise<{
    totalTests: number;
    successRate: number;
    trends: Array<{ date: string; successRate: number; totalTests: number }>;
    byTable: Array<{ tableName: string; successRate: number; totalTests: number }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/test/rls/summary?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch test summary:', error);
      return {
        totalTests: 0,
        successRate: 0,
        trends: [],
        byTable: []
      };
    }
  }

  /**
   * Planifie l'exécution automatique des tests
   */
  scheduleAutomaticTests(): void {
    if (!this.config.enableAutomaticTests) {
      return;
    }

    const intervalMs = this.config.testScheduleHours * 60 * 60 * 1000;

    setInterval(async () => {
      try {
        console.log('Running automatic RLS tests...');
        const suite = await this.runFullTestSuite();
        console.log(`Automatic RLS tests completed: ${suite.successRate}% success rate`);
      } catch (error) {
        console.error('Automatic RLS tests failed:', error);
      }
    }, intervalMs);

    console.log(`Automatic RLS tests scheduled every ${this.config.testScheduleHours} hours`);
  }

  /**
   * Nettoie les anciennes données de test
   */
  async cleanupTestData(days: number = 7): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/test/rls/cleanup?days=${days}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      console.log(`Test data older than ${days} days cleaned up successfully`);
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
    }
  }

  /**
   * Vérifie si des tests sont en cours
   */
  get isRunning(): boolean {
    return this.isTestRunning;
  }

  /**
   * Récupère la configuration actuelle
   */
  get configuration(): TestConfiguration {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration
   */
  updateConfiguration(newConfig: Partial<TestConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export du service
export default RLS TestingService;
export type { RLS TestResult, RLS TestSuite, TestConfiguration };