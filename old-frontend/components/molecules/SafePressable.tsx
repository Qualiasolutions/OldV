import React, { useRef } from 'react';
import { GestureResponderEvent, Pressable, PressableProps } from 'react-native';

export default function SafePressable({
  onPress,
  onPressIn,
  ...props
}: PressableProps) {
  const touchActivatePositionRef = useRef<{
    pageX: number;
    pageY: number;
  } | null>(null);

  function onPressInInternal(e: GestureResponderEvent) {
    const { pageX, pageY } = e.nativeEvent;

    touchActivatePositionRef.current = {
      pageX,
      pageY
    };

    onPressIn?.(e);
  }

  function onPressInternal(e: GestureResponderEvent) {
    if (touchActivatePositionRef.current) {
      const { pageX, pageY } = e.nativeEvent;

      const absX = Math.abs(touchActivatePositionRef.current.pageX - pageX);
      const absY = Math.abs(touchActivatePositionRef.current.pageY - pageY);

      const dragged = absX > 2 || absY > 2;
      if (!dragged) {
        onPress?.(e);
      }
    }
  }

  return (
    <Pressable
      onPressIn={onPressInInternal}
      onPress={onPressInternal}
      {...props}
    >
      {props.children}
    </Pressable>
  );
}
