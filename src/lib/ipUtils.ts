/**
 * Utilitaires pour la gestion des IPs et fingerprints
 * Utilisé pour le rate limiting et la protection DDoS
 */

/**
 * Récupère l'IP du client via un service externe
 * Fallback sur '0.0.0.0' en cas d'échec
 */
import { logger } from '@/services/logger';

export const getClientIP = async (): Promise<string> => {
  // Pour le développement local, retourner directement une IP locale
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '127.0.0.1';
  }

  // Services de détection d'IP multiples avec fallback
  const ipServices = [
    { name: 'ipify', url: 'https://api.ipify.org?format=json', key: 'ip' },
    { name: 'ip-api', url: 'https://ipapi.co/json/', key: 'ip' },
    { name: 'jsonip', url: 'https://jsonip.com/', key: 'ip' },
    { name: 'ipgeolocation', url: 'https://api.ipgeolocation.io/ipjson', key: 'ip' }
  ];

  for (const service of ipServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const ip = data[service.key];

      if (ip && typeof ip === 'string' && ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        logger.logInfo('IP detected successfully', {
          context: 'ipUtils',
          service: service.name,
          ip: ip.substring(0, ip.lastIndexOf('.')) + '.***' // Masquer l'IP complète dans les logs
        });
        return ip;
      }
    } catch (error) {
      logger.logWarning(`IP service ${service.name} failed`, {
        context: 'ipUtils',
        service: service.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      continue;
    }
  }

  // Fallback ultime pour le développement
  if (import.meta.env.DEV) {
    return '127.0.0.1';
  }

  logger.logError('All IP detection services failed', {
    context: 'ipUtils',
    action: 'getClientIP'
  });
  return '0.0.0.0';
};

/**
 * Génère un fingerprint unique basé sur les caractéristiques du navigateur
 * Utilisé pour identifier les tentatives de connexion suspectes
 */
export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unknown';
  
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Fingerprint', 2, 2);
  
  const canvasHash = canvas.toDataURL().slice(-50);
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvasHash,
  };
  
  return btoa(JSON.stringify(fingerprint)).slice(0, 64);
};

/**
 * Formate un timestamp pour affichage du temps restant
 */
export const formatRetryAfter = (retryAfter: string): string => {
  const diff = new Date(retryAfter).getTime() - Date.now();
  if (diff <= 0) return 'maintenant';
  
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} heure${hours > 1 ? 's' : ''}`;
};
