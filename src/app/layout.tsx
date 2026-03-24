import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SessionProvider } from "@/components/session-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "SteelCFO // Neural Finance Matrix",
  description:
    "AI-Powered Financial Command Interface for Structural Steel Operations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="scan-lines min-h-screen bg-cyber-black">
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(10, 10, 15, 0.95)",
                border:
                  "1px solid rgba(0, 255, 255, 0.2)",
                color: "#E0F7FA",
                fontFamily:
                  "JetBrains Mono, monospace",
                fontSize: "12px",
                boxShadow:
                  "0 0 10px rgba(0, 255, 255, 0.1)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
