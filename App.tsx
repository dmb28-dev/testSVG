import React, {useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {SvgProps} from 'react-native-svg';
import {FC} from 'react';
import ZoomableView from './src/components/ZoomableView';
import NavigationBar from './src/components/NavigationBar';

// Импортируйте все SVG файлы
import North4 from './assets/north-4.svg';
import North16 from './assets/north-16.svg';
import South6 from './assets/south-6.svg';
import South7 from './assets/south-7.svg';
import South15 from './assets/south-15.svg';
import South16 from './assets/south-16.svg';

// Определяем тип для этажей
type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

// Определяем интерфейс для конфигурации размеров
interface FloorConfig {
  width: number;
  height: number;
}

const App = () => {
  const [currentFloor, setCurrentFloor] = useState<FloorType>('north-4');

  // Конфигурация размеров для каждого SVG
  const floorConfigs: Record<FloorType, FloorConfig> = {
    'north-4': {width: 1059, height: 2507},
    'north-16': {width: 3525, height: 3214},
    'south-6': {width: 2524, height: 2370},
    'south-7': {width: 2967, height: 857},
    'south-15': {width: 2356, height: 2390},
    'south-16': {width: 2356, height: 2390},
  };

  // Компонент для текущего этажа
  const FloorComponents: Record<FloorType, FC<SvgProps>> = {
    'north-4': North4,
    'north-16': North16,
    'south-6': South6,
    'south-7': South7,
    'south-15': South15,
    'south-16': South16,
  };

  const CurrentFloorComponent = FloorComponents[currentFloor];
  const currentConfig = floorConfigs[currentFloor];

  return (
    <SafeAreaView style={styles.container}>
      <NavigationBar
        currentFloor={currentFloor}
        onFloorChange={(floor: FloorType) => setCurrentFloor(floor)}
      />
      <ZoomableView
        contentWidth={currentConfig.width}
        contentHeight={currentConfig.height}
      >
        <CurrentFloorComponent
          width={currentConfig.width}
          height={currentConfig.height}
        />
      </ZoomableView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default App;
