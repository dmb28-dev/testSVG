// src/hooks/useSvgCache.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'react-native-fs';

interface SvgCache {
  timestamp: number;
  data: string;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 часа
const CACHE_PREFIX = 'svg_cache_';

export const useSvgCache = (svgKey: string, svgComponent: any) => {
  const [cachedSvg, setCachedSvg] = useState<string | null>(null);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_PREFIX + svgKey);
        if (cached) {
          const parsedCache: SvgCache = JSON.parse(cached);
          if (Date.now() - parsedCache.timestamp < CACHE_EXPIRY) {
            setCachedSvg(parsedCache.data);
            return;
          }
        }
        
        // Если кэш устарел или отсутствует, сохраняем новый
        const svgData = JSON.stringify(svgComponent);
        const newCache: SvgCache = {
          timestamp: Date.now(),
          data: svgData,
        };
        await AsyncStorage.setItem(CACHE_PREFIX + svgKey, JSON.stringify(newCache));
        setCachedSvg(svgData);
      } catch (error) {
        console.error('Error caching SVG:', error);
      }
    };

    loadCache();
  }, [svgKey]);

  return cachedSvg;
};
