/**
 * TABLEAU DE BORD DE SÉCURITÉ
 * Surveillance des vulnérabilités et métriques de sécurité en temps réel
 */

import React, { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Target,
  Eye, Activity, Zap, Lock, Unlock, Database, Globe, Code,
  FileText, BarChart3, RefreshCw, Download, Filter, Search,
  Calendar, User, Settings, Bell, ChevronDown, ChevronRight,
  Info, AlertCircle, XCircle, CheckSquare, Square, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VulnerabilityScanner, { Vulnerability, SecurityMetrics } from '../../security/vulnerabilityScanner';

interface SecurityDashboardProps {
  userId: string;
  userRole: 'admin' | 'owner' | 'tenant' | 'agency';
  compact?: boolean;
  autoRefresh?: boolean;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  userId,
  userRole,
  compact = false,
  autoRefresh = true
}) => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);

  const scanner = new VulnerabilityScanner();

  useEffect(() => {
    loadSecurityData();
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);

      // Charger les métriques de sécurité
      const report = await scanner.generateSecurityReport('30d');
      setMetrics(report.summary);
      setVulnerabilities(report.vulnerabilities);

      setLastScanTime(new Date());

    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSecurityScan = async (type: 'sast' | 'dast' | 'dependency' | 'full') => {
    setIsScanning(true);

    try {
      let scanResult;
      switch (type) {
        case 'sast':
          scanResult = await scanner.runSecurityScan('sast', './src');
          break;
        case 'dast':
          scanResult = await scanner.runSecurityScan('dast', window.location.origin);
          break;
        case 'dependency':
          scanResult = await scanner.runSecurityScan('dependency', './');
          break;
        case 'full':
          // Lancer tous les scans
          await Promise.all([
            scanner.runSecurityScan('sast', './src'),
            scanner.runSecurityScan('dast', window.location.origin),
            scanner.runSecurityScan('dependency', './')
          ]);
          break;
      }

      // Recharger les données après le scan
      await loadSecurityData();

      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification({
          type: 'success',
          title: 'Scan de sécurité terminé',
          message: `${vulnerabilities.length} vulnérabilités trouvées`
        });
      }

    } catch (error) {
      console.error('Security scan failed:', error);
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification({
          type: 'error',
          title: 'Échec du scan',
          message: 'Le scan de sécurité a rencontré une erreur'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleVulnerabilityAction = async (vulnId: string, action: 'resolve' | 'ignore' | 'assign') => {
    try {
      // Implémenter l'action sur la vulnérabilité
      await fetch(`/api/security/vulnerabilities/${vulnId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      // Recharger les données
      await loadSecurityData();

    } catch (error) {
      console.error(`Failed to ${action} vulnerability:`, error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <AlertCircle className="w-5 h-5" />;
      case 'low': return <Info className="w-5 h-5" />;
      case 'info': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      injection: <Database className="w-4 h-4" />,
      xss: <Code className="w-4 h-4" />,
      auth: <Lock className="w-4 h-4" />,
      crypto: <Shield className="w-4 h-4" />,
      config: <Settings className="w-4 h-4" />,
      network: <Globe className="w-4 h-4" />,
      data: <FileText className="w-4 h-4" />,
      access: <User className="w-4 h-4" />,
      dependency: <Database className="w-4 h-4" />
    };
    return icons[category] || <AlertCircle className="w-4 h-4" />;
  };

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const getRiskColor = (score: number) => {
    const level = getRiskLevel(score);
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Filtrer les vulnérabilités
  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    if (selectedFilter !== 'all' && vuln.severity !== selectedFilter) return false;
    if (selectedCategory !== 'all' && vuln.category !== selectedCategory) return false;
    if (searchQuery && !vuln.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !vuln.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Sécurité</h3>
          </div>
          <div className="flex items-center gap-2">
            {metrics && (
              <span className={`text-sm font-medium ${getRiskColor(metrics.risk.score)}`}>
                Score: {metrics.risk.score}/10
              </span>
            )}
            {isScanning && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
          </div>
        </div>

        {/* Métriques principales */}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Critiques</span>
                <span className="text-lg font-bold text-red-600">{metrics.vulnerabilities.critical}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">{metrics.vulnerabilities.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dernières vulnérabilités */}
        {filteredVulnerabilities.slice(0, 2).map((vuln) => (
          <div key={vuln.id} className="bg-white rounded-lg p-3 border border-gray-200 mb-2">
            <div className="flex items-center gap-2 mb-1">
              {getSeverityIcon(vuln.severity)}
              <span className="text-sm font-medium text-gray-900 truncate">
                {vuln.title}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate">
                {vuln.location.file || vuln.location.endpoint}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(vuln.severity)}`}>
                {vuln.severity}
              </span>
            </div>
          </div>
        ))}

        {/* Actions rapides */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => runSecurityScan('full')}
            disabled={isScanning}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isScanning ? 'Scan...' : 'Scanner'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Centre de Sécurité</h2>
            <p className="text-sm text-gray-600">
              Surveillance des vulnérabilités et métriques de sécurité en temps réel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastScanTime && (
            <span className="text-sm text-gray-500">
              Dernier scan: {lastScanTime.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <button
            onClick={loadSecurityData}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cartes de métriques */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Score de Risque</h3>
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getRiskColor(metrics.risk.score)}`}>
                {metrics.risk.score}/10
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                getRiskLevel(metrics.risk.score) === 'critical' ? 'bg-red-100 text-red-700' :
                getRiskLevel(metrics.risk.score) === 'high' ? 'bg-orange-100 text-orange-700' :
                getRiskLevel(metrics.risk.score) === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {getRiskLevel(metrics.risk.score)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.risk.overall === 'critical' ? 'Nécessite une action immédiate' :
               metrics.risk.overall === 'high' ? 'Attention requise' :
               metrics.risk.overall === 'medium' ? 'Surveillance recommandée' :
               'Situation sous contrôle'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Vulnérabilités</h3>
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {metrics.vulnerabilities.total}
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {metrics.vulnerabilities.critical}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                {metrics.vulnerabilities.high}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {metrics.vulnerabilities.medium}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Taux de Correction</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {metrics.remediation.fixRate}%
            </div>
            <p className="text-xs text-gray-500">
              Temps moyen: {metrics.remediation.avgTimeToFix} jours
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Conformité</h3>
              <CheckCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {metrics.compliance.score}%
            </div>
            <p className="text-xs text-gray-500">
              {metrics.compliance.policiesPassed}/{metrics.compliance.policiesPassed + metrics.compliance.policiesFailed} politiques
            </p>
          </motion.div>
        </div>
      )}

      {/* Actions de scan */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Scans de Sécurité</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => runSecurityScan('sast')}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Code className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Scan SAST</div>
              <div className="text-xs opacity-75">Code source</div>
            </div>
          </button>

          <button
            onClick={() => runSecurityScan('dast')}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <Globe className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Scan DAST</div>
              <div className="text-xs opacity-75">Application dynamique</div>
            </div>
          </button>

          <button
            onClick={() => runSecurityScan('dependency')}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Database className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Dépendances</div>
              <div className="text-xs opacity-75">Packages & librairies</div>
            </div>
          </button>

          <button
            onClick={() => runSecurityScan('full')}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Scan Complet</div>
              <div className="text-xs opacity-75">Tous les types</div>
            </div>
          </button>
        </div>

        {isScanning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">Scan de sécurité en cours...</span>
          </div>
        )}
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des vulnérabilités..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres de sévérité */}
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => setSelectedFilter(severity as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === severity
                    ? severity === 'all' ? 'bg-gray-600 text-white' :
                    severity === 'critical' ? 'bg-red-600 text-white' :
                    severity === 'high' ? 'bg-orange-600 text-white' :
                    severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity === 'all' ? 'Toutes' :
                 severity === 'critical' ? 'Critiques' :
                 severity === 'high' ? 'Élevées' :
                 severity === 'medium' ? 'Moyennes' : 'Faibles'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des vulnérabilités */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Vulnérabilités ({filteredVulnerabilities.length})
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredVulnerabilities.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune vulnérabilité détectée
              </h3>
              <p className="text-gray-500">
                Votre système semble sécurisé. Continuez à surveiller régulièrement.
              </p>
            </div>
          ) : (
            filteredVulnerabilities.map((vulnerability) => (
              <motion.div
                key={vulnerability.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icône de sévérité */}
                  <div className={`p-2 rounded-lg ${getSeverityColor(vulnerability.severity)}`}>
                    {getSeverityIcon(vulnerability.severity)}
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {vulnerability.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {vulnerability.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedVuln(
                            expandedVuln === vulnerability.id ? null : vulnerability.id
                          )}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {expandedVuln === vulnerability.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(vulnerability.category)}
                        <span className="capitalize">{vulnerability.category}</span>
                      </div>
                      {vulnerability.location.file && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{vulnerability.location.file}</span>
                          {vulnerability.location.line && (
                            <span>:{vulnerability.location.line}</span>
                          )}
                        </div>
                      )}
                      {vulnerability.location.endpoint && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{vulnerability.location.endpoint}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(vulnerability.discoveredAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Détails étendus */}
                    <AnimatePresence>
                      {expandedVuln === vulnerability.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                        >
                          {/* Impact */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Impact</h5>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Confidentialité:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {vulnerability.impact.confidentiality}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Intégrité:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {vulnerability.impact.integrity}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Disponibilité:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {vulnerability.impact.availability}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Remédiation */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Correction</h5>
                            <p className="text-sm text-gray-600 mb-2">
                              {vulnerability.remediation.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                Complexité:
                                <span className="ml-1 font-medium capitalize">
                                  {vulnerability.remediation.complexity}
                                </span>
                              </span>
                              <span className="text-gray-600">
                                Priorité: #{vulnerability.remediation.priority}
                              </span>
                            </div>
                            {vulnerability.remediation.codeExample && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <code className="text-xs text-gray-700">
                                  {vulnerability.remediation.codeExample}
                                </code>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleVulnerabilityAction(vulnerability.id, 'resolve')}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Marquer comme résolu
                            </button>
                            <button
                              onClick={() => handleVulnerabilityAction(vulnerability.id, 'ignore')}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Ignorer
                            </button>
                            {vulnerability.remediation.references.length > 0 && (
                              <button className="px-4 py-2 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors">
                                <ExternalLink className="w-4 h-4 inline mr-1" />
                                Références
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;