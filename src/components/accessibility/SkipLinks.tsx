import { useEffect, useState } from 'react';
import { Keyboard, MousePointer } from 'lucide-react';

interface SkipLink {
  id: string;
  label: string;
  target: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  showOnFocus?: boolean;
}

const SkipLinks: React.FC<SkipLinksProps> = ({
  links = [
    { id: 'skip-to-main', label: 'Aller au contenu principal', target: 'main-content' },
    { id: 'skip-to-nav', label: 'Aller à la navigation', target: 'main-navigation' },
    { id: 'skip-to-search', label: 'Aller à la recherche', target: 'search-form' },
    { id: 'skip-to-footer', label: 'Aller au pied de page', target: 'footer-content' }
  ],
  showOnFocus = true
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show skip links when Tab key is pressed
      if (event.key === 'Tab') {
        setIsVisible(true);
      }
    };

    const handleMouseDown = () => {
      // Hide when mouse is used (keyboard user indicator)
      setIsVisible(false);
    };

    const handleFocusIn = (event: FocusEvent) => {
      // Check if focus is coming from keyboard navigation
      if (event.relatedTarget === null) {
        setIsVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  const handleSkipLinkClick = (targetId: string) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsVisible(false);
  };

  if (!showOnFocus && !isVisible) {
    return null;
  }

  return (
    <>
      {/* Keyboard navigation indicator */}
      {isVisible && (
        <div
          className="fixed top-2 right-2 z-50 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Keyboard className="h-3 w-3" />
          Navigation au clavier
        </div>
      )}

      {/* Skip links */}
      <div
        className={`
          fixed top-0 left-0 z-50 flex flex-col gap-1 p-2
          transition-all duration-200 ease-in-out
          ${isVisible || !showOnFocus
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
          }
        `}
        role="navigation"
        aria-label="Liens de navigation rapide"
      >
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => handleSkipLinkClick(link.target)}
            className={`
              flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground
              rounded-md text-sm font-medium
              hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              transition-colors
              ${isVisible || !showOnFocus ? 'pointer-events-auto' : 'pointer-events-none'}
            `}
            aria-label={`Aller à ${link.label}`}
          >
            <span>{link.label}</span>
          </button>
        ))}
      </div>

      {/* Announcement for screen readers */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isVisible && 'Navigation au clavier activée. Utilisez les liens rapides pour accéder aux sections principales.'}
      </div>
    </>
  );
};

export default SkipLinks;