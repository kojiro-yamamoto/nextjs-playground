import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js Playground',
  description: 'Next.js を Step ごとに学ぶための、ブログアプリの学習用リポジトリ',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
