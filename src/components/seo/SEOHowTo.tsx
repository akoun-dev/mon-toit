import { Helmet } from 'react-helmet-async';
import { BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  tool?: string[];
  totalTime?: string;
  supply?: string[];
}

interface SEOHowToProps {
  title: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  estimatedCost?: {
    currency: string;
    value: string;
  };
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  image?: string;
}

const SEOHowTo: React.FC<SEOHowToProps> = ({
  title,
  description,
  steps,
  totalTime,
  estimatedCost,
  difficulty = 'Beginner',
  category,
  image
}) => {
  const siteUrl = window.location.origin;

  // Generate structured data for Google
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": title,
      "description": description,
      "image": image ? `${siteUrl}${image}` : `${siteUrl}/icons/icon-512x512.png`,
      "totalTime": totalTime,
      "estimatedCost": estimatedCost,
      "supply": steps.flatMap(step => step.supply || []),
      "tool": steps.flatMap(step => step.tool || []),
      "step": steps.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": step.name,
        "text": step.text,
        "image": step.image ? `${siteUrl}${step.image}` : undefined,
        "tool": step.tool?.map(tool => ({
          "@type": "HowToTool",
          "name": tool
        })),
        "totalTime": step.totalTime
      }))
    };

    return structuredData;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'Beginner':
        return <CheckCircle className="h-4 w-4" />;
      case 'Intermediate':
        return <AlertCircle className="h-4 w-4" />;
      case 'Advanced':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {category && (
              <Badge variant="secondary">{category}</Badge>
            )}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {getDifficultyIcon(difficulty)}
              {difficulty}
            </div>
            {totalTime && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {totalTime}
              </div>
            )}
            {estimatedCost && (
              <Badge variant="outline">
                {estimatedCost.value} {estimatedCost.currency}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Image */}
        {image && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Étapes à suivre</h2>

          <div className="grid gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{step.name}</CardTitle>
                      {step.totalTime && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {step.totalTime}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {step.image && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={step.image}
                        alt={`Étape ${index + 1}: ${step.name}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: step.text }}
                  />

                  {/* Tools */}
                  {step.tool && step.tool.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Outils nécessaires:</h4>
                      <div className="flex flex-wrap gap-2">
                        {step.tool.map((tool, toolIndex) => (
                          <Badge key={toolIndex} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supplies */}
                  {step.supply && step.supply.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Fournitures:</h4>
                      <div className="flex flex-wrap gap-2">
                        {step.supply.map((supply, supplyIndex) => (
                          <Badge key={supplyIndex} variant="secondary" className="text-xs">
                            {supply}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold mb-2">Prêt à commencer ?</h3>
            <p className="text-muted-foreground mb-4">
              Suivez ces étapes pour {title.toLowerCase()} en toute confiance.
            </p>
            <Button size="lg" className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
              Commencer maintenant
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SEOHowTo;