import { useEffect, useId, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  DEFAULT_COLOR,
  clamp,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "@asharibook/shared";

import { Input } from "@/components/ui/input";
import { colors, font, radius } from "@/lib/theme";

const HUE_STOPS = [
  { offset: "0%", color: "#ff0000" },
  { offset: "16.66%", color: "#ffff00" },
  { offset: "33.33%", color: "#00ff00" },
  { offset: "50%", color: "#00ffff" },
  { offset: "66.66%", color: "#0000ff" },
  { offset: "83.33%", color: "#ff00ff" },
  { offset: "100%", color: "#ff0000" },
];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const initial = normalizeHexColor(value) ?? DEFAULT_COLOR;
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(initial));
  const [hexDraft, setHexDraft] = useState(initial);
  const [hexError, setHexError] = useState(false);
  const [panelDimensions, setPanelDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [hueWidth, setHueWidth] = useState(0);

  const panelSize = useRef({ width: 0, height: 0 });
  const hueSize = useRef({ width: 0, height: 0 });
  const lastEmitted = useRef(initial);

  const gradientPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const whiteGradientId = `${gradientPrefix}-white`;
  const blackGradientId = `${gradientPrefix}-black`;
  const hueGradientId = `${gradientPrefix}-hue`;

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const hueColor = hsvToHex(hsv.h, 1, 1);
  const thumbLeft = panelDimensions.width
    ? Math.min(
        Math.max(hsv.s * panelDimensions.width, 9),
        Math.max(9, panelDimensions.width - 9),
      )
    : 9;
  const thumbTop = panelDimensions.height
    ? Math.min(
        Math.max((1 - hsv.v) * panelDimensions.height, 9),
        Math.max(9, panelDimensions.height - 9),
      )
    : 9;
  const hueThumbLeft = hueWidth
    ? Math.min(
        Math.max((hsv.h / 360) * hueWidth, 9),
        Math.max(9, hueWidth - 9),
      )
    : 9;

  useEffect(() => {
    const normalized = normalizeHexColor(value);
    if (!normalized || normalized === lastEmitted.current) return;
    lastEmitted.current = normalized;
    setHsv(hexToHsv(normalized));
    setHexDraft(normalized);
    setHexError(false);
  }, [value]);

  function updateHsv(next: HsvColor) {
    setHsv(next);
    const nextHex = hsvToHex(next.h, next.s, next.v);
    setHexDraft(nextHex);
    setHexError(false);
    lastEmitted.current = nextHex;
    onChange(nextHex);
  }

  function updateFromPanel(x: number, y: number) {
    const { width, height } = panelSize.current;
    if (!width || !height) return;
    updateHsv({
      ...hsv,
      s: clamp(x / width, 0, 1),
      v: clamp(1 - y / height, 0, 1),
    });
  }

  function updateFromHue(x: number) {
    const { width } = hueSize.current;
    if (!width) return;
    updateHsv({
      ...hsv,
      h: clamp(x / width, 0, 1) * 360,
    });
  }

  function handlePanelLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    panelSize.current = { width, height };
    setPanelDimensions({ width, height });
  }

  function handleHueLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    hueSize.current = { width, height };
    setHueWidth(width);
  }

  function handleHexChange(next: string) {
    setHexDraft(next);
    const normalized = normalizeHexColor(next);
    if (!normalized) {
      setHexError(next.trim().length > 1);
      return;
    }

    setHexError(false);
    setHsv(hexToHsv(normalized));
    lastEmitted.current = normalized;
    onChange(normalized);
  }

  function handleHexBlur() {
    const normalized = normalizeHexColor(hexDraft);
    if (!normalized) {
      setHexDraft(currentHex);
      setHexError(false);
      return;
    }

    setHsv(hexToHsv(normalized));
    setHexDraft(normalized);
    setHexError(false);
    lastEmitted.current = normalized;
    onChange(normalized);
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.panel}
        onLayout={handlePanelLayout}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={(event) =>
          updateFromPanel(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          )
        }
        onResponderMove={(event) =>
          updateFromPanel(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          )
        }
        onResponderTerminationRequest={() => false}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Saturation and brightness"
        accessibilityValue={{
          text: `Saturation ${Math.round(hsv.s * 100)} percent, brightness ${Math.round(
            hsv.v * 100,
          )} percent`,
        }}
        accessibilityActions={[
          { name: "increment", label: "Increase brightness" },
          { name: "decrement", label: "Decrease brightness" },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") {
            updateHsv({ ...hsv, v: clamp(hsv.v + 0.05, 0, 1) });
          } else if (event.nativeEvent.actionName === "decrement") {
            updateHsv({ ...hsv, v: clamp(hsv.v - 0.05, 0, 1) });
          }
        }}
      >
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={whiteGradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={blackGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={hueColor} />
          <Rect
            width="100%"
            height="100%"
            fill={`url(#${whiteGradientId})`}
          />
          <Rect
            width="100%"
            height="100%"
            fill={`url(#${blackGradientId})`}
          />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              top: thumbTop,
              backgroundColor: currentHex,
            },
          ]}
        />
      </View>

      <View
        style={styles.hueTrack}
        onLayout={handleHueLayout}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={(event) => updateFromHue(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateFromHue(event.nativeEvent.locationX)}
        onResponderTerminationRequest={() => false}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Hue"
        accessibilityValue={{
          min: 0,
          max: 360,
          now: Math.round(hsv.h),
        }}
        accessibilityActions={[
          { name: "increment", label: "Increase hue" },
          { name: "decrement", label: "Decrease hue" },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") {
            updateHsv({ ...hsv, h: (hsv.h + 5) % 360 });
          } else if (event.nativeEvent.actionName === "decrement") {
            updateHsv({ ...hsv, h: (hsv.h + 355) % 360 });
          }
        }}
      >
        <View style={styles.hueFill}>
          <Svg
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id={hueGradientId} x1="0" y1="0" x2="1" y2="0">
                {HUE_STOPS.map((stop) => (
                  <Stop
                    key={stop.offset}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill={`url(#${hueGradientId})`}
            />
          </Svg>
        </View>
        <View
          pointerEvents="none"
          style={[styles.hueThumb, { left: hueThumbLeft }]}
        />
      </View>

      <View style={styles.hexRow}>
        <View
          style={[styles.preview, { backgroundColor: currentHex }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Input
          value={hexDraft}
          onChangeText={handleHexChange}
          onBlur={handleHexBlur}
          onSubmitEditing={handleHexBlur}
          placeholder={DEFAULT_COLOR}
          placeholderTextColor={colors.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          returnKeyType="done"
          selectionColor={colors.brand}
          accessibilityLabel="Hex colour"
          style={styles.hexInput}
        />
      </View>
      {hexError ? (
        <Text style={styles.error}>Use a hex value like #7132F5.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  panel: {
    height: 164,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    overflow: "hidden",
    backgroundColor: colors.canvas,
  },
  thumb: {
    position: "absolute",
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  hueTrack: {
    height: 26,
    justifyContent: "center",
  },
  hueFill: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  hueThumb: {
    position: "absolute",
    top: 4,
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  preview: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hexInput: { flex: 1, letterSpacing: 0.4, textTransform: "uppercase" },
  error: {
    marginTop: -4,
    fontFamily: font.regular,
    fontSize: 10,
    color: colors.danger,
  },
});
