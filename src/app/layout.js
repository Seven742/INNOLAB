import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata = {
  title: "INNOLAB - Inventory Management System",
  description: "Professional Inventory Management System for InnoLab Kampong Thom, Cambodia",
  applicationName: "INNOLAB",
  appleWebApp: {
    capable: true,
    title: "INNOLAB",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/main-logo.png",
    shortcut: "/main-logo.png",
    apple: "/main-logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Browser Website Icon (Favicon) */}
        <link rel="icon" type="image/png" href="/main-logo.png" />
        <link rel="shortcut icon" href="/main-logo.png" />

        {/* Add to Home Screen (Mobile & iOS / Android) */}
        <link rel="apple-touch-icon" href="/main-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/main-logo.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/main-logo.png" />
        <link rel="manifest" href="/manifest.json" />

        <meta name="apple-mobile-web-app-title" content="INNOLAB" />
        <meta name="application-name" content="INNOLAB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#008290" />
      </head>
      <body
        className="min-h-full font-sans bg-bg-main text-text-main selection:bg-primary selection:text-white antialiased transition-colors duration-150"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
