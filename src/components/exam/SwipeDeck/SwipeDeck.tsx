import React, { useCallback, useEffect } from 'react';
import { Dimensions, View, ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { styles } from './SwipeDeck.styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeDeckProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  onFinished?: () => void;
  onIndexChange?: (index: number) => void;
  containerStyle?: ViewStyle;
}

function SwipeDeck<T extends { id: string }>({
  data,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onFinished,
  onIndexChange,
  containerStyle,
}: SwipeDeckProps<T>) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  
  // Reset animations when index changes
  useEffect(() => {
      translateX.value = 0;
      rotate.value = 0;
      if (onIndexChange) {
          onIndexChange(currentIndex);
      }
  }, [currentIndex, translateX, rotate, onIndexChange]);

  // Handle data shrinking (e.g. unfavoriting the last item)
  useEffect(() => {
      if (currentIndex >= data.length && data.length > 0) {
          setCurrentIndex(data.length - 1);
      }
  }, [data.length, currentIndex]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    // Reset gesture state before swapping cards to avoid a 1-frame "blink"
    // where the next card mounts while translateX is still off-screen.
    translateX.value = 0;
    rotate.value = 0;

    const item = data[currentIndex];
    if (direction === 'left') {
      onSwipeLeft(item);
    } else if (onSwipeRight) {
      onSwipeRight(item);
    } else {
        // If no right swipe handler, treat as left/dismiss or just next
        onSwipeLeft(item); 
    }

    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinished?.();
    }
  }, [currentIndex, data, onSwipeLeft, onSwipeRight, onFinished, rotate, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
        [-15, 15],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        
        translateX.value = withTiming(targetX, {}, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Next card style (fades in and scales up slightly)
  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.97, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [12, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity: 1,
    };
  });

  if (currentIndex >= data.length) {
      return null;
  }

  const currentItem = data[currentIndex];
  const nextItem = data[currentIndex + 1];

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Next Card (Underneath) */}
      {nextItem && (
        <Animated.View
          pointerEvents="none"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[styles.cardContainer, styles.nextCard, nextCardStyle]}
        >
          {renderCard(nextItem, currentIndex + 1)}
        </Animated.View>
      )}

      {/* Top Card (Interactive) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[styles.cardContainer, styles.topCard, animatedCardStyle]}
        >
          {renderCard(currentItem, currentIndex)}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default SwipeDeck;
