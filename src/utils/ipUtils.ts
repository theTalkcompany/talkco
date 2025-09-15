/**
 * IP Address and geolocation utilities for security monitoring
 */

interface IPInfo {
  ip: string | null;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Get client IP address using multiple methods
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Try multiple IP detection services
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://ip-api.com/json/'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { 
          timeout: 3000,
          signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();
        
        // Different services return IP in different fields
        const ip = data.ip || data.query || null;
        if (ip && isValidIP(ip)) {
          return ip;
        }
      } catch (error) {
        console.warn(`Failed to get IP from ${service}:`, error);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return null;
  }
};

/**
 * Get comprehensive IP information including geolocation
 */
export const getIPInfo = async (): Promise<IPInfo> => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      const ip = await getClientIP();
      return { ip };
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip || null,
      location: {
        country: data.country_name || undefined,
        region: data.region || undefined,
        city: data.city || undefined
      }
    };
  } catch (error) {
    console.error('Failed to get IP info:', error);
    const ip = await getClientIP();
    return { ip };
  }
};

/**
 * Validate IP address format
 */
const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Enhanced rate limiter with IP-based tracking
 */
export const createIPRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts: Map<string, { count: number; resetTime: number }> = new Map();

  return async (identifier: string): Promise<boolean> => {
    const now = Date.now();
    const ipInfo = await getClientIP();
    const key = ipInfo ? `${identifier}_${ipInfo}` : identifier;
    
    const record = attempts.get(key);
    
    if (!record || now > record.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  };
};