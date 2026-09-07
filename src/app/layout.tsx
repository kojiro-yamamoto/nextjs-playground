import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import './globals.css'

// next/font がビルド時にフォントを取得し、self-host する。
// 返り値の className を <html> に付けると、配下すべてに効く。
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Next.js Playground',
  description: 'Next.js を Step ごとに学ぶための、ブログアプリの学習用リポジトリ',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
