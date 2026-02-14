import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Custom hook encapsulating the theme resolution side effect.
 * Listens to system preference changes and applies the resolved theme class to <html>.
 *
 * @param theme - Current theme selection
 * @returns resolvedTheme - The computed 'light' or 'dark' value
 */
function useThemeResolver(theme: Theme): 'light' | 'dark' {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const resolve = () => {
      const resolved =
        theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme
      setResolvedTheme(resolved)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolved)
    }

    resolve()
    mediaQuery.addEventListener('change', resolve)
    return () => mediaQuery.removeEventListener('change', resolve)
  }, [theme])

  return resolvedTheme
}

/**
 * Lightweight theme provider for Electron (replaces next-themes).
 * Persists selection to localStorage and respects system preference.
 *
 * @param defaultTheme - Initial theme before localStorage is read
 * @example
 *   <ThemeProvider defaultTheme="system">
 *     <App />
 *   </ThemeProvider>
 */
export const ThemeProvider = React.memo(function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('lain-theme')
    return (stored as Theme) || defaultTheme
  })

  const resolvedTheme = useThemeResolver(theme)

  const setTheme = (next: Theme) => {
    setThemeState(next)
    localStorage.setItem('lain-theme', next)
  }

  const contextValue = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme],
  )

  return <ThemeContext value={contextValue}>{children}</ThemeContext>
})

/**
 * Access current theme and toggle controls.
 *
 * @returns theme (raw selection), resolvedTheme (computed light|dark), setTheme
 * @example
 *   const { resolvedTheme, setTheme } = useTheme()
 *   setTheme("dark")
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
