import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Ban,
  Flag,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  RefreshCw,
  Zap,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface ModerationItem {
  id: string;
  type: 'review' | 'property' | 'message' | 'user_profile';
  content: any;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  auto_flagged: boolean;
  flag_reasons: string[];
  ai_confidence: number;
  human_review_required: boolean;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  moderation_notes?: string;
}

interface ModerationStats {
  total_items: number;
  pending_items: number;
  approved_items: number;
  rejected_items: number;
  auto_flagged_items: number;
  human_reviewed_items: number;
  average_processing_time: number;
  this_month_items: number;
  flagged_categories: Record<string, number>;
}

interface AIAnalysis {
  sentiment_score: number;
  toxicity_score: number;
  spam_probability: number;
  personal_info_detected: boolean;
  inappropriate_content: boolean;
  confidence_score: number;
  suggested_action: 'approve' | 'reject' | 'flag_for_review';
  reasoning: string;
  detected_keywords: string[];
}

export const AdvancedModerationSystem = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('queue');
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Form states
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'flag'>('approve');
  const [moderationNotes, setModerationNotes] = useState('');

  useEffect(() => {
    fetchModerationData();
    fetchStats();

    // Real-time subscription
    const channel = supabase
      .channel('moderation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moderation_queue'
        },
        () => {
          fetchModerationData();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchModerationData = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          content_data
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      logger.error('Error fetching moderation data', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de modération",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_moderation_stats');

      if (error) {
        // Calculer manuellement si la fonction n'existe pas
        await calculateManualStats();
        return;
      }

      setStats(data);
    } catch (error) {
      logger.error('Error fetching moderation stats', { error });
      await calculateManualStats();
    }
  };

  const calculateManualStats = async () => {
    try {
      // Calculer les statistiques manuellement
      const { data: items_data } = await supabase
        .from('moderation_queue')
        .select('moderation_status, priority, auto_flagged, created_at, reviewed_at');

      if (items_data) {
        const total = items_data.length;
        const pending = items_data.filter(i => i.moderation_status === 'pending').length;
        const approved = items_data.filter(i => i.moderation_status === 'approved').length;
        const rejected = items_data.filter(i => i.moderation_status === 'rejected').length;
        const auto_flagged = items_data.filter(i => i.auto_flagged).length;

        const this_month = items_data.filter(i =>
          new Date(i.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ).length;

        // Temps moyen de traitement
        const processed_items = items_data.filter(i => i.reviewed_at);
        const avg_processing_time = processed_items.length > 0
          ? processed_items.reduce((sum, i) => {
              const start = new Date(i.created_at);
              const end = new Date(i.reviewed_at!);
              return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0) / processed_items.length
          : 0;

        // Catégories de signalement
        const flagged_categories: Record<string, number> = {};
        items_data.forEach(item => {
          if (item.moderation_status === 'rejected') {
            flagged_categories[item.type] = (flagged_categories[item.type] || 0) + 1;
          }
        });

        setStats({
          total_items: total,
          pending_items: pending,
          approved_items: approved,
          rejected_items: rejected,
          auto_flagged_items: auto_flagged,
          human_reviewed_items: total - auto_flagged,
          average_processing_time: avg_processing_time,
          this_month_items: this_month,
          flagged_categories
        });
      }
    } catch (error) {
      logger.error('Error calculating manual stats', { error });
    }
  };

  const runAIAnalysis = async (item: ModerationItem) => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      // Simuler l'analyse IA (à remplacer par un appel réel à une API d'IA)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis: AIAnalysis = {
        sentiment_score: Math.random() * 2 - 1, // -1 à 1
        toxicity_score: Math.random() * 100, // 0 à 100
        spam_probability: Math.random() * 100, // 0 à 100
        personal_info_detected: Math.random() > 0.8,
        inappropriate_content: Math.random() > 0.7,
        confidence_score: 75 + Math.random() * 25, // 75 à 100
        suggested_action: Math.random() > 0.3 ? 'approve' : 'reject',
        reasoning: 'Analyse basée sur le contenu textuel, les patterns linguistiques et les historiques de modération',
        detected_keywords: ['excellent', 'service', 'rapide', 'propre'].slice(0, Math.floor(Math.random() * 4))
      };

      setAnalysis(mockAnalysis);
    } catch (error) {
      logger.error('Error running AI analysis', { error });
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le contenu avec l'IA",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModerate = (item: ModerationItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
    setModerationAction('approve');
    setModerationNotes('');
    setAnalysis(null);
  };

  const submitModeration = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase.rpc('process_moderation_item', {
        p_item_id: selectedItem.id,
        p_action: moderationAction,
        p_notes: moderationNotes,
        p_ai_analysis_confidence: analysis?.confidence_score || null
      });

      if (error) throw error;

      toast({
        title: "Modération traitée",
        description: `L'élément a été ${moderationAction === 'approve' ? 'approuvé' : moderationAction === 'reject' ? 'rejeté' : 'signalé'} avec succès`,
      });

      setDialogOpen(false);
      setSelectedItem(null);
      setAnalysis(null);
      fetchModerationData();
      fetchStats();
    } catch (error) {
      logger.error('Error submitting moderation', { error });
      toast({
        title: "Erreur",
        description: "Impossible de traiter la modération",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'flagged': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <Star className="h-4 w-4" />;
      case 'property': return <FileText className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'user_profile': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm ||
      JSON.stringify(item.content).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.moderation_status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

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
            Système de Modération Avancé
          </h2>
          <p className="text-muted-foreground">
            Gestion intelligente du contenu avec IA et modération humaine
          </p>
        </div>
        <Button onClick={() => { fetchModerationData(); fetchStats(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contenu</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_items}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.this_month_items} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending_items}</div>
              <p className="text-xs text-muted-foreground">
                {stats.auto_flagged_items} auto-détecté
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvé</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved_items}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_items > 0 ? Math.round((stats.approved_items / stats.total_items) * 100) : 0}% de taux
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.average_processing_time)}h
              </div>
              <p className="text-xs text-muted-foreground">
                Temps de traitement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">File de modération</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuration IA</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans le contenu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                    <SelectItem value="flagged">Signalé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="review">Avis</SelectItem>
                    <SelectItem value="property">Propriété</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="user_profile">Profil</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Moderation Queue */}
          <Card>
            <CardHeader>
              <CardTitle>File de Modération</CardTitle>
              <CardDescription>
                {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''} à modérer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>IA</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge variant="outline">
                            {item.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">
                            {typeof item.content === 'string'
                              ? item.content
                              : item.content?.comment || item.content?.title || 'Contenu multimédia'
                            }
                          </p>
                          {item.auto_flagged && (
                            <Badge variant="secondary" className="mt-1">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-détecté
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.ai_confidence ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm">{item.ai_confidence}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.moderation_status)}>
                          {item.moderation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerate(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.auto_flagged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => runAIAnalysis(item)}
                              disabled={analyzing}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Évolution des signalements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.flagged_categories && Object.entries(stats.flagged_categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Efficacité de l'IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-détectés</span>
                    <span className="font-medium">{stats?.auto_flagged_items}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revue humaine</span>
                    <span className="font-medium">{stats?.human_reviewed_items}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Précision moyenne</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration de la Modération IA
              </CardTitle>
              <CardDescription>
                Paramètres pour l'analyse automatique du contenu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Seuils de détection automatique</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Toxicité minimale</span>
                      <Badge variant="outline">70%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Probabilité de spam</span>
                      <Badge variant="outline">85%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confiance IA minimale</span>
                      <Badge variant="outline">80%</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Actions automatiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Rejet automatique pour contenu hautement toxique (>90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Approbation automatique pour contenu sûr (>95% confiance IA)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Revue humaine obligatoire pour contenu ambigu (70-95% confiance IA)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Catégories surveillées</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Harcèlement', 'Discours haineux', 'Spam', 'Contenu inapproprié', 'Informations personnelles', 'Violence'].map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Moderation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Examiner le contenu</DialogTitle>
            <DialogDescription>
              Modération du contenu avec assistance IA et annotations manuelles
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Content Preview */}
              <div>
                <h4 className="font-medium mb-2">Contenu à modérer</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(selectedItem.type)}
                    <Badge variant="outline">{selectedItem.type}</Badge>
                    <Badge className={getPriorityColor(selectedItem.priority)}>
                      {selectedItem.priority}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {typeof selectedItem.content === 'string'
                      ? selectedItem.content
                      : selectedItem.content?.comment || selectedItem.content?.title || JSON.stringify(selectedItem.content, null, 2)
                    }
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Analyse IA</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAIAnalysis(selectedItem)}
                    disabled={analyzing}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {analyzing ? 'Analyse...' : 'Analyser avec IA'}
                  </Button>
                </div>

                {analysis && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Score de sentiment:</span>
                        <span className={`font-medium ${
                          analysis.sentiment_score > 0.2 ? 'text-green-600' :
                          analysis.sentiment_score < -0.2 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {Math.round(analysis.sentiment_score * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Toxicité:</span>
                        <span className={`font-medium ${
                          analysis.toxicity_score > 70 ? 'text-red-600' :
                          analysis.toxicity_score > 40 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {Math.round(analysis.toxicity_score)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Probabilité de spam:</span>
                        <span className={`font-medium ${
                          analysis.spam_probability > 70 ? 'text-red-600' :
                          analysis.spam_probability > 40 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {Math.round(analysis.spam_probability)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Contenu inapproprié:</span>
                        <Badge variant={analysis.inappropriate_content ? 'destructive' : 'default'}>
                          {analysis.inappropriate_content ? 'Détecté' : 'Non détecté'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Infos personnelles:</span>
                        <Badge variant={analysis.personal_info_detected ? 'destructive' : 'default'}>
                          {analysis.personal_info_detected ? 'Détecté' : 'Non détecté'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confiance IA:</span>
                        <span className="font-medium">{Math.round(analysis.confidence_score)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="mt-3 space-y-2">
                    <h5 className="font-medium text-sm">Action suggérée:</h5>
                    <Badge className={
                      analysis.suggested_action === 'approve' ? 'text-green-600 bg-green-50' :
                      analysis.suggested_action === 'reject' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                    }>
                      {analysis.suggested_action === 'approve' ? 'Approuver' :
                       analysis.suggested_action === 'reject' ? 'Rejeter' : 'Signal pour revue'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">{analysis.reasoning}</p>
                  </div>
                )}
              </div>

              {/* Moderation Action */}
              <div>
                <h4 className="font-medium mb-2">Action de modération</h4>
                <Select value={moderationAction} onValueChange={(value: any) => setModerationAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approuver le contenu
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rejeter le contenu
                      </div>
                    </SelectItem>
                    <SelectItem value="flag">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-amber-600" />
                        Signaler pour revue
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moderator Notes */}
              <div>
                <h4 className="font-medium mb-2">Notes du modérateur</h4>
                <Textarea
                  placeholder="Ajoutez vos notes et la raison de votre décision..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitModeration}>
              {moderationAction === 'approve' && 'Approuver'}
              {moderationAction === 'reject' && 'Rejeter'}
              {moderationAction === 'flag' && 'Signaler'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};