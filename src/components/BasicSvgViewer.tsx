// src/components/BasicSvgViewer.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Dimensions, Text, ActivityIndicator, LogBox, InteractionManager } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

// Игнорируем предупреждения о больших вложенных представлениях
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

interface BasicSvgViewerProps {
  svgXml: string;
  width: number;
  height: number;
}

// Максимальный размер SVG для рендеринга без оптимизации (2MB)
const MAX_SVG_SIZE_WITHOUT_OPTIMIZATION = 2000000;

// Максимальный размер SVG для рендеринга с оптимизацией (10MB)
const MAX_SVG_SIZE = 10000000;

const BasicSvgViewer: React.FC<BasicSvgViewerProps> = ({ svgXml, width, height }) => {
  console.log('BasicSvgViewer: Начало рендеринга');
  
  // Получаем размеры экрана
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height - 160;
  
  // Состояния для обработки ошибок и загрузки
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedSvg, setProcessedSvg] = useState<string | null>(null);
  
  // Извлекаем реальные размеры из SVG, если они есть
  const [svgDimensions, setSvgDimensions] = useState({ width, height });
  
  // Используем useRef для отслеживания монтирования компонента
  const isMounted = useRef(true);
  
  // Устанавливаем начальный масштаб значительно больше (2.5 вместо 0.95)
  // Это ключевое изменение для более близкого отображения плана этажа
  const initialZoom = useMemo(() => {
    // Устанавливаем фиксированный масштаб 2.5 для более близкого отображения
    return 0.65;
    // Старый код для справки:
    // return Math.min(screenWidth / svgDimensions.width, screenHeight / svgDimensions.height) * 0.95;
  }, []);
  
  console.log(`BasicSvgViewer: Экран=${screenWidth}x${screenHeight}, SVG=${svgDimensions.width}x${svgDimensions.height}, Начальный масштаб=${initialZoom}`);
  
  useEffect(() => {
    // Очистка при размонтировании
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Функция для оптимизации SVG
  const optimizeSvg = (svg: string): string => {
    console.log('BasicSvgViewer: Начало оптимизации SVG');
    
    try {
      const originalSize = svg.length;
      
      // Удаляем комментарии
      let optimized = svg.replace(/<!--[\s\S]*?-->/g, '');
      
      // Удаляем лишние пробелы между тегами
      optimized = optimized.replace(/>\s+</g, '><');
      
      // Заменяем множественные пробелы одним
      optimized = optimized.replace(/\s{2,}/g, ' ');
      
      // Удаляем метаданные, если они есть
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
      
      console.log(`BasicSvgViewer: Оптимизация SVG завершена. Размер уменьшен на ${reduction}% (${originalSize} -> ${newSize} байт)`);
      
      return optimized;
    } catch (error) {
      console.error('BasicSvgViewer: Ошибка при оптимизации SVG:', error);
      return svg; // Возвращаем исходный контент в случае ошибки
    }
  };
  
  // Функция для проверки и обработки SVG
  const processSvg = async (svg: string): Promise<string> => {
    // Проверка на пустой SVG
    if (!svg || svg.trim() === '') {
      throw new Error('Пустой SVG контент');
    }
    
    // Проверка размера SVG
    if (svg.length > MAX_SVG_SIZE) {
      throw new Error(`SVG слишком большой (${svg.length} байт). Максимальный размер: ${MAX_SVG_SIZE} байт`);
    }
    
    // Оптимизируем большие SVG
    let processedSvg = svg;
    if (svg.length > MAX_SVG_SIZE_WITHOUT_OPTIMIZATION) {
      processedSvg = optimizeSvg(svg);
    }
    
    // Пытаемся извлечь размеры из SVG
    const widthMatch = processedSvg.match(/width="([^"]+)"/);
    const heightMatch = processedSvg.match(/height="([^"]+)"/);
    const viewBoxMatch = processedSvg.match(/viewBox="([^"]+)"/);
    
    let extractedWidth = width;
    let extractedHeight = height;
    
    if (widthMatch && heightMatch) {
      extractedWidth = parseFloat(widthMatch[1].replace(/[^0-9.]/g, ''));
      extractedHeight = parseFloat(heightMatch[1].replace(/[^0-9.]/g, ''));
      console.log(`BasicSvgViewer: Извлечены размеры из атрибутов width/height: ${extractedWidth}x${extractedHeight}`);
    } else if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(/\s+/);
      if (viewBoxValues.length === 4) {
        extractedWidth = parseFloat(viewBoxValues[2]);
        extractedHeight = parseFloat(viewBoxValues[3]);
        console.log(`BasicSvgViewer: Извлечены размеры из viewBox: ${extractedWidth}x${extractedHeight}`);
      }
    }
    
    // Проверка на корректные размеры
    if (extractedWidth <= 0 || extractedHeight <= 0) {
      console.warn('BasicSvgViewer: Некорректные размеры SVG, используем значения по умолчанию');
      extractedWidth = 1200;
      extractedHeight = 800;
    }
    
    if (isMounted.current) {
      setSvgDimensions({ width: extractedWidth, height: extractedHeight });
    }
    
    // Добавляем viewBox, если его нет
    if (!processedSvg.includes('viewBox')) {
      processedSvg = processedSvg.replace('<svg', `<svg viewBox="0 0 ${extractedWidth} ${extractedHeight}"`);
      console.log('BasicSvgViewer: Добавлен атрибут viewBox');
    }
    
    // Добавляем preserveAspectRatio для правильного масштабирования
    if (!processedSvg.includes('preserveAspectRatio')) {
      processedSvg = processedSvg.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
      console.log('BasicSvgViewer: Добавлен атрибут preserveAspectRatio');
    }
    
    return processedSvg;
  };
  
  useEffect(() => {
    console.log('BasicSvgViewer: Начало обработки SVG');
    setIsLoading(true);
    setError(null);
    
    // Используем InteractionManager для отложенного выполнения тяжелых операций
    // после завершения всех анимаций и взаимодействий с пользователем
    InteractionManager.runAfterInteractions(() => {
      // Создаем асинхронную функцию для обработки SVG
      const handleSvg = async () => {
        try {
          const processed = await processSvg(svgXml);
          
          if (isMounted.current) {
            console.log('BasicSvgViewer: SVG успешно обработан');
            setProcessedSvg(processed);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('BasicSvgViewer: Ошибка при обработке SVG:', err);
          if (isMounted.current) {
            setError(`Ошибка при обработке SVG: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
            setIsLoading(false);
          }
        }
      };
      
      // Запускаем обработку
      handleSvg();
    });
    
    // Очистка при изменении пропсов
    return () => {
      // Если компонент размонтирован во время обработки, 
      // мы не будем обновлять состояние
    };
  }, [svgXml, width, height]);
  
  // Показываем индикатор загрузки
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Обработка SVG...</Text>
      </View>
    );
  }
  
  // Показываем ошибку, если она есть
  if (error || !processedSvg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Не удалось обработать SVG'}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        maxZoom={5}
        minZoom={0.05} // Уменьшаем минимальный зум для больших SVG
        zoomStep={0.5}
        initialZoom={initialZoom} // Используем наш увеличенный масштаб
        bindToBorders={false}
        contentWidth={svgDimensions.width}
        contentHeight={svgDimensions.height}
        style={styles.zoomContainer}
        doubleTapZoomToCenter={true}
        movementSensibility={1.5}
        visualTouchFeedbackEnabled={true}
        onZoomAfter={(_, __, zoomableViewEventObject) => {
          if (zoomableViewEventObject && typeof zoomableViewEventObject.zoomLevel === 'number') {
            console.log(`BasicSvgViewer: Новый масштаб: ${zoomableViewEventObject.zoomLevel}`);
          }
        }}
      >
        <SvgXml
          xml={processedSvg}
          width={svgDimensions.width}
          height={svgDimensions.height}
          preserveAspectRatio="xMidYMid meet"
        />
      </ReactNativeZoomableView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  }
});

export default BasicSvgViewer;