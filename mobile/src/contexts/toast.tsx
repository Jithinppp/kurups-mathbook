import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AlertCircle, CheckCircle2 } from "lucide-react-native";

import { colors, font, radius } from "@/lib/theme";

type ToastKind = "success" | "error";
interface ToastValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<ToastKind>("success");
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (nextMessage: string, nextKind: ToastKind = "success") => {
      setMessage(nextMessage);
      setKind(nextKind);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -8,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2600);
    },
    [opacity, translateY],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const Icon = kind === "success" ? CheckCircle2 : AlertCircle;

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            kind === "error" && styles.toastError,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <Icon color={colors.white} size={18} />
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 58,
    left: 20,
    right: 20,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  toastError: {
    backgroundColor: colors.danger,
  },
  text: {
    flex: 1,
    color: colors.white,
    fontFamily: font.medium,
    fontSize: 13,
    lineHeight: 18,
  },
});
