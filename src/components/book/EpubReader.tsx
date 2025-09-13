import React from 'react';
import { SafeAreaView } from 'react-native';
import { Reader, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';

interface EpubReaderProps {
  src: string;
  width?: number;
  height?: number;
  onReady?: (book: any) => void;
  onLocationChange?: (location: any) => void;
}

export default function EpubReader({ 
  src, 
  width, 
  height, 
  onReady, 
  onLocationChange 
}: EpubReaderProps): React.ReactElement {
  const { goNext, goPrevious, currentLocation } = useReader();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Reader
        src={src}
        width={width}
        height={height}
        fileSystem={useFileSystem}
        onReady={onReady}
        onLocationChange={onLocationChange}
        flow="paginated"
        enableSwipe={true}
      />
    </SafeAreaView>
  );
}
