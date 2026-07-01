import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const repoBasePath = '/GestaoTurnos'
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Horário dos Cafés',
  description: 'Gestão de turnos dos funcionários em vários cafés',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: `${repoBasePath}/icon-light-32x32.png`,
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${repoBasePath}/icon-dark-32x32.png`,
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: `${repoBasePath}/icon.svg`,
        type: 'image/svg+xml',
      },
    ],
    apple: `${repoBasePath}/apple-icon.png`,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-PT"
      className={`bg-background ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
