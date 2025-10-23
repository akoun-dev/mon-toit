import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  Settings,
  BarChart3,
  Users,
  FileText,
  Hash,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Archive,
  Mail,
  MessageSquare,
  Smartphone,
  Key,
  Certificate,
  Lock,
  Unlock,
  Zap,
  Activity,
  TrendingUp,
  Globe,
  Database,
  Server,
  Cpu,
  HardDrive
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface SignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  documentType: 'lease' | 'contract' | 'agreement' | 'authorization' | 'other';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  signatories: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'signed' | 'declined' | 'expired';
    signedAt?: string;
    method: 'email' | 'sms' | 'mobile' | 'face_id';
  }>;
  status: 'draft' | 'pending' | 'partially_signed' | 'completed' | 'expired' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  securityLevel: 'basic' | 'standard' | 'enhanced' | 'maximum';
  metadata: {
    fileSize: number;
    pageCount: number;
    format: string;
    checksum: string;
  };
  reminders: Array<{
    sentAt: string;
    method: string;
    recipient: string;
  }>;
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    ip: string;
    details: string;
  }>;
}

interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Array<{
    id: string;
    type: 'signature' | 'date' | 'text' | 'checkbox' | 'initial';
    label: string;
    required: boolean;
    position: { x: number; y: number; width: number; height: number };
  }>;
  uses: number;
  lastUsed: string;
  createdBy: string;
  createdAt: string;
}

interface SecurityMetrics {
  totalSignatures: number;
  activeCertificates: number;
  verificationAttempts: number;
  successRate: number;
  averageProcessingTime: number;
  securityIncidents: number;
  blockedAttempts: number;
}

const AdminSignaturesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedSignature, setSelectedSignature] = useState<SignatureRequest | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalSignatures: 0,
    activeCertificates: 0,
    verificationAttempts: 0,
    successRate: 0,
    averageProcessingTime: 0,
    securityIncidents: 0,
    blockedAttempts: 0,
  });

  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([
    {
      id: 'SIG001',
      documentId: 'DOC001',
      documentName: 'Contrat de location Appartement ABID-2024-001',
      documentType: 'lease',
      requesterId: 'USR001',
      requesterName: 'Yao Kouadio',
      requesterEmail: 'yao.kouadio@email.com',
      signatories: [
        {
          id: 'SIG001-1',
          name: 'Yao Kouadio',
          email: 'yao.kouadio@email.com',
          phone: '+2250700000001',
          status: 'signed',
          signedAt: '2024-10-22T10:30:00',
          method: 'mobile'
        },
        {
          id: 'SIG001-2',
          name: 'Awa Touré',
          email: 'awa.toure@email.com',
          phone: '+2250700000002',
          status: 'pending',
          method: 'email'
        }
      ],
      status: 'partially_signed',
      priority: 'high',
      createdAt: '2024-10-20T09:00:00',
      expiresAt: '2024-11-20T09:00:00',
      securityLevel: 'enhanced',
      metadata: {
        fileSize: 2048576,
        pageCount: 12,
        format: 'PDF',
        checksum: 'sha256:a1b2c3d4e5f6...'
      },
      reminders: [
        {
          sentAt: '2024-10-22T09:00:00',
          method: 'email',
          recipient: 'awa.toure@email.com'
        }
      ],
      auditTrail: [
        {
          action: 'signature_initiated',
          actor: 'yao.kouadio@email.com',
          timestamp: '2024-10-20T09:00:00',
          ip: '41.207.0.1',
          details: 'Document uploaded and signature request initiated'
        },
        {
          action: 'document_signed',
          actor: 'yao.kouadio@email.com',
          timestamp: '2024-10-22T10:30:00',
          ip: '41.207.0.1',
          details: 'Document signed using mobile app'
        }
      ]
    },
    {
      id: 'SIG002',
      documentId: 'DOC002',
      documentName: 'Mandat de gestion AG-2024-001',
      documentType: 'contract',
      requesterId: 'USR002',
      requesterName: 'AGENCE IMMO-CI',
      requesterEmail: 'contact@immo-ci.ci',
      signatories: [
        {
          id: 'SIG002-1',
          name: 'Patrice Konan',
          email: 'p.konan@immo-ci.ci',
          status: 'signed',
          signedAt: '2024-10-21T14:15:00',
          method: 'email'
        },
        {
          id: 'SIG002-2',
          name: 'Mariam Bamba',
          email: 'm.bamba@client.ci',
          status: 'signed',
          signedAt: '2024-10-21T16:45:00',
          method: 'sms'
        }
      ],
      status: 'completed',
      priority: 'normal',
      createdAt: '2024-10-19T11:30:00',
      expiresAt: '2024-11-19T11:30:00',
      completedAt: '2024-10-21T16:45:00',
      securityLevel: 'standard',
      metadata: {
        fileSize: 1536789,
        pageCount: 8,
        format: 'PDF',
        checksum: 'sha256:f6e5d4c3b2a1...'
      },
      reminders: [],
      auditTrail: [
        {
          action: 'signature_initiated',
          actor: 'p.konan@immo-ci.ci',
          timestamp: '2024-10-19T11:30:00',
          ip: '41.207.0.2',
          details: 'Mandat document uploaded for signature'
        },
        {
          action: 'document_signed',
          actor: 'p.konan@immo-ci.ci',
          timestamp: '2024-10-21T14:15:00',
          ip: '41.207.0.2',
          details: 'Signed via email link'
        },
        {
          action: 'document_signed',
          actor: 'm.bamba@client.ci',
          timestamp: '2024-10-21T16:45:00',
          ip: '41.207.0.3',
          details: 'Signed via SMS verification'
        },
        {
          action: 'signature_completed',
          actor: 'system',
          timestamp: '2024-10-21T16:45:00',
          ip: 'system',
          details: 'All signatories completed, document finalized'
        }
      ]
    },
    {
      id: 'SIG003',
      documentId: 'DOC003',
      documentName: 'Autorisation de prélèvement bancaire',
      documentType: 'authorization',
      requesterId: 'USR003',
      requesterName: 'Koffi Yapo',
      requesterEmail: 'koffi.yapo@email.com',
      signatories: [
        {
          id: 'SIG003-1',
          name: 'Koffi Yapo',
          email: 'koffi.yapo@email.com',
          status: 'pending',
          method: 'mobile'
        }
      ],
      status: 'pending',
      priority: 'urgent',
      createdAt: '2024-10-23T08:15:00',
      expiresAt: '2024-10-30T08:15:00',
      securityLevel: 'maximum',
      metadata: {
        fileSize: 524288,
        pageCount: 2,
        format: 'PDF',
        checksum: 'sha256:c9d8e7f6a5b4...'
      },
      reminders: [],
      auditTrail: [
        {
          action: 'signature_initiated',
          actor: 'koffi.yapo@email.com',
          timestamp: '2024-10-23T08:15:00',
          ip: '41.207.0.4',
          details: 'Bank authorization document uploaded'
        }
      ]
    }
  ]);

  const [templates, setTemplates] = useState<SignatureTemplate[]>([
    {
      id: 'TPL001',
      name: 'Contrat de Location Standard',
      description: 'Modèle de contrat de location conforme à la législation ivoirienne',
      category: 'Baux immobiliers',
      uses: 156,
      lastUsed: '2024-10-22T14:30:00',
      createdBy: 'admin@mon-toit.ci',
      createdAt: '2024-01-15T09:00:00',
      fields: [
        {
          id: 'fld1',
          type: 'signature',
          label: 'Signature du propriétaire',
          required: true,
          position: { x: 100, y: 500, width: 200, height: 50 }
        },
        {
          id: 'fld2',
          type: 'signature',
          label: 'Signature du locataire',
          required: true,
          position: { x: 100, y: 600, width: 200, height: 50 }
        },
        {
          id: 'fld3',
          type: 'date',
          label: 'Date de signature',
          required: true,
          position: { x: 400, y: 550, width: 150, height: 30 }
        }
      ]
    },
    {
      id: 'TPL002',
      name: 'Mandat de Gestion',
      description: 'Mandat de gestion immobilière avec clause de rémunération',
      category: 'Services agence',
      uses: 89,
      lastUsed: '2024-10-21T11:20:00',
      createdBy: 'admin@mon-toit.ci',
      createdAt: '2024-02-20T14:30:00',
      fields: [
        {
          id: 'fld4',
          type: 'signature',
          label: 'Signature du mandant',
          required: true,
          position: { x: 150, y: 450, width: 200, height: 50 }
        },
        {
          id: 'fld5',
          type: 'signature',
          label: 'Signature de l\'agence',
          required: true,
          position: { x: 150, y: 550, width: 200, height: 50 }
        }
      ]
    }
  ]);

  useEffect(() => {
    // Simuler le chargement des métriques de sécurité
    setSecurityMetrics({
      totalSignatures: 1847,
      activeCertificates: 342,
      verificationAttempts: 2847,
      successRate: 98.5,
      averageProcessingTime: 2.3,
      securityIncidents: 2,
      blockedAttempts: 47,
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'partially_signed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'completed': 'default',
      'pending': 'secondary',
      'partially_signed': 'secondary',
      'expired': 'destructive',
      'cancelled': 'destructive',
      'draft': 'outline'
    };

    const labels: Record<string, string> = {
      'completed': 'Terminé',
      'pending': 'En attente',
      'partially_signed': 'Signé partiellement',
      'expired': 'Expiré',
      'cancelled': 'Annulé',
      'draft': 'Brouillon'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getSecurityLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'basic': 'bg-blue-100 text-blue-800',
      'standard': 'bg-green-100 text-green-800',
      'enhanced': 'bg-yellow-100 text-yellow-800',
      'maximum': 'bg-red-100 text-red-800'
    };

    const labels: Record<string, string> = {
      'basic': 'Basique',
      'standard': 'Standard',
      'enhanced': 'Renforcée',
      'maximum': 'Maximum'
    };

    return (
      <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>
        {labels[level] || level}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'face_id':
        return <Shield className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const filteredSignatures = signatureRequests.filter(sig => {
    const matchesSearch = sig.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sig.requesterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSignature className="h-8 w-8 text-blue-600" />
            Signatures Électroniques
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des signatures électroniques et certificats numériques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Nouvelle Signature
          </Button>
        </div>
      </div>

      {/* Métriques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Signatures</p>
                <p className="text-2xl font-bold text-gray-900">
                  {securityMetrics.totalSignatures.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileSignature className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Certificats Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {securityMetrics.activeCertificates}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Certificate className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de Succès</p>
                <p className="text-2xl font-bold text-gray-900">
                  {securityMetrics.successRate}%
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incidents Sécurité</p>
                <p className="text-2xl font-bold text-gray-900">
                  {securityMetrics.securityIncidents}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques des signatures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité de Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Signatures aujourd'hui</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En attente</span>
                    <span className="font-semibold text-yellow-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps moyen de traitement</span>
                    <span className="font-semibold">{securityMetrics.averageProcessingTime} jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tentatives de vérification</span>
                    <span className="font-semibold">{securityMetrics.verificationAttempts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Méthodes de signature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Méthodes de Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { method: 'Mobile App', usage: 45, icon: <Smartphone className="h-4 w-4" /> },
                    { method: 'Email', usage: 30, icon: <Mail className="h-4 w-4" /> },
                    { method: 'SMS', usage: 15, icon: <MessageSquare className="h-4 w-4" /> },
                    { method: 'Face ID', usage: 10, icon: <Shield className="h-4 w-4" /> }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-sm font-medium">{item.method}</span>
                        </div>
                        <span className="text-sm text-gray-600">{item.usage}%</span>
                      </div>
                      <Progress value={item.usage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documents récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Documents Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signatureRequests.slice(0, 3).map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{sig.documentName}</p>
                          <p className="text-xs text-gray-500">
                            {sig.signatories.filter(s => s.status === 'signed').length}/{sig.signatories.length} signé(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sig.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(sig.createdAt).toLocaleDateString('fr-CI')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertes de sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertes de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Tentatives d'accès suspectes
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      3 tentatives bloquées depuis des adresses IP inconnues
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Certificats à renouveler
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      5 certificats expirent dans les 30 prochains jours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Demandes */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un document, demandeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="partially_signed">Signé partiellement</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>

          {/* Tableau des demandes */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Document</th>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Demandeur</th>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Signataires</th>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Sécurité</th>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Statut</th>
                      <th className="text-left p-3 text-xs md:p-4 text-sm font-medium text-gray-900 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignatures.map((signature) => (
                      <tr key={signature.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-xs md:p-4">
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{signature.documentName}</p>
                            <p className="text-xs text-gray-500">
                              {signature.metadata.fileSize > 1024 * 1024
                                ? `${(signature.metadata.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.round(signature.metadata.fileSize / 1024)} KB`
                              } • {signature.metadata.pageCount} pages
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-xs md:p-4">
                          <div>
                            <p className="text-sm font-medium">{signature.requesterName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{signature.requesterEmail}</p>
                          </div>
                        </td>
                        <td className="p-3 text-xs md:p-4">
                          <div className="space-y-1">
                            {signature.signatories.slice(0, 2).map((signatory, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {getMethodIcon(signatory.method)}
                                <span className="text-xs truncate max-w-24">{signatory.name}</span>
                                {getStatusIcon(signatory.status)}
                              </div>
                            ))}
                            {signature.signatories.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{signature.signatories.length - 2} autres
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-xs md:p-4">
                          {getSecurityLevelBadge(signature.securityLevel)}
                        </td>
                        <td className="p-3 text-xs md:p-4">
                          {getStatusBadge(signature.status)}
                        </td>
                        <td className="p-3 text-xs md:p-4">
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedSignature(signature)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileSignature className="h-5 w-5" />
                                    Détails de la Signature
                                  </DialogTitle>
                                  <DialogDescription>
                                    {signature.documentName}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* Informations générales */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">ID du document</label>
                                      <p className="text-sm text-gray-600">{signature.documentId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Type de document</label>
                                      <p className="text-sm text-gray-600">{signature.documentType}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Date de création</label>
                                      <p className="text-sm text-gray-600">
                                        {new Date(signature.createdAt).toLocaleString('fr-CI')}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Date d'expiration</label>
                                      <p className="text-sm text-gray-600">
                                        {new Date(signature.expiresAt).toLocaleString('fr-CI')}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Métadonnées */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Métadonnées du document</h4>
                                    <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                                      <div>
                                        <p className="text-xs text-gray-500">Taille</p>
                                        <p className="text-sm font-medium">
                                          {signature.metadata.fileSize > 1024 * 1024
                                            ? `${(signature.metadata.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                            : `${Math.round(signature.metadata.fileSize / 1024)} KB`
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Pages</p>
                                        <p className="text-sm font-medium">{signature.metadata.pageCount}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Format</p>
                                        <p className="text-sm font-medium">{signature.metadata.format}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Checksum</p>
                                        <p className="text-sm font-mono truncate">{signature.metadata.checksum.substring(0, 16)}...</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Signataires */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Signataires</h4>
                                    <div className="space-y-3">
                                      {signature.signatories.map((signatory, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                          <div className="flex items-center gap-3">
                                            {getMethodIcon(signatory.method)}
                                            <div>
                                              <p className="text-sm font-medium">{signatory.name}</p>
                                              <p className="text-xs text-gray-500">{signatory.email}</p>
                                              {signatory.phone && (
                                                <p className="text-xs text-gray-500">{signatory.phone}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                              {getStatusIcon(signatory.status)}
                                              <span className="text-sm font-medium capitalize">
                                                {signatory.status === 'signed' ? 'Signé' :
                                                 signatory.status === 'pending' ? 'En attente' :
                                                 signatory.status === 'declined' ? 'Refusé' : 'Expiré'}
                                              </span>
                                            </div>
                                            {signatory.signedAt && (
                                              <p className="text-xs text-gray-500">
                                                {new Date(signatory.signedAt).toLocaleString('fr-CI')}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Audit trail */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Journal d'audit</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {signature.auditTrail.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            <span className="font-medium">{entry.action}</span>
                                            <span className="text-gray-500">• {entry.actor}</span>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-gray-500">{new Date(entry.timestamp).toLocaleString('fr-CI')}</p>
                                            <p className="text-gray-400">IP: {entry.ip}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Modèles */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Modèles de Documents</h3>
              <p className="text-sm text-gray-600">Créez et gérez vos modèles de documents prédéfinis</p>
            </div>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Nouveau Modèle
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilisations</span>
                      <span className="font-medium">{template.uses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dernière utilisation</span>
                      <span className="font-medium">
                        {new Date(template.lastUsed).toLocaleDateString('fr-CI')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Champs de signature</span>
                      <span className="font-medium">{template.fields.length}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Aperçu
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration de sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Configuration de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Vérification en deux étapes</p>
                    <p className="text-xs text-gray-500">Exiger 2FA pour toutes les signatures</p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Chiffrement de bout en bout</p>
                    <p className="text-xs text-gray-500">AES-256 pour tous les documents</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Activé</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Horodatage certifié</p>
                    <p className="text-xs text-gray-500">Horodatage qualifié eIDAS</p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
              </CardContent>
            </Card>

            {/* Certificats numériques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Certificate className="h-5 w-5" />
                  Certificats Numériques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-green-800">Certificat Principal</p>
                        <p className="text-xs text-green-700">Valide jusqu'au 15/12/2024</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Certificat Backup</p>
                        <p className="text-xs text-yellow-700">Expire dans 45 jours</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un certificat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Serveurs de signature</span>
                    </div>
                    <Badge variant="outline">3 actifs</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Stockage sécurisé</span>
                    </div>
                    <Badge variant="outline">87% utilisé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Base de données</span>
                    </div>
                    <Badge variant="outline">Répliquée</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">CDN mondial</span>
                    </div>
                    <Badge variant="outline">Actif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Surveillance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Surveillance en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Charge CPU</span>
                    <div className="flex items-center gap-2">
                      <Progress value={35} className="w-20 h-2" />
                      <span className="text-sm font-medium">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mémoire utilisée</span>
                    <div className="flex items-center gap-2">
                      <Progress value={62} className="w-20 h-2" />
                      <span className="text-sm font-medium">62%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bande passante</span>
                    <div className="flex items-center gap-2">
                      <Progress value={28} className="w-20 h-2" />
                      <span className="text-sm font-medium">28%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps de réponse</span>
                    <div className="flex items-center gap-2">
                      <Progress value={15} className="w-20 h-2" />
                      <span className="text-sm font-medium">15ms</span>
                    </div>
                  </div>
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

export default AdminSignaturesPage;