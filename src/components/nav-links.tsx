'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './nav-links.module.css'

const links = [
  { href: '/blog', label: '記事一覧' },
  { href: '/about', label: 'このサイトについて' },
]

// usePathname は「いま開いている URL」を返すフック。
// フックはクライアントでしか動かないので、このファイルは "use client" が必要。
// ヘッダー全体ではなく、この部分だけを Client Component に切り出している。
export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      {links.map((link) => {
        // /blog/xxx を開いているときも「記事一覧」を現在地とみなす
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? styles.active : styles.link}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
