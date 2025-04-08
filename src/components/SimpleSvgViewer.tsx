// // src/components/SimpleSvgViewer.tsx
// import React, { useState, useEffect } from 'react';
// import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
// import { SvgXml } from 'react-native-svg';

// interface SimpleSvgViewerProps {
//   svgXml: string;
//   width: number;
//   height: number;
// }

// const SimpleSvgViewer: React.FC<SimpleSvgViewerProps> = ({ svgXml, width, height }) => {
//   // Получаем размеры экрана
//   const screenWidth = Dimensions.get('window').width;
//   const screenHeight = Dimensions.get('window').height - 160;
  
//   // Рассчитываем масштаб для отображения всего SVG
//   // Используем более низкое значение для гарантированного отображения всего содержимого
//   const scale = Math.min(screenWidth / width, screenHeight / height) * 0.75;
  
//   // Рассчитываем размеры масштабированного SVG
//   const scaledWidth = width * scale;
//   const scaledHeight = height * scale;
  
//   console.log(`SimpleSvgViewer: Scale=${scale}, Scaled dimensions=${scaledWidth}x${scaledHeight}`);
  
//   // Проверяем, нужна ли прокрутка
//   const needsHorizontalScroll = scaledWidth > screenWidth;
//   const needsVerticalScroll = scaledHeight > screenHeight;
  
//   return (
//     <ScrollView 
//       style={styles.scrollContainer}
//       contentContainerStyle={styles.scrollContent}
//       horizontal={needsHorizontalScroll}
//       showsHorizontalScrollIndicator={true}
//       showsVerticalScrollIndicator={true}
//       maximumZoomScale={3}
//       minimumZoomScale={0.5}
//     >
//       <ScrollView
//         nestedScrollEnabled={true}
//         contentContainerStyle={styles.innerScrollContent}
//         showsVerticalScrollIndicator={true}
//       >
//         <SvgXml
//           xml={svgXml}
//           width={scaledWidth}
//           height={scaledHeight}
//           preserveAspectRatio="xMidYMid meet"
//           style={styles.svg}
//         />
//       </ScrollView>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   innerScrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   svg: {
//     alignSelf: 'center',
//   },
// });

// export default SimpleSvgViewer;