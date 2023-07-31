import "@/styles/globals.css"
import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"/>
     
        </head>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <div className="flex flex-col min-h-screen">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="relative flex flex-col flex-1">
                <SiteHeader />
                <div className="flex-1">{children}</div>
                <footer className="sticky bottom-0 border-t">
                  <Footer />
                </footer>
              </div>
              <TailwindIndicator />
            </ThemeProvider>
          </div>

        
        </body>
      </html>
    </>
  )
}
