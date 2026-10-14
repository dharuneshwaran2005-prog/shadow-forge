import { defineConfig } from 'vite';
// Relative base so the built game also works inside the Android (Capacitor) WebView.
export default defineConfig({ base: './' });
