import { createContext, useContext } from "react";

export type Bounds = { x: number; y: number; width: number; height: number };

export type WindowState = Bounds & {
  id: string;
  title: string;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

export type WindowActions = {
  open: (id: string, options?: { maximized?: boolean }) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setBounds: (id: string, bounds: Partial<Bounds>) => void;
};

export type WindowControls = {
  focused: boolean;
  maximized: boolean;
  close: () => void;
  minimize: () => void;
  toggleMaximize: () => void;
  dragProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    onDoubleClick: (event: React.MouseEvent) => void;
  };
};

export const WindowContext = createContext<WindowControls | null>(null);

export function useWindow() {
  const controls = useContext(WindowContext);
  if (!controls) throw new Error("useWindow must be used inside a window");
  return controls;
}
