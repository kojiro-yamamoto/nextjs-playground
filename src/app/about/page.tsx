import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

// ページ単位の metadata。ルートの layout.tsx で
// template: '%s | Next.js Playground' を指定してあるので、
// タブには「このサイトについて | Next.js Playground」と出る。
export const metadata: Metadata = {
  title: 'このサイトについて',
  description:
    'Next.js（App Router）を Step ごとに学ぶために作っている、学習用のブログアプリです。',
}

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <h1>このサイトについて</h1>
      <p>
        Next.js（App Router）を Step ごとに学ぶために作っているブログアプリです。
        機能が増えるたびに、データの持ち方やレンダリング方式も一緒に入れ替わっていきます。
      </p>

      <h2 className={styles.heading}>いまできること</h2>
      <ul className={styles.list}>
        <li>
          <Link href="/blog">記事の一覧</Link>とキーワード検索
        </li>
        <li>記事の詳細ページ（関連記事だけ、あとから遅れて表示される）</li>
        <li>
          <Link href="/blog/new">フォームから記事を投稿</Link>
        </li>
      </ul>

      <h2 className={styles.heading}>構成</h2>
      <dl className={styles.dl}>
        <dt>フレームワーク</dt>
        <dd>Next.js 16（App Router / Turbopack）</dd>
        <dt>UI</dt>
        <dd>React 19 + TypeScript</dd>
        <dt>スタイル</dt>
        <dd>素の CSS + CSS Modules</dd>
        <dt>データ</dt>
        <dd>
          JSON ファイル（<code>data/posts.json</code>）。Step 6 で SQLite に移す予定
        </dd>
        <dt>レンダリング</dt>
        <dd>
          ほとんどのページはビルド時に作り置きされる静的ページ。
          <code>searchParams</code> を読む <code>/blog</code> だけが動的
        </dd>
      </dl>

      <p className={styles.note}>
        このページ自身もその静的ページで、<code>npm run build</code> の出力では{' '}
        <code>○ /about</code> と表示される。いま見えている HTML はビルド時に 1回だけ
        作られたもので、アクセスのたびに作り直してはいない。
      </p>
    </main>
  )
}
