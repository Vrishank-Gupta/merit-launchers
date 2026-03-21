// Mobile optimization utilities and viewport configuration
// This component ensures proper rendering on all devices

export const mobileViewportConfig = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: 'yes',
} as const;

// Touch-friendly minimum sizes (in pixels)
export const TOUCH_TARGET_SIZE = {
  minimum: 44, // iOS/Android recommended minimum
  comfortable: 48, // More comfortable tap target
} as const;

// Breakpoints matching tailwind.config.ts
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export default function MobileOptimization() {
  return null;
}
