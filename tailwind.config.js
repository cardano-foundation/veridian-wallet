module.exports = {
  darkMode: ['class', '[data-mode="dark"]'],
  important: true,
  theme: {
    extend: {},
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [require('daisyui')],
  prefix: '',
  daisyui: {
    styled: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: '',
    themes: [
      {
        light: {
          primary: '#154666',
          'primary-content': '#fff',
          'primary-focus': '#3171e0',
          secondary: '#438F68',
          'secondary-content': '#fff',
          'secondary-focus': '#0bb8cc',
          tertiary: '#7044ff',
          'tertiary-content': '#fff',
          'tertiary-focus': '#633ce0',
          success: '#10dc60',
          'success-content': '#fff',
          'success-focus': '#0ec254',
          warning: '#ffce00',
          'warning-content': '#fff',
          'warning-focus': '#e0b500',
          error: '#f04141',
          'error-content': '#fff',
          'error-focus': '#d33939',
          dark: '#13152F',
          'dark-content': '#fff',
          'dark-focus': '#1e2023',
          medium: '#989aa2',
          'medium-content': '#fff',
          'medium-focus': '#86888f',
          light: '#f4f5f8',
          'light-content': '#000',
          'light-focus': '#d7d8da',
          'border-color': '#efeff2',
        },
        dark: {
          primary: '#428cff',
          'primary-content': '#fff',
          'primary-focus': '#3a7be0',
          secondary: '#50c8ff',
          'secondary-content': '#fff',
          'secondary-focus': '#46b0e0',
          tertiary: '#6a64ff',
          'tertiary-content': '#fff',
          'tertiary-focus': '#5d58e0',
          success: '#2fdf75',
          'success-content': '#000',
          'success-focus': '#29c467',
          warning: '#ffd534',
          'warning-content': '#000',
          'warning-focus': '#e0bb2e',
          error: '#ff4961',
          'error-content': '#fff',
          'error-focus': '#e04055',
          dark: '#f4f5f8',
          'dark-content': '#000',
          'dark-focus': '#d7d8da',
          medium: '#989aa2',
          'medium-content': '#000',
          'medium-focus': '#86888f',
          light: '#13152F',
          'light-content': '#fff',
          'light-focus': '#1e2023',
        },
        dark_ios: {
          'base-100': '#000',
          'text-color': '#fff',
          'color-50': '#0d0d0d',
          'color-100': '#1a1a1a',
          'color-150': '#262626',
          'color-200': '#333',
          'color-250': '#404040',
          'color-300': '#4d4d4d',
          'color-350': '#595959',
          'color-400': '#666',
          'color-450': '#737373',
          'color-500': '#808080',
          'color-550': '#8c8c8c',
          'color-600': '#999',
          'color-650': '#a6a6a6',
          'color-700': '#b3b3b3',
          'color-750': '#bfbfbf',
          'color-800': '#ccc',
          'color-850': '#d9d9d9',
          'color-900': '#e6e6e6',
          'color-950': '#f2f2f2',
          'toolbar-background': '#0d0d0d',
          'item-background': '#000',
          'border-color': '#1a1a1a',
        },
        dark_md: {
          'base-100': '#121212',
          'text-color': '#fff',
          'border-color': '#434343',
          'color-50': '#1e1e1e',
          'color-100': '#2a2a2a',
          'color-150': '#363636',
          'color-200': '#414141',
          'color-250': '#4d4d4d',
          'color-300': '#595959',
          'color-350': '#656565',
          'color-400': '#717171',
          'color-450': '#7d7d7d',
          'color-500': '#898989',
          'color-550': '#949494',
          'color-600': '#a0a0a0',
          'color-650': '#acacac',
          'color-700': '#b8b8b8',
          'color-750': '#c4c4c4',
          'color-800': '#d0d0d0',
          'color-850': '#dbdbdb',
          'color-900': '#e7e7e7',
          'color-950': '#f3f3f3',
          'item-background': '#292929',
          'toolbar-background': '#272727',
        },
      },
    ],
  },
};
