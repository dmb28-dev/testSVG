// src/components/OptimizedSvg.tsx
import React, { memo } from 'react';
import { View } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface OptimizedSvgProps extends SvgProps {
  SvgComponent: React.FC<SvgProps>;
}

const OptimizedSvg: React.FC<OptimizedSvgProps> = memo(({ SvgComponent, ...props }) => {
  return (
    <View>
      <SvgComponent {...props} />
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.width === nextProps.width && 
         prevProps.height === nextProps.height &&
         prevProps.SvgComponent === nextProps.SvgComponent;
});

export default OptimizedSvg;
