// src/components/FloorPlan.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, InteractionManager } from 'react-native';
import { getOccupiedPlaces } from '../services/userService';
import BasicSvgViewer from './BasicSvgViewer';

interface FloorPlanProps {
  floorSvg: string; // XML строка SVG плана этажа
  floorNumber: string;
  tower: string;
  width: number;
  height: number;
}

// Максимальное количество мест для обработки за один раз
const BATCH_SIZE = 10;

const FloorPlan: React.FC<FloorPlanProps> = ({
  floorSvg,
  floorNumber,
  tower,
  width,
  height,
}) => {
  const [processedSvg, setProcessedSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const occupiedPlacesRef = useRef<string[]>([]);
  
  // Используем useRef для отслеживания монтирования компонента
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('FloorPlan: Компонент смонтирован');
    // Очистка при размонтировании
    return () => {
      console.log('FloorPlan: Компонент размонтирован');
      isMounted.current = false;
    };
  }, []);

  // Функция для поиска элемента места в SVG по номеру места
	const findPlaceElementByNumber = (svg: string, placeNumber: string): string | null => {
		console.log(`FloorPlan: Поиск элемента для места ${placeNumber} в SVG по тексту`);
		
		// Ищем текстовый элемент с номером места
		const tspanRegex = new RegExp(`<tspan[^>]*>\\s*(${placeNumber})\\s*</tspan>`, 'i');
		const tspanMatch = svg.match(tspanRegex);
		
		if (!tspanMatch) {
			console.log(`FloorPlan: Текстовый элемент с номером ${placeNumber} не найден`);
			return null;
		}
		
		console.log(`FloorPlan: Найден текстовый элемент с номером ${placeNumber}: ${tspanMatch[0]}`);
		
		// Находим позицию текстового элемента в SVG
		const tspanPos = svg.indexOf(tspanMatch[0]);
		if (tspanPos === -1) {
			console.log(`FloorPlan: Не удалось определить позицию текстового элемента`);
			return null;
		}
		
		// Берем часть SVG до текстового элемента
		const svgBeforeText = svg.substring(0, tspanPos);
		
		// Ищем ближайший родительский элемент <text> перед этим tspan
		const textElementRegex = /<text[^>]*id="Number_(\d+)"[^>]*>[^<]*$/;
		const textMatch = svgBeforeText.match(textElementRegex);
		
		if (textMatch && textMatch[1]) {
			const placeId = textMatch[1];
			console.log(`FloorPlan: Найден элемент Number_${placeId} для места ${placeNumber}`);
			
			// Ищем соответствующий элемент Place_X
			const placeRegex = new RegExp(`<g id="Place_(${placeId})"[^>]*>`, 'g');
			const placeMatches = [...svg.matchAll(placeRegex)];
			
			if (placeMatches.length > 0) {
				console.log(`FloorPlan: Найден родительский элемент с ID "Place_${placeId}" для места ${placeNumber}`);
				return `Place_${placeId}`;
			}
		}
		
		// Если не нашли через id Number_X, попробуем найти через поиск вверх по дереву
		// Ищем все элементы Place_X в SVG
		const allPlaceRegex = /<g id="(Place_\d+)"[^>]*>[\s\S]*?<tspan[^>]*>\s*${placeNumber}\s*<\/tspan>/g;
		const allPlaceMatches = [...svg.matchAll(allPlaceRegex)];
		
		if (allPlaceMatches.length > 0) {
			const placeId = allPlaceMatches[0][1];
			console.log(`FloorPlan: Найден родительский элемент с ID "${placeId}" для места ${placeNumber}`);
			return placeId;
		}
		
		console.log(`FloorPlan: Не удалось найти родительский элемент для места ${placeNumber}`);
		return null;
	};

  // Функция для обработки мест порциями
  const processPlacesInBatches = (svg: string, places: string[]): string => {
    console.log(`FloorPlan: Начало обработки ${places.length} мест порциями по ${BATCH_SIZE}`);
    console.log(`FloorPlan: Размер исходного SVG: ${svg.length} байт`);
    
    let modifiedSvg = svg;
    let placesFound = 0;
    let placesNotFound = 0;
    
    // Обрабатываем места порциями для предотвращения зависания UI
    for (let i = 0; i < places.length; i += BATCH_SIZE) {
      const batch = places.slice(i, i + BATCH_SIZE);
      console.log(`FloorPlan: Обработка порции ${i / BATCH_SIZE + 1} из ${Math.ceil(places.length / BATCH_SIZE)}`);
      console.log(`FloorPlan: Места в текущей порции: ${JSON.stringify(batch)}`);
      
      for (const place of batch) {
        // Убедимся, что место - это строка
        const placeId = place.toString();
        console.log(`FloorPlan: Обработка места с ID: ${placeId}`);
        
        // Ищем элемент места в SVG по номеру места
        const placeElementId = findPlaceElementByNumber(modifiedSvg, placeId);
        
        if (placeElementId) {
          placesFound++;
          console.log(`FloorPlan: Место ${placeId} найдено в SVG как ${placeElementId}, выполняется закрашивание`);
          
          // Ищем элемент с найденным ID
          const placeRegex = new RegExp(`<g\\s+id="${placeElementId}"[^>]*>([\\s\\S]*?)<\\/g>`, 'g');
          
          // Проверяем, найдено ли место в SVG
          const matchCount = (modifiedSvg.match(placeRegex) || []).length;
          console.log(`FloorPlan: Найдено совпадений для ${placeElementId}: ${matchCount}`);
          
          if (matchCount > 0) {
            // Заменяем fill в rect на синий цвет
            modifiedSvg = modifiedSvg.replace(placeRegex, (match) => {
              console.log(`FloorPlan: Заменяем атрибуты fill и fill-opacity для места ${placeElementId}`);
              
              // Ищем прямоугольник внутри группы
              const rectRegex = /<rect[^>]*>/;
              const rectMatch = match.match(rectRegex);
              
              if (rectMatch) {
                // Заменяем атрибуты fill и fill-opacity в прямоугольнике
                const updatedRect = rectMatch[0]
                  .replace(/fill="[^"]*"/, 'fill="#007AFF"')
                  .replace(/fill-opacity="[^"]*"/, 'fill-opacity="0.3"');
                
                // Если атрибуты не были заменены (не существовали), добавляем их
                const finalRect = !updatedRect.includes('fill="#007AFF"') 
                  ? updatedRect.replace(/>$/, ' fill="#007AFF">') 
                  : updatedRect;
                
                const finalRectWithOpacity = !finalRect.includes('fill-opacity="0.3"') 
                  ? finalRect.replace(/>$/, ' fill-opacity="0.3">') 
                  : finalRect;
                
                return match.replace(rectRegex, finalRectWithOpacity);
              } else {
                // Если прямоугольник не найден, добавляем атрибуты к группе
                return match.replace(
                  /<g\s+id="[^"]*"/,
                  `$& fill="#007AFF" fill-opacity="0.3"`
                );
              }
            });
          }
        } else {
          placesNotFound++;
          console.log(`FloorPlan: Место ${placeId} не найдено в SVG`);
        }
      }
    }
    
    console.log(`FloorPlan: Найдено и выделено ${placesFound} из ${places.length} мест`);
    console.log(`FloorPlan: Не найдено ${placesNotFound} мест`);
    console.log(`FloorPlan: Размер модифицированного SVG: ${modifiedSvg.length} байт`);
    
    return modifiedSvg;
  };

  useEffect(() => {
    const loadOccupiedPlaces = async () => {
      console.log(`FloorPlan: Начало загрузки для этажа ${tower} ${floorNumber}`);
      setLoading(true);
      setError(null);
      
      // Используем InteractionManager для отложенного выполнения тяжелых операций
      InteractionManager.runAfterInteractions(async () => {
        try {
          console.log(`FloorPlan: Получение занятых мест для этажа ${tower} ${floorNumber}`);
          
          // Получаем список занятых мест
          let places = await getOccupiedPlaces(floorNumber, tower);
          console.log(`FloorPlan: Получено ${places.length} занятых мест`);
          
          if (places.length > 0) {
            console.log('FloorPlan: Примеры занятых мест (первые 5):');
            places.slice(0, 5).forEach((place, index) => {
              console.log(`FloorPlan: Место ${index + 1}: ${place}`);
            });
          }
          
          occupiedPlacesRef.current = places;
          
          // Проверка размера SVG
          const svgSize = floorSvg.length;
          console.log(`FloorPlan: Размер SVG: ${svgSize} байт`);
          
          // Проверка на слишком большой SVG
          if (svgSize > 10000000) { // 10MB
            console.error(`FloorPlan: SVG слишком большой (${svgSize} байт), это может вызвать проблемы с производительностью`);
            if (isMounted.current) {
              setError('SVG файл слишком большой. Возможны проблемы с отображением.');
              setProcessedSvg(floorSvg); // Показываем оригинальный SVG
              setLoading(false);
            }
            return;
          }
          
          // Обрабатываем SVG для выделения занятых мест
          if (places.length > 0 && floorSvg) {
            console.log('FloorPlan: Начало обработки SVG для выделения занятых мест');
            
            // Обрабатываем места порциями
            const modifiedSvg = processPlacesInBatches(floorSvg, places);
            
            if (isMounted.current) {
              console.log('FloorPlan: Установка обработанного SVG в состояние');
              setProcessedSvg(modifiedSvg);
              setLoading(false);
            }
          } else {
            if (isMounted.current) {
              console.log('FloorPlan: Нет занятых мест или SVG, устанавливаем оригинальный SVG');
              setProcessedSvg(floorSvg);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('FloorPlan: Ошибка при обработке SVG:', error);
          if (isMounted.current) {
            setError('Ошибка при обработке SVG');
            // В случае ошибки всё равно показываем исходный SVG
            setProcessedSvg(floorSvg);
            setLoading(false);
          }
        }
      });
    };

    loadOccupiedPlaces();
  }, [floorSvg, floorNumber, tower]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка плана этажа...</Text>
      </View>
    );
  }

  if (!processedSvg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Не удалось загрузить план этажа</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BasicSvgViewer 
        svgXml={processedSvg}
        width={width}
        height={height}
      />
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorOverlayText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 5,
  },
  errorOverlayText: {
    color: 'red',
    textAlign: 'center',
  }
});

export default FloorPlan;