import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, MapPin, Home, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';

interface HeaderSearchProps {
  className?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  compact?: boolean;
}

export const HeaderSearch = ({
  className,
  placeholder = "Rechercher un bien, une ville, un quartier...",
  showSuggestions = true,
  compact = false
}: HeaderSearchProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(inputValue, 300);

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Rechercher des biens
  useEffect(() => {
    if (debouncedValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const searchProperties = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .or(`title.ilike.%${debouncedValue}%,city.ilike.%${debouncedValue}%,neighborhood.ilike.%${debouncedValue}%,description.ilike.%${debouncedValue}%`)
          .eq('status', 'available')
          .limit(isMobile ? 5 : 8)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    searchProperties();
  }, [debouncedValue, isMobile]);

  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || inputValue;
    if (!term.trim()) return;

    // Sauvegarder la recherche
    const newRecentSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    // Naviguer vers la page de recherche
    navigate(`/explorer?q=${encodeURIComponent(term)}`);
    setOpen(false);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  if (isMobile && compact) {
    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={compact ? "Rechercher..." : placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            className="pl-9 pr-8 h-9 text-sm"
          />
          {inputValue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearInput}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Résultats mobiles en overlay */}
        {open && (inputValue.length >= 2 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {!loading && inputValue.length >= 2 && suggestions.length === 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  Suggestions
                </div>
                {suggestions.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => {
                      navigate(`/property/${property.id}`);
                      setOpen(false);
                      setInputValue('');
                    }}
                    className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="font-medium text-sm truncate">{property.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{property.city}, {property.neighborhood}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatPrice(property.monthly_rent)} FCFA/mois</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!inputValue && recentSearches.length > 0 && (
              <div className="p-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  Recherches récentes
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span>{search}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-8"
        />
        {inputValue && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearInput}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results dropdown for desktop */}
      {open && showSuggestions && (inputValue.length >= 2 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {!loading && inputValue.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun bien trouvé pour "{inputValue}"
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Biens disponibles
              </div>
              {suggestions.map((property) => (
                <button
                  key={property.id}
                  onClick={() => {
                    navigate(`/property/${property.id}`);
                    setOpen(false);
                    setInputValue('');
                  }}
                  className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-primary">
                        {property.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.city}, {property.neighborhood}</span>
                      </div>
                      {property.property_type && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Home className="h-3 w-3" />
                          <span>{property.property_type}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {formatPrice(property.monthly_rent)} FCFA
                      </div>
                      <div className="text-xs text-muted-foreground">/mois</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!inputValue && recentSearches.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Recherches récentes
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>{search}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {inputValue && (
            <div className="p-2 border-t">
              <Button
                onClick={() => handleSearch()}
                className="w-full"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher "{inputValue}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};