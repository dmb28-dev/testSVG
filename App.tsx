import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import FloorViewer from './src/components/FloorViewer';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <FloorViewer initialFloor="north-4" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;