// App.tsx
import React, { useState, useCallback, Suspense } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SvgProps } from 'react-native-svg';
import { FC } from 'react';
import ZoomableView from './src/components/ZoomableView';
import NavigationBar from './src/components/NavigationBar';
import OptimizedSvg from './src/components/OptimizedSvg';

// Ленивая загрузка SVG компонентов
const North4 = React.lazy(() => import('./assets/north-4.svg'));
const North16 = React.lazy(() => import('./assets/north-16.svg'));
const South6 = React.lazy(() => import('./assets/south-6.svg'));
const South7 = React.lazy(() => import('./assets/south-7.svg'));
const South15 = React.lazy(() => import('./assets/south-15.svg'));
const South16 = React.lazy(() => import('./assets/south-16.svg'));

type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

interface FloorConfig {
  width: number;
  height: number;
}

const FLOOR_CONFIGS: Record<FloorType, FloorConfig> = {
  'north-4': { width: 1059, height: 2507 },
  'north-16': { width: 3525, height: 3214 },
  'south-6': { width: 2524, height: 2370 },
  'south-7': { width: 2967, height: 857 },
  'south-15': { width: 2356, height: 2390 },
  'south-16': { width: 2356, height: 2390 },
};

const FLOOR_COMPONENTS: Record<FloorType, FC<SvgProps>> = {
  'north-4': North4,
  'north-16': North16,
  'south-6': South6,
  'south-7': South7,
  'south-15': South15,
  'south-16': South16,
};

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const App = () => {
  const [currentFloor, setCurrentFloor] = useState<FloorType>('north-4');

  const handleFloorChange = useCallback((floor: FloorType) => {
    setCurrentFloor(floor);
  }, []);

  const currentConfig = FLOOR_CONFIGS[currentFloor];
  const CurrentFloorComponent = FLOOR_COMPONENTS[currentFloor];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <NavigationBar
          currentFloor={currentFloor}
          onFloorChange={handleFloorChange}
        />
        <View style={styles.contentContainer}>
          <Suspense fallback={<LoadingIndicator />}>
            <ZoomableView
              contentWidth={currentConfig.width}
              contentHeight={currentConfig.height}
              minimumZoomScale={0.5}
              maximumZoomScale={3}
              bouncesZoom={true}
            >
              <OptimizedSvg
                SvgComponent={CurrentFloorComponent}
                width={currentConfig.width}
                height={currentConfig.height}
              />
            </ZoomableView>
          </Suspense>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default App;
