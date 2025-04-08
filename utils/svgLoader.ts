// src/utils/svgLoader.ts
import * as FileSystem from 'react-native-fs';
import { Platform } from 'react-native';
import { decode as base64Decode } from 'base-64';
import { decode as utf8Decode } from 'utf8';

/**
 * Загружает SVG файл из ресурсов приложения
 */
export const loadSvgFile = async (assetPath: string): Promise<string> => {
  console.log(`svgLoader: Загрузка файла из пути: ${assetPath}`);
  
  try {
    if (Platform.OS === 'web') {
      // Для веб-версии используем fetch
      console.log('svgLoader: Загрузка для веб-платформы');
      const response = await fetch(assetPath);
      return await response.text();
    } else if (Platform.OS === 'android') {
      // Для Android используем специальный метод чтения из ассетов
      try {
        console.log('svgLoader: Загрузка для Android');
        // Путь для Android должен быть без префикса file:///android_asset/
        const androidPath = assetPath.replace('file:///android_asset/', '');
        console.log(`svgLoader: Преобразованный путь для Android: ${androidPath}`);
        
        // Используем обычное чтение файла вместо base64
        const content = await FileSystem.readFileAssets(androidPath, 'utf8');
        
        console.log(`svgLoader: Успешно загружен файл размером ${content.length} байт`);
        return content;
      } catch (assetError) {
        console.log(`svgLoader: Не удалось прочитать файл из ассетов: ${assetPath}`, assetError);
        throw assetError;
      }
    } else if (Platform.OS === 'ios') {
      // Для iOS используем путь в бандле
      try {
        console.log('svgLoader: Загрузка для iOS');
        
        // Используем обычное чтение файла вместо base64
        const fileContents = await FileSystem.readFile(assetPath, 'utf8');
        
        console.log(`svgLoader: Успешно загружен файл размером ${fileContents.length} байт`);
        return fileContents;
      } catch (iosError) {
        console.log(`svgLoader: Не удалось прочитать файл для iOS: ${assetPath}`, iosError);
        throw iosError;
      }
    }
    
    throw new Error(`Неподдерживаемая платформа: ${Platform.OS}`);
  } catch (error) {
    console.error('svgLoader: Ошибка при загрузке SVG файла:', error);
    throw error;
  }
};

/**
 * Преобразует имя этажа в путь к файлу SVG
 */
export const getFloorSvgPath = (tower: string, floor: string): string => {
  // Преобразуем названия башен в соответствующие пути к файлам
  const towerName = tower.toLowerCase() === 'северная' ? 'north' : 'south';
  
  // Для Android используем папку assets
  if (Platform.OS === 'android') {
    return `floors/${towerName}-${floor}.svg`;
  }
  
  // Для iOS используем папку в бандле
  if (Platform.OS === 'ios') {
    return `${FileSystem.MainBundlePath}/floors/${towerName}-${floor}.svg`;
  }
  
  // Для веб-версии
  return `assets/floors/${towerName}-${floor}.svg`;
};

/**
 * Извлекает размеры из SVG-строки
 */
export const extractSvgDimensions = (svgContent: string): { width: number, height: number } => {
  console.log('svgLoader: Извлечение размеров из SVG');
  
  try {
    // Пытаемся извлечь width и height из тега svg
    const widthMatch = svgContent.match(/width="([^"]+)"/);
    const heightMatch = svgContent.match(/height="([^"]+)"/);
    
    // Пытаемся извлечь размеры из viewBox
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    
    if (widthMatch && heightMatch) {
      // Удаляем единицы измерения, если они есть (px, mm и т.д.)
      const width = parseFloat(widthMatch[1].replace(/[^0-9.]/g, ''));
      const height = parseFloat(heightMatch[1].replace(/[^0-9.]/g, ''));
      
      console.log(`svgLoader: Извлечены размеры из атрибутов: ${width}x${height}`);
      return { width, height };
    } else if (viewBoxMatch) {
      // Формат viewBox: "x y width height"
      const viewBoxValues = viewBoxMatch[1].split(/\s+/);
      if (viewBoxValues.length === 4) {
        const width = parseFloat(viewBoxValues[2]);
        const height = parseFloat(viewBoxValues[3]);
        
        console.log(`svgLoader: Извлечены размеры из viewBox: ${width}x${height}`);
        return { width, height };
      }
    }
    
    // Возвращаем значения по умолчанию, если не удалось извлечь
    console.log('svgLoader: Не удалось извлечь размеры, используются значения по умолчанию: 1200x800');
    return { width: 1200, height: 800 };
  } catch (error) {
    console.error('svgLoader: Ошибка при извлечении размеров:', error);
    return { width: 1200, height: 800 };
  }
};

/**
 * Оптимизирует SVG для лучшей производительности
 */
export const optimizeSvg = (svgContent: string): string => {
  console.log('svgLoader: Оптимизация SVG');
  
  try {
    // Исходный размер
    const originalSize = svgContent.length;
    
    // Удаляем комментарии
    let optimized = svgContent.replace(/<!--[\s\S]*?-->/g, '');
    
    // Удаляем лишние пробелы между тегами
    optimized = optimized.replace(/>\s+</g, '><');
    
    // Заменяем множественные пробелы одним
    optimized = optimized.replace(/\s{2,}/g, ' ');
    
    // Удаляем метаданные
    optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/g, '');
    
    // Удаляем ненужные атрибуты для повышения производительности
    const unnecessaryAttributes = [
      'data-name',
      'xmlns:xlink',
      'xml:space',
      'enable-background',
      'xmlns:serif',
      'serif:id'
    ];
    
    for (const attr of unnecessaryAttributes) {
      const attrRegex = new RegExp(`\\s${attr}="[^"]*"`, 'g');
      optimized = optimized.replace(attrRegex, '');
    }
    
    // Удаляем пустые группы
    optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, '');
    
    // Новый размер
    const newSize = optimized.length;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);
    
    console.log(`svgLoader: Оптимизация SVG завершена. Размер уменьшен на ${reduction}% (${originalSize} -> ${newSize} байт)`);
    
    return optimized;
  } catch (error) {
    console.error('svgLoader: Ошибка при оптимизации SVG:', error);
    return svgContent; // Возвращаем исходный контент в случае ошибки
  }
};

/**
 * Функция для декодирования base64 в строку
 * Используется вместо Buffer.from, которого нет в React Native
 */
const decodeBase64ToString = (base64String: string): string => {
  try {
    // Декодируем base64 в UTF-8 строку
    const decoded = base64Decode(base64String);
    return utf8Decode(decoded);
  } catch (error) {
    console.error('svgLoader: Ошибка при декодировании base64:', error);
    throw error;
  }
};

export const loadFloorSvg = async (tower: string, floor: string): Promise<string> => {
  console.log(`svgLoader: Загрузка плана этажа: ${tower} ${floor}`);
  
  try {
    const svgPath = getFloorSvgPath(tower, floor);
    console.log(`svgLoader: Путь к файлу SVG: ${svgPath}`);
    
    let svgContent = '';
    
    if (Platform.OS === 'android') {
      // Для Android используем readFileAssets
      const androidPath = svgPath.replace('file:///android_asset/', '');
      
      // Проверяем существование файла перед загрузкой
      try {
        const exists = await FileSystem.exists(`${FileSystem.DocumentDirectoryPath}/${androidPath}`);
        if (!exists) {
          console.log(`svgLoader: Файл не найден в DocumentDirectoryPath, пробуем загрузить из ассетов`);
        }
      } catch (error) {
        console.log('svgLoader: Ошибка при проверке существования файла:', error);
      }
      
      try {
        // Для больших файлов используем base64, но с нашей функцией декодирования
        const base64Content = await FileSystem.readFileAssets(androidPath, 'base64');
        svgContent = decodeBase64ToString(base64Content);
      } catch (error) {
        console.log('svgLoader: Ошибка при чтении файла в base64, пробуем обычное чтение:', error);
        svgContent = await FileSystem.readFileAssets(androidPath, 'utf8');
      }
    } else {
      // Для других платформ используем обычный метод
      svgContent = await loadSvgFile(svgPath);
    }
    
    console.log(`svgLoader: SVG загружен, размер: ${svgContent.length} байт`);
    
    // Проверка на большой размер файла
    if (svgContent.length > 2000000) { // 2MB
      console.warn(`svgLoader: Большой SVG файл (${svgContent.length} байт), выполняем оптимизацию`);
      svgContent = optimizeSvg(svgContent);
    }
    
    // Извлекаем размеры SVG
    const { width, height } = extractSvgDimensions(svgContent);
    console.log(`svgLoader: Размеры SVG: ${width}x${height}`);
    
    // Проверяем и добавляем необходимые атрибуты в SVG
    if (!svgContent.includes('viewBox')) {
      // Добавляем viewBox для лучшего отображения
      svgContent = svgContent.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      console.log('svgLoader: Добавлен атрибут viewBox');
    }
    
    // Добавляем preserveAspectRatio для правильного масштабирования
    if (!svgContent.includes('preserveAspectRatio')) {
      svgContent = svgContent.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
      console.log('svgLoader: Добавлен атрибут preserveAspectRatio');
    }
    
    return svgContent;
  } catch (error) {
    console.error(`svgLoader: Не удалось загрузить SVG для этажа ${tower} ${floor}:`, error);
    
    // Возвращаем заглушку SVG в случае ошибки
    return `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-size="24" text-anchor="middle">План этажа ${tower} ${floor}</text>
        <text x="50%" y="50%" dy="30" font-size="18" text-anchor="middle" fill="red">Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}</text>
      </svg>
    `;
  }
};