import React, { memo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

interface ZoomableViewProps {
  children: React.ReactNode;
  contentWidth: number;
  contentHeight: number;
  minimumZoomScale?: number;
  maximumZoomScale?: number;
  bouncesZoom?: boolean;
  initialZoom?: number;
}

const ZoomableView: React.FC<ZoomableViewProps> = memo(({
  children,
  contentWidth,
  contentHeight,
  minimumZoomScale = 0.1,
  maximumZoomScale = 5,
  bouncesZoom = true,
  initialZoom,
}) => {
  // Получаем размеры экрана
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height - 160;
  
  // Рассчитываем начальный масштаб
  // Изменено: увеличиваем коэффициент с 0.9 до 1.5 для более близкого отображения плана
  const calculatedInitialZoom = initialZoom || 
    Math.min(screenWidth / contentWidth, screenHeight / contentHeight) * 1.5;
  
  console.log(`ZoomableView: Screen=${screenWidth}x${screenHeight}, Content=${contentWidth}x${contentHeight}`);
  console.log(`ZoomableView: initialZoom=${calculatedInitialZoom}`);
  
  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        maxZoom={maximumZoomScale}
        minZoom={0.05} // Очень низкое значение для возможности сильного уменьшения
        zoomStep={0.5}
        initialZoom={calculatedInitialZoom}
        bindToBorders={false} // Отключаем привязку к границам для свободного перемещения
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        style={styles.zoomContainer}
        doubleTapZoomToCenter={true}
        movementSensibility={1.5}
        visualTouchFeedbackEnabled={true}
        initialOffsetX={0} // Начальное смещение по X
        initialOffsetY={0} // Начальное смещение по Y
        // Настраиваем обработку жестов для лучшей работы с WebView
        pinchToZoomInSensitivity={3} // Увеличиваем чувствительность для масштабирования
        pinchToZoomOutSensitivity={3} // Увеличиваем чувствительность для уменьшения
        doubleTapDelay={200} // Уменьшаем задержку для двойного нажатия
        // Отключаем обработку одиночных нажатий, чтобы они проходили к WebView
        onSingleTap={() => {}} // Пустой обработчик, чтобы нажатия проходили дальше
      >
        <View style={styles.contentContainer}>
          {children}
        </View>
      </ReactNativeZoomableView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden', // Важно для предотвращения прокрутки за пределами контейнера
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    alignItems: 'center', // Центрирование содержимого по горизонтали
    justifyContent: 'center', // Центрирование содержимого по вертикали
    width: '100%',
    height: '100%',
  }
});

export default ZoomableView;