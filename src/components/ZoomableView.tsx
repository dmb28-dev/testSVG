// src/components/ZoomableView.tsx
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

interface ZoomableViewProps {
  children: React.ReactNode;
  contentWidth: number;
  contentHeight: number;
  minimumZoomScale?: number;
  maximumZoomScale?: number;
  bouncesZoom?: boolean;
}

const ZoomableView: React.FC<ZoomableViewProps> = memo(({
  children,
  contentWidth,
  contentHeight,
  minimumZoomScale = 0.5,
  maximumZoomScale = 3,
  bouncesZoom = true,
}) => {
  return (
    <ReactNativeZoomableView
      maxZoom={maximumZoomScale}
      minZoom={minimumZoomScale}
      zoomStep={0.5}
      initialZoom={1}
      bindToBorders={true}
      contentWidth={contentWidth}
      contentHeight={contentHeight}
      style={styles.zoomContainer}
    >
      {children}
    </ReactNativeZoomableView>
  );
});

const styles = StyleSheet.create({
  zoomContainer: {
    flex: 1,
  },
});

export default ZoomableView;
