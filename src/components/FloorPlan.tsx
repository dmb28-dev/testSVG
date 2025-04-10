import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, InteractionManager } from 'react-native';
import { getOccupiedPlaces } from '../services/userService';
import BasicSvgViewer from './BasicSvgViewer';
import { useEmployeeInfo } from '../hooks/useEmployeeInfo';
import EmployeeInfoPopup from './EmployeeInfoPopup';
import { UserProfile } from '../services/userService';

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
  
  // Состояние для всплывающего окна с информацией о сотруднике
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  // Получаем информацию о сотрудниках
  const { employeeByPlace, loading: employeesLoading } = useEmployeeInfo(floorNumber, tower);
  
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
    
    // Метод 1: Поиск через прямое соответствие текста в tspan
    // Добавляем флаг 'g' к регулярному выражению
    const tspanRegex = new RegExp(`<tspan[^>]*>\\s*(${placeNumber})\\s*</tspan>`, 'gi');
    const tspanMatches = [...svg.matchAll(tspanRegex)];
    
    if (tspanMatches.length === 0) {
      console.log(`FloorPlan: Текстовый элемент с номером ${placeNumber} не найден`);
      return null;
    }
    
    console.log(`FloorPlan: Найдено ${tspanMatches.length} текстовых элементов с номером ${placeNumber}`);
    
    // Для каждого найденного tspan ищем соответствующий элемент места
    for (const tspanMatch of tspanMatches) {
      const matchText = tspanMatch[0];
      const matchPos = svg.indexOf(matchText);
      
      if (matchPos === -1) continue;
      
      // Ищем ближайший родительский элемент <text>
      const svgBeforeText = svg.substring(0, matchPos);
      const textEndPos = svgBeforeText.lastIndexOf('<text');
      
      if (textEndPos === -1) continue;
      
      const textElement = svgBeforeText.substring(textEndPos);
      
      // Извлекаем ID текстового элемента
      // Здесь не используется matchAll, поэтому флаг 'g' не нужен
      const textIdMatch = textElement.match(/id="([^"]+)"/);
      if (!textIdMatch) continue;
      
      const textId = textIdMatch[1];
      console.log(`FloorPlan: Найден текстовый элемент с ID "${textId}" для места ${placeNumber}`);
      
      // Метод 2: Поиск связанного Place_ элемента через анализ структуры SVG
      
      // Сначала проверяем, есть ли рядом с текстовым элементом элемент Place_
      // Ищем все элементы Place_ в SVG
      // Уже имеет флаг 'g'
      const allPlaceElements = [...svg.matchAll(/<g id="(Place_[^"]+)"[^>]*>/g)];
      
      // Для каждого элемента Place_ проверяем, содержит ли он наш текстовый элемент с номером места
      for (const placeElement of allPlaceElements) {
        const placeId = placeElement[1];
        const placeStartPos = svg.indexOf(placeElement[0]);
        
        if (placeStartPos === -1) continue;
        
        // Находим конец элемента Place_
        const placeEndTag = '</g>';
        let nestingLevel = 1;
        let searchPos = placeStartPos + placeElement[0].length;
        let placeEndPos = -1;
        
        while (nestingLevel > 0 && searchPos < svg.length) {
          const nextOpenTag = svg.indexOf('<g', searchPos);
          const nextCloseTag = svg.indexOf(placeEndTag, searchPos);
          
          if (nextCloseTag === -1) break;
          
          if (nextOpenTag !== -1 && nextOpenTag < nextCloseTag) {
            nestingLevel++;
            searchPos = nextOpenTag + 2;
          } else {
            nestingLevel--;
            searchPos = nextCloseTag + placeEndTag.length;
            if (nestingLevel === 0) {
              placeEndPos = nextCloseTag;
            }
          }
        }
        
        if (placeEndPos === -1) continue;
        
        // Проверяем, содержит ли элемент Place_ наш текстовый элемент
        const placeContent = svg.substring(placeStartPos, placeEndPos + placeEndTag.length);
        
        if (placeContent.includes(matchText)) {
          console.log(`FloorPlan: Найден элемент места ${placeId} для номера ${placeNumber}`);
          return placeId;
        }
      }
      
      // Метод 3: Если не нашли через прямое соответствие, ищем через связь Number_ и Place_
      if (textId.startsWith('Number_')) {
        const numberId = textId.replace('Number_', '');
        
        // Проверяем, есть ли соответствующий элемент Place_ с тем же ID
        // Уже имеет флаг 'g'
        const placeRegex = new RegExp(`<g id="Place_${numberId}"[^>]*>`, 'g');
        const placeMatches = [...svg.matchAll(placeRegex)];
        
        if (placeMatches.length > 0) {
          const placeId = `Place_${numberId}`;
          console.log(`FloorPlan: Найден элемент ${placeId} для места ${placeNumber} через соответствие ID`);
          return placeId;
        }
        
        // Если не нашли точное соответствие, ищем любой Place_ элемент, содержащий наш текстовый элемент
        for (const placeElement of allPlaceElements) {
          const placeId = placeElement[1];
          const placeStartPos = svg.indexOf(placeElement[0]);
          const placeEndPos = svg.indexOf('</g>', placeStartPos);
          
          if (placeStartPos === -1 || placeEndPos === -1) continue;
          
          const placeContent = svg.substring(placeStartPos, placeEndPos + 4);
          
          if (placeContent.includes(textId)) {
            console.log(`FloorPlan: Найден элемент ${placeId} для места ${placeNumber} через содержимое`);
            return placeId;
          }
        }
      }
    }
    
    // Метод 4: Поиск через анализ всего SVG и поиск группы, содержащей текст с номером места
    console.log(`FloorPlan: Пытаемся найти место ${placeNumber} через анализ всего SVG`);
    
    // Создаем регулярное выражение для поиска группы, содержащей текст с номером места
    // Добавляем экранирование для placeNumber, чтобы избежать проблем с специальными символами
    const escapedPlaceNumber = placeNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Уже имеет флаг 'g'
    const groupWithTextRegex = new RegExp(`<g id="(Place_[^"]+)"[^>]*>[\\s\\S]*?<tspan[^>]*>\\s*${escapedPlaceNumber}\\s*</tspan>[\\s\\S]*?</g>`, 'g');
    const groupMatches = [...svg.matchAll(groupWithTextRegex)];
    
    if (groupMatches.length > 0) {
      const placeId = groupMatches[0][1];
      console.log(`FloorPlan: Найден элемент ${placeId} для места ${placeNumber} через поиск по всему SVG`);
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
    
    // Предварительно создаем карту соответствия номеров мест и их ID в SVG
    // для оптимизации процесса обработки
    const placeIdMap = new Map<string, string | null>();
    
    // Обрабатываем места порциями для предотвращения зависания UI
    for (let i = 0; i < places.length; i += BATCH_SIZE) {
      const batch = places.slice(i, i + BATCH_SIZE);
      console.log(`FloorPlan: Обработка порции ${i / BATCH_SIZE + 1} из ${Math.ceil(places.length / BATCH_SIZE)}`);
      console.log(`FloorPlan: Места в текущей порции: ${JSON.stringify(batch)}`);
      
      for (const place of batch) {
        // Убедимся, что место - это строка
        const placeId = place.toString();
        console.log(`FloorPlan: Обработка места с ID: ${placeId}`);
        
        // Проверяем, есть ли уже найденный ID для этого места
        let placeElementId = placeIdMap.get(placeId);
        
        // Если нет, ищем его в SVG
        if (!placeElementId) {
          placeElementId = findPlaceElementByNumber(modifiedSvg, placeId);
          
          // Сохраняем найденный ID в карту для повторного использования
          if (placeElementId ) {
            placeIdMap.set(placeId, placeElementId);
          }
        }
        
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

  // Обработчик нажатия на место
  const handlePlacePress = (place: string, employee: UserProfile, position: { x: number; y: number }) => {
    console.log(`FloorPlan: Нажатие на место ${place}, сотрудник: ${employee.lastName} ${employee.firstName}`);
    
    // Устанавливаем выбранного сотрудника и позицию всплывающего окна
    setSelectedEmployee(employee);
    
    // Корректируем позицию всплывающего окна, чтобы оно было видимым
    // и не выходило за границы экрана
    setPopupPosition(position);
    
    // Показываем всплывающее окно
    setPopupVisible(true);
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
        employeeByPlace={employeeByPlace}
        onPlacePress={handlePlacePress}
      />
      
      {/* Всплывающее окно с информацией о сотруднике */}
      <EmployeeInfoPopup
        employee={selectedEmployee}
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        position={popupPosition}
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