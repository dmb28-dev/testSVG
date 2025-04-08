// src/components/FloorViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform, Text, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import NavigationBar from './NavigationBar';
import FloorPlan from './FloorPlan';
import { loadFloorSvg } from '../../utils/svgLoader';

// Типы этажей
type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

// Размеры планов этажей
const floorDimensions = {
  'north-4': { width: 1200, height: 800 },
  'north-16': { width: 1200, height: 800 },
  'south-6': { width: 1200, height: 800 },
  'south-7': { width: 1200, height: 800 },
  'south-15': { width: 1200, height: 800 },
  'south-16': { width: 1200, height: 800 },
};

// Преобразование типа этажа в параметры для API
const floorTypeToApiParams = (floorType: FloorType): { tower: string; floor: string } => {
  const [tower, floor] = floorType.split('-');
  return {
    tower: tower === 'north' ? 'северная' : 'южная',
    floor: floor,
  };
};

interface FloorViewerProps {
  initialFloor?: FloorType;
}

const FloorViewer: React.FC<FloorViewerProps> = ({ initialFloor = 'north-4' }) => {
  const [currentFloor, setCurrentFloor] = useState<FloorType>(initialFloor);
  const [floorSvg, setFloorSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Высота навигационной панели с учетом статус-бара
  const NAV_BAR_HEIGHT = 160;

  useEffect(() => {
    // Устанавливаем цвет статус-бара
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#ffffff');
    }
  }, []);

  // Обработка ошибок с использованием try-catch и предупреждений
  const handleError = useCallback((err: any, floorType: FloorType) => {
    console.error(`Ошибка при загрузке плана этажа ${floorType}:`, err);
    
    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    setError(`Не удалось загрузить план этажа: ${errorMessage}`);
    
    // Показываем предупреждение пользователю
    Alert.alert(
      'Ошибка загрузки',
      `Не удалось загрузить план этажа ${floorType}. Возможно, файл слишком большой или поврежден.`,
      [
        { text: 'OK' }
      ]
    );
  }, []);

  useEffect(() => {
    const loadFloor = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { tower, floor } = floorTypeToApiParams(currentFloor);
        console.log(`FloorViewer: Загрузка плана этажа: ${tower} ${floor}`);
        
        // Добавляем обработку ошибок и таймаут
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Превышено время ожидания загрузки')), 30000); // 30 секунд таймаут
        });
        
        // Используем Promise.race для ограничения времени загрузки
        const svg = await Promise.race([
          loadFloorSvg(tower, floor),
          timeoutPromise
        ]);
        
        // Проверка на размер SVG
        if (svg.length > 15000000) { // 15MB
          throw new Error(`SVG файл слишком большой (${svg.length} байт)`);
        }
        
        setFloorSvg(svg);
      } catch (err) {
        handleError(err, currentFloor);
      } finally {
        setLoading(false);
      }
    };

    loadFloor();
  }, [currentFloor, handleError]);

  const handleFloorChange = (floor: FloorType) => {
    // Сбрасываем состояние перед загрузкой нового этажа
    setFloorSvg(null);
    setCurrentFloor(floor);
  };

  const { tower, floor } = floorTypeToApiParams(currentFloor);
  const { width, height } = floorDimensions[currentFloor];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.navBarContainer}>
          <NavigationBar currentFloor={currentFloor} onFloorChange={handleFloorChange} />
        </View>
        
        <View style={[styles.contentContainer, { marginTop: NAV_BAR_HEIGHT }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Загрузка плана этажа...</Text>
              <Text style={styles.loadingSubText}>Это может занять некоторое время для больших планов</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : floorSvg ? (
            <FloorPlan
              floorSvg={floorSvg}
              floorNumber={floor}
              tower={tower}
              width={width}
              height={height}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
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
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default FloorViewer;