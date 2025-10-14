import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle } from 'lucide-react';

export const CompactSearchHero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explorer');
    }
  };

  return (
    <section className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-b border-border">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          {/* Search Input */}
          <div className="flex-1 w-full md:max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par ville, type de bien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-base border-2 focus:border-primary"
                aria-label="Champ de recherche de biens immobiliers"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={handleSearch}
              size="lg"
              className="flex-1 md:flex-none h-12 font-semibold shadow-md"
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="flex-1 md:flex-none h-12 font-semibold shadow-md"
            >
              <a href="/publier">
                <PlusCircle className="h-4 w-4 mr-2" />
                Publier
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
