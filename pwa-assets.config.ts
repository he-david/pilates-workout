import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // The logo is full-bleed, so keep icons without extra padding or background.
    apple: { sizes: [180], padding: 0, resizeOptions: { fit: 'cover' } },
    maskable: { sizes: [512], padding: 0, resizeOptions: { fit: 'cover' } },
    transparent: { sizes: [64, 192, 512], padding: 0, favicons: [[48, 'favicon.ico']] },
  },
  images: ['public/logo.svg'],
})
