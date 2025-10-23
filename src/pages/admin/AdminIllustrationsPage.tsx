import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image,
  Sparkles,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  Trash2,
  Edit,
  Copy,
  Heart,
  Share,
  Zap,
  Cpu,
  HardDrive,
  Cloud,
  Database,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Grid,
  List,
  Sliders,
  Layers,
  Wand2,
  Brush,
  Camera,
  FileImage,
  Folder,
  Tag,
  Hash,
  Calendar,
  User,
  Globe,
  Shield,
  Lock,
  Unlock,
  Activity,
  Server,
  Monitor,
  Users
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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface Illustration {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  imageUrl: string;
  thumbnailUrl: string;
  resolution: { width: number; height: number };
  fileSize: number;
  format: string;
  model: string;
  version: string;
  seed: string;
  steps: number;
  cfg_scale: number;
  sampler: string;
  creator: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: 'generating' | 'completed' | 'failed' | 'processing';
  createdAt: string;
  generatedAt?: string;
  processingTime?: number;
  cost: number;
  downloads: number;
  likes: number;
  isPublic: boolean;
  isPremium: boolean;
  metadata: {
    nsfw_score: number;
    aesthetic_score: number;
    quality_score: number;
    style: string;
    mood: string;
    colors: string[];
  };
  feedback: Array<{
    id: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

interface GenerationTask {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  parameters: {
    width: number;
    height: number;
    steps: number;
    cfg_scale: number;
    sampler: string;
    seed?: string;
    batch_size: number;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  results?: string[];
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'text-to-image' | 'image-to-image' | 'upscale' | 'inpainting';
  status: 'active' | 'maintenance' | 'deprecated';
  performance: {
    speed: number;
    quality: number;
    cost: number;
    popularity: number;
  };
  capabilities: string[];
  limitations: string[];
  pricing: {
    cost_per_generation: number;
    credits_required: number;
  };
}

const AdminIllustrationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedIllustration, setSelectedIllustration] = useState<Illustration | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationModel, setGenerationModel] = useState('stable-diffusion-xl');

  const [illustrations, setIllustrations] = useState<Illustration[]>([
    {
      id: 'ILL001',
      title: 'Appartement moderne à Cocody',
      description: 'Vue intérieure d\'un appartement de luxe avec vue sur le golfe',
      prompt: 'Modern luxury apartment interior in Abidjan Cocody, panoramic view of the Gulf of Guinea, contemporary furniture, natural lighting, high-end decor, photorealistic, 4K',
      category: 'Intérieurs',
      tags: ['appartement', 'cocody', 'luxe', 'vue-mer'],
      imageUrl: 'https://picsum.photos/seed/ill001/1024/768',
      thumbnailUrl: 'https://picsum.photos/seed/ill001/300/225',
      resolution: { width: 1024, height: 768 },
      fileSize: 2048576,
      format: 'PNG',
      model: 'stable-diffusion-xl',
      version: '1.0',
      seed: '1234567890',
      steps: 50,
      cfg_scale: 7.5,
      sampler: 'DPM++ 2M Karras',
      creator: {
        id: 'USR001',
        name: 'Yao Kouadio',
        email: 'yao.kouadio@email.com',
        role: 'propriétaire'
      },
      status: 'completed',
      createdAt: '2024-10-22T10:30:00',
      generatedAt: '2024-10-22T10:32:45',
      processingTime: 165,
      cost: 0.05,
      downloads: 12,
      likes: 8,
      isPublic: true,
      isPremium: false,
      metadata: {
        nsfw_score: 0.02,
        aesthetic_score: 8.7,
        quality_score: 9.2,
        style: 'photorealistic',
        mood: 'elegant',
        colors: ['#2C3E50', '#3498DB', '#ECF0F1', '#95A5A6']
      },
      feedback: [
        {
          id: 'FB001',
          userId: 'USR002',
          rating: 5,
          comment: 'Excellent rendu, très réaliste!',
          createdAt: '2024-10-22T11:00:00'
        }
      ]
    },
    {
      id: 'ILL002',
      title: 'Bureau moderne pour agence',
      description: 'Espace de travail ouvert avec décor moderne et professionnel',
      prompt: 'Modern open office space for real estate agency, contemporary design, professional atmosphere, natural lighting, ergonomic furniture, Abidjan business district, corporate interior design',
      category: 'Bureaux',
      tags: ['bureau', 'agence', 'moderne', 'professionnel'],
      imageUrl: 'https://picsum.photos/seed/ill002/1024/768',
      thumbnailUrl: 'https://picsum.photos/seed/ill002/300/225',
      resolution: { width: 1024, height: 768 },
      fileSize: 1847656,
      format: 'JPEG',
      model: 'dall-e-3',
      version: '2.0',
      seed: '0987654321',
      steps: 30,
      cfg_scale: 7.0,
      sampler: 'DDIM',
      creator: {
        id: 'USR003',
        name: 'AGENCE IMMO-CI',
        email: 'contact@immo-ci.ci',
        role: 'agence'
      },
      status: 'completed',
      createdAt: '2024-10-21T14:15:00',
      generatedAt: '2024-10-21T14:18:20',
      processingTime: 200,
      cost: 0.08,
      downloads: 25,
      likes: 15,
      isPublic: true,
      isPremium: true,
      metadata: {
        nsfw_score: 0.01,
        aesthetic_score: 8.9,
        quality_score: 9.5,
        style: 'modern professional',
        mood: 'corporate',
        colors: ['#34495E', '#3498DB', '#E74C3C', '#ECF0F1']
      },
      feedback: []
    },
    {
      id: 'ILL003',
      title: 'Villa avec piscine à Bingerville',
      description: 'Maison de luxe avec piscine et jardin tropical',
      prompt: 'Luxury villa with swimming pool in Bingerville, tropical garden, modern architecture, sunset lighting, palm trees, infinity pool, contemporary design, high-end real estate',
      category: 'Maisons',
      tags: ['villa', 'piscine', 'bingerville', 'luxe'],
      imageUrl: 'https://picsum.photos/seed/ill003/1024/768',
      thumbnailUrl: 'https://picsum.photos/seed/ill003/300/225',
      resolution: { width: 1024, height: 768 },
      fileSize: 2456789,
      format: 'PNG',
      model: 'stable-diffusion-xl',
      version: '1.0',
      seed: '5555666677',
      steps: 45,
      cfg_scale: 8.0,
      sampler: 'Euler a',
      creator: {
        id: 'USR004',
        name: 'Patrice Konan',
        email: 'p.konan@email.com',
        role: 'propriétaire'
      },
      status: 'generating',
      createdAt: '2024-10-23T09:45:00',
      cost: 0.05,
      downloads: 0,
      likes: 0,
      isPublic: false,
      isPremium: false,
      metadata: {
        nsfw_score: 0.0,
        aesthetic_score: 0.0,
        quality_score: 0.0,
        style: '',
        mood: '',
        colors: []
      },
      feedback: []
    }
  ]);

  const [generationTasks, setGenerationTasks] = useState<GenerationTask[]>([
    {
      id: 'TASK001',
      userId: 'USR001',
      prompt: 'Modern living room with sea view, contemporary furniture, natural light',
      model: 'stable-diffusion-xl',
      parameters: {
        width: 1024,
        height: 768,
        steps: 50,
        cfg_scale: 7.5,
        sampler: 'DPM++ 2M Karras',
        batch_size: 1
      },
      status: 'processing',
      progress: 65,
      priority: 'high',
      estimatedTime: 45,
      startedAt: '2024-10-23T10:15:00'
    },
    {
      id: 'TASK002',
      userId: 'USR002',
      prompt: 'Bedroom interior design, minimalist style, soft colors',
      model: 'dall-e-3',
      parameters: {
        width: 1024,
        height: 1024,
        steps: 30,
        cfg_scale: 7.0,
        sampler: 'DDIM',
        batch_size: 1
      },
      status: 'queued',
      progress: 0,
      priority: 'normal',
      estimatedTime: 120
    }
  ]);

  const [models, setModels] = useState<AIModel[]>([
    {
      id: 'stable-diffusion-xl',
      name: 'Stable Diffusion XL',
      description: 'Modèle de pointe pour la génération d\'images haute résolution',
      version: '1.0',
      type: 'text-to-image',
      status: 'active',
      performance: {
        speed: 85,
        quality: 92,
        cost: 70,
        popularity: 95
      },
      capabilities: ['Photorealisme', 'Styles artistiques', 'Architecture', 'Design intérieur'],
      limitations: ['Temps de génération moyen', 'Coût modéré'],
      pricing: {
        cost_per_generation: 0.05,
        credits_required: 5
      }
    },
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      description: 'Modèle GPT-4 pour la création d\'images',
      version: '2.0',
      type: 'text-to-image',
      status: 'active',
      performance: {
        speed: 70,
        quality: 98,
        cost: 40,
        popularity: 88
      },
      capabilities: ['Compréhension avancée', 'Créativité', 'Styles variés', 'Qualité exceptionnelle'],
      limitations: ['Coût élevé', 'Limite de générations/jour'],
      pricing: {
        cost_per_generation: 0.08,
        credits_required: 8
      }
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      description: 'Art et design génératif de haute qualité',
      version: '6.0',
      type: 'text-to-image',
      status: 'maintenance',
      performance: {
        speed: 60,
        quality: 96,
        cost: 50,
        popularity: 92
      },
      capabilities: ['Style artistique', 'Rendu cinématographique', 'Composition avancée'],
      limitations: ['En maintenance', 'API limitée'],
      pricing: {
        cost_per_generation: 0.06,
        credits_required: 6
      }
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'completed': 'default',
      'generating': 'secondary',
      'processing': 'secondary',
      'queued': 'secondary',
      'failed': 'destructive',
      'cancelled': 'destructive'
    };

    const labels: Record<string, string> = {
      'completed': 'Terminé',
      'generating': 'Génération',
      'processing': 'Traitement',
      'queued': 'En attente',
      'failed': 'Échoué',
      'cancelled': 'Annulé'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredIllustrations = illustrations.filter(ill => {
    const matchesSearch = ill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ill.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || ill.category === categoryFilter;
    const matchesModel = modelFilter === 'all' || ill.model === modelFilter;
    const matchesStatus = statusFilter === 'all' || ill.status === statusFilter;
    return matchesSearch && matchesCategory && matchesModel && matchesStatus;
  });

  const handleGenerateIllustration = () => {
    if (!generationPrompt.trim()) return;

    setIsGenerating(true);

    // Simuler la génération
    setTimeout(() => {
      const newIllustration: Illustration = {
        id: `ILL${Date.now()}`,
        title: `Génération du ${new Date().toLocaleDateString('fr-CI')}`,
        description: generationPrompt.substring(0, 100),
        prompt: generationPrompt,
        category: 'Général',
        tags: [],
        imageUrl: `https://picsum.photos/seed/${Date.now()}/1024/768`,
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/300/225`,
        resolution: { width: 1024, height: 768 },
        fileSize: 2048576,
        format: 'PNG',
        model: generationModel,
        version: '1.0',
        seed: Math.random().toString(36).substring(7),
        steps: 50,
        cfg_scale: 7.5,
        sampler: 'DPM++ 2M Karras',
        creator: {
          id: 'admin',
          name: 'Administrateur',
          email: 'admin@mon-toit.ci',
          role: 'admin'
        },
        status: 'completed',
        createdAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        processingTime: 120,
        cost: 0.05,
        downloads: 0,
        likes: 0,
        isPublic: false,
        isPremium: false,
        metadata: {
          nsfw_score: 0.01,
          aesthetic_score: 8.5,
          quality_score: 9.0,
          style: 'generated',
          mood: 'neutral',
          colors: ['#000000', '#FFFFFF']
        },
        feedback: []
      };

      setIllustrations(prev => [newIllustration, ...prev]);
      setIsGenerating(false);
      setGenerationPrompt('');
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palette className="h-8 w-8 text-purple-600" />
            Illustrations IA
          </h1>
          <p className="text-gray-600 mt-1">
            Génération et gestion d'images par intelligence artificielle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Générer une illustration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Générer une illustration IA
                </DialogTitle>
                <DialogDescription>
                  Créez des images uniques avec l'intelligence artificielle
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="prompt">Description de l'image</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Décrivez l'image que vous souhaitez générer en détail..."
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="model">Modèle IA</Label>
                  <Select value={generationModel} onValueChange={setGenerationModel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter(m => m.status === 'active').map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-gray-500">{model.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Largeur</Label>
                    <div className="mt-2 px-3 py-2 border rounded-lg bg-gray-50">1024px</div>
                  </div>
                  <div>
                    <Label>Hauteur</Label>
                    <div className="mt-2 px-3 py-2 border rounded-lg bg-gray-50">768px</div>
                  </div>
                </div>

                <div>
                  <Label>Qualité</Label>
                  <div className="mt-2">
                    <Slider
                      defaultValue={[75]}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Rapide</span>
                      <span>Équilibré</span>
                      <span>Qualité maximale</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Annuler</Button>
                  <Button
                    onClick={handleGenerateIllustration}
                    disabled={!generationPrompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Illustrations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {illustrations.length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Génération</p>
                <p className="text-2xl font-bold text-gray-900">
                  {illustrations.filter(i => i.status === 'generating').length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coût Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${illustrations.reduce((sum, i) => sum + i.cost, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Téléchargements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {illustrations.reduce((sum, i) => sum + i.downloads, 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Download className="h-6 w-6 text-yellow-600" />
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
          <TabsTrigger value="illustrations" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Illustrations
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Modèles IA
          </TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {illustrations.slice(0, 4).map((ill) => (
                    <div key={ill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={ill.thumbnailUrl}
                            alt={ill.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{ill.title}</p>
                          <p className="text-xs text-gray-500">{ill.creator.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ill.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(ill.createdAt).toLocaleDateString('fr-CI')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performances des modèles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performances des Modèles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{model.name}</span>
                        <div className="flex items-center gap-2">
                          {model.status === 'active' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-600">{model.performance.quality}% qualité</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vitesse:</span>
                          <span className="font-medium">{model.performance.speed}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Qualité:</span>
                          <span className="font-medium">{model.performance.quality}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Coût:</span>
                          <span className="font-medium">${model.pricing.cost_per_generation}</span>
                        </div>
                      </div>
                      <Progress value={model.performance.quality} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Catégories populaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Catégories Populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Intérieurs', 'Bureaux', 'Maisons', 'Extérieurs', 'Plans'].map((category, index) => {
                    const count = illustrations.filter(i => i.category === category).length;
                    const percentage = illustrations.length > 0 ? (count / illustrations.length) * 100 : 0;

                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20 h-2" />
                          <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Utilisateurs actifs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Utilisateurs Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(illustrations.map(i => i.creator))).slice(0, 4).map((creator, index) => {
                    const userIllustrations = illustrations.filter(i => i.creator.id === creator.id);

                    return (
                      <div key={creator.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{creator.name}</p>
                            <p className="text-xs text-gray-500">{creator.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{userIllustrations.length}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Illustrations */}
        <TabsContent value="illustrations" className="space-y-6">
          {/* Filtres */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une illustration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Intérieurs">Intérieurs</SelectItem>
                  <SelectItem value="Bureaux">Bureaux</SelectItem>
                  <SelectItem value="Maisons">Maisons</SelectItem>
                  <SelectItem value="Extérieurs">Extérieurs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous modèles</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="generating">Génération</SelectItem>
                  <SelectItem value="queued">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grille/Liste d'illustrations */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredIllustrations.map((ill) => (
                <Card key={ill.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={ill.thumbnailUrl}
                      alt={ill.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusIcon(ill.status)}
                      {ill.isPremium && <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm line-clamp-1 mb-1">{ill.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{ill.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{ill.model}</span>
                      <span>{new Date(ill.createdAt).toLocaleDateString('fr-CI')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="h-3 w-3" />
                        {ill.likes}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Illustration</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Créateur</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Modèle</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Statut</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIllustrations.map((ill) => (
                        <tr key={ill.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={ill.thumbnailUrl}
                                  alt={ill.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-1">{ill.title}</p>
                                <p className="text-xs text-gray-500">{ill.resolution.width}×{ill.resolution.height}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium">{ill.creator.name}</p>
                              <p className="text-xs text-gray-500">{ill.creator.role}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{ill.model}</span>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(ill.status)}
                          </td>
                          <td className="p-4">
                            <span className="text-sm">
                              {new Date(ill.createdAt).toLocaleDateString('fr-CI')}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
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
          )}
        </TabsContent>

        {/* Onglet Tâches */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {/* File d'attente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  File d'Attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generationTasks
                    .filter(task => task.status === 'queued' || task.status === 'processing')
                    .map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className="text-sm font-medium">
                              {task.status === 'processing' ? 'En cours' : 'En attente'}
                            </span>
                          </div>
                          <Badge variant="outline">{task.priority}</Badge>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{task.prompt}</p>

                        {task.status === 'processing' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progression</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}

                        {task.estimatedTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Temps estimé: {task.estimatedTime}s
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Tâches terminées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Tâches Terminées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {illustrations
                    .filter(i => i.status === 'completed')
                    .slice(0, 5)
                    .map((ill) => (
                      <div key={ill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            <img
                              src={ill.thumbnailUrl}
                              alt={ill.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{ill.title}</p>
                            <p className="text-xs text-gray-500">
                              {ill.processingTime}s • ${ill.cost}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques de performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Performance du Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Utilisation GPU</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPU Principal</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPU Secondaire</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Temps de traitement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Moyen</span>
                      <span>2m 15s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Minimum</span>
                      <span>45s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Maximum</span>
                      <span>5m 30s</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Taux de succès</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">94.2%</div>
                    <p className="text-sm text-gray-600 mt-1">2847/3025 générations réussies</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Modèles IA */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    </div>
                    <Badge
                      variant={model.status === 'active' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {model.status === 'active' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {model.status === 'active' ? 'Actif' : 'Maintenance'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Version</p>
                        <p className="font-medium">{model.version}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium">{model.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Coût/génération</p>
                        <p className="font-medium">${model.pricing.cost_per_generation}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Crédits requis</p>
                        <p className="font-medium">{model.pricing.credits_required}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Vitesse</span>
                          <div className="flex items-center gap-2">
                            <Progress value={model.performance.speed} className="w-16 h-2" />
                            <span className="text-xs text-gray-600">{model.performance.speed}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Qualité</span>
                          <div className="flex items-center gap-2">
                            <Progress value={model.performance.quality} className="w-16 h-2" />
                            <span className="text-xs text-gray-600">{model.performance.quality}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Popularité</span>
                          <div className="flex items-center gap-2">
                            <Progress value={model.performance.popularity} className="w-16 h-2" />
                            <span className="text-xs text-gray-600">{model.performance.popularity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Capacités</h4>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Limitations</h4>
                      <div className="flex flex-wrap gap-1">
                        {model.limitations.map((limitation, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {limitation}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Statistiques
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Infrastructure IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Infrastructure IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">GPU NVIDIA A100</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Utilisation</span>
                      <span>78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mémoire VRAM</span>
                      <span>32GB / 40GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Température</span>
                      <span>72°C</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Stockage SSD NVMe</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Espace utilisé</span>
                      <span>2.4TB / 4TB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vitesse lecture</span>
                      <span>3,500 MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vitesse écriture</span>
                      <span>2,800 MB/s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Cloud Backup</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Dernière sauvegarde</span>
                      <span>Il y a 2h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Données sync</span>
                      <span>98.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statut</span>
                      <span className="text-green-600">Connecté</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminIllustrationsPage;