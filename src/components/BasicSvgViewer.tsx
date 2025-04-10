import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import ZoomableView from './ZoomableView';
import { UserProfile } from '../services/userService';

interface BasicSvgViewerProps {
  svgXml: string;
  width: number;
  height: number;
  employeeByPlace?: Map<string, UserProfile>;
  onPlacePress?: (place: string, employee: UserProfile, position: { x: number; y: number }) => void;
}

const BasicSvgViewer: React.FC<BasicSvgViewerProps> = ({
  svgXml,
  width,
  height,
  employeeByPlace,
  onPlacePress,
}) => {
  // Добавляем обработчик нажатий на элементы SVG
  const modifySvgForInteraction = (svg: string): string => {
    if (!employeeByPlace || !onPlacePress) {
      return svg;
    }

    console.log('BasicSvgViewer: Модификация SVG для добавления интерактивности');
    
    let modifiedSvg = svg;
    
    // Добавляем атрибут pointer-events="all" к группам мест
    // и добавляем обработчик onclick с идентификатором места
    employeeByPlace.forEach((employee, place) => {
      // Ищем элемент места в SVG
      const placeId = findPlaceElementByNumber(svg, place);
      
      if (placeId) {
        // Регулярное выражение для поиска группы с id места
        const placeGroupRegex = new RegExp(`<g\\s+id="${placeId}"[^>]*>`, 'g');
        
        // Заменяем открывающий тег группы, добавляя атрибуты для интерактивности
        modifiedSvg = modifiedSvg.replace(placeGroupRegex, (match) => {
          return match.replace('>', ` pointer-events="all" data-place="${place}" data-interactive="true">`);
        });
      }
    });
    
    // Создаем полный HTML документ с SVG и скриптом для обработки нажатий
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #f5f5f5;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          svg {
            width: 100%;
            height: 100%;
            max-width: ${width}px;
            max-height: ${height}px;
          }
        </style>
      </head>
      <body>
        ${modifiedSvg}
        <script>
          document.addEventListener('click', function(evt) {
            var target = evt.target;
            while (target && !target.getAttribute('data-interactive')) {
              target = target.parentNode;
              if (!target || target.tagName === 'BODY') break;
            }
            
            if (target && target.getAttribute('data-place')) {
              var place = target.getAttribute('data-place');
              var rect = target.getBoundingClientRect();
              var message = {
                type: 'placeClick',
                place: place,
                x: rect.left + rect.width/2,
                y: rect.top + rect.height/2
              };
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            }
          }, false);
        </script>
      </body>
      </html>
    `;
    
    return htmlContent;
  };

  // Функция для поиска элемента места в SVG по номеру места
  const findPlaceElementByNumber = (svg: string, placeNumber: string): string | null => {
    console.log(`BasicSvgViewer: Поиск элемента для места ${placeNumber} в SVG по тексту`);
    
    // Метод 1: Поиск через прямое соответствие текста в tspan
    const tspanRegex = new RegExp(`<tspan[^>]*>\\s*(${placeNumber})\\s*</tspan>`, 'gi');
    const tspanMatches = [...svg.matchAll(tspanRegex)];
    
    if (tspanMatches.length === 0) {
      console.log(`BasicSvgViewer: Текстовый элемент с номером ${placeNumber} не найден`);
      return null;
    }
    
    console.log(`BasicSvgViewer: Найдено ${tspanMatches.length} текстовых элементов с номером ${placeNumber}`);
    
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
      const textIdMatch = textElement.match(/id="([^"]+)"/);
      if (!textIdMatch) continue;
      
      const textId = textIdMatch[1];
      console.log(`BasicSvgViewer: Найден текстовый элемент с ID "${textId}" для места ${placeNumber}`);
      
      // Метод 2: Поиск связанного Place_ элемента через анализ структуры SVG
      
      // Сначала проверяем, есть ли рядом с текстовым элементом элемент Place_
      // Ищем все элементы Place_ в SVG
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
          console.log(`BasicSvgViewer: Найден элемент места ${placeId} для номера ${placeNumber}`);
          return placeId;
        }
      }
      
      // Метод 3: Если не нашли через прямое соответствие, ищем через связь Number_ и Place_
      if (textId.startsWith('Number_')) {
        const numberId = textId.replace('Number_', '');
        
        // Проверяем, есть ли соответствующий элемент Place_ с тем же ID
        const placeRegex = new RegExp(`<g id="Place_${numberId}"[^>]*>`, 'g');
        const placeMatches = [...svg.matchAll(placeRegex)];
        
        if (placeMatches.length > 0) {
          const placeId = `Place_${numberId}`;
          console.log(`BasicSvgViewer: Найден элемент ${placeId} для места ${placeNumber} через соответствие ID`);
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
            console.log(`BasicSvgViewer: Найден элемент ${placeId} для места ${placeNumber} через содержимое`);
            return placeId;
          }
        }
      }
    }
    
    return null;
  };

  // Модифицируем SVG для добавления интерактивности
  const interactiveHtml = modifySvgForInteraction(svgXml);

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'placeClick' && message.place && employeeByPlace && onPlacePress) {
        const employee = employeeByPlace.get(message.place);
        
        if (employee) {
          // Вызываем обработчик нажатия на место
          onPlacePress(message.place, employee, { x: message.x, y: message.y });
        }
      }
    } catch (error) {
      console.error('BasicSvgViewer: Ошибка при обработке сообщения от WebView:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ZoomableView contentWidth={width} contentHeight={height}>
        <WebView
          source={{ html: interactiveHtml }}
          style={{ width, height }}
          originWhitelist={['*']}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          automaticallyAdjustContentInsets={false}
        />
      </ZoomableView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default BasicSvgViewer;