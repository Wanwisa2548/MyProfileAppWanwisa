import { ReactNode } from "react";
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

// ปุ่มมาตรฐานของแอป: เด้ง (scale) + ยกลอย (shadow) เวลากด — ทำงานทั้งมือถือและเว็บ
// และสว่างขึ้น + ลอยขึ้นอีกตอนเอาเมาส์ไปวาง (hover) — ใช้งานได้จริงเฉพาะบนเว็บ/เดสก์ท็อป
// เพราะมือถือ/แท็บเล็ตไม่มีเมาส์ให้ "hover" ได้ในทางเทคนิค
// ใช้แทน TouchableOpacity ได้เลยแบบ drop-in (รับ style/onPress/disabled เหมือนกัน)
const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const BOUNCE = { damping: 10, stiffness: 260, mass: 0.6 };

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** ปิดการเด้ง scale ตอนกด (ใช้กับปุ่มไอคอนเล็กๆ ที่ไม่อยากให้ดูรัว) */
  disableScale?: boolean;
  /** เศษพร็อพเดิมจากตอนที่ยังเป็น TouchableOpacity — ไม่ใช้แล้วเพราะแอนิเมชันคุมความจางเองแล้ว */
  activeOpacity?: number;
};

export function AnimatedPressable({ style, children, disabled, disableScale, activeOpacity: _activeOpacity, onPressIn, onPressOut, onHoverIn, onHoverOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const hover = useSharedValue(0);
  const press = useSharedValue(0);

  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const borderRadius = typeof flatStyle?.borderRadius === "number" ? flatStyle.borderRadius : 0;

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const lift = Math.max(hover.value, press.value);
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: 0.1 + lift * 0.3,
      shadowRadius: 5 + lift * 13,
      shadowOffset: { width: 0, height: 2 + lift * 7 },
      elevation: 2 + lift * 7,
    };
  });

  const hoverOverlayStyle = useAnimatedStyle(() => ({ opacity: hover.value * 0.16 }));
  const pressOverlayStyle = useAnimatedStyle(() => ({ opacity: press.value * 0.22 }));

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) {
      if (!disableScale) scale.value = withTiming(0.92, { duration: 90 });
      press.value = withTiming(1, { duration: 70 });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, BOUNCE);
    press.value = withTiming(0, { duration: 220 });
    onPressOut?.(e);
  };

  const handleHoverIn = (e: any) => {
    if (!disabled) {
      if (!disableScale) scale.value = withSpring(1.06, BOUNCE);
      hover.value = withTiming(1, { duration: 160 });
    }
    onHoverIn?.(e);
  };

  const handleHoverOut = (e: any) => {
    scale.value = withSpring(1, BOUNCE);
    hover.value = withTiming(0, { duration: 200 });
    onHoverOut?.(e);
  };

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={[style, containerAnimatedStyle, disabled && styles.disabled]}
      {...rest}
    >
      {children}
      {/* สว่างขึ้นตอน hover (เว็บ) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius, backgroundColor: "#fff" }, hoverOverlayStyle]} />
      {/* มืดลงตอนกด (ทุกแพลตฟอร์ม) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius, backgroundColor: "#000" }, pressOverlayStyle]} />
    </AnimatedPressableBase>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.55 },
});
