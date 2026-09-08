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
        機能を足すたびに、データの持ち方やレンダリング方式も一緒に入れ替えてきました。
      </p>
      <p className={styles.repo}>
        ソースコードと Step ごとの学習ノートは{' '}
        <a href="https://github.com/kojiro-yamamoto/nextjs-playground">GitHub</a>{' '}
        に置いてあります。
      </p>

      <h2 className={styles.heading}>いまできること</h2>
      <ul className={styles.list}>
        <li>
          <Link href="/blog">記事の一覧</Link>とキーワード検索
        </li>
        <li>記事の詳細ページと関連記事</li>
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
          SQLite（<code>data/blog.db</code>）+ Drizzle ORM。ドライバは Node.js
          組み込みの <code>node:sqlite</code>
        </dd>
        <dt>レンダリング</dt>
        <dd>
          ほとんどのページはビルド時に作り置きされる静的ページ。
          <code>searchParams</code> を読む <code>/blog</code> だけが動的
        </dd>
      </dl>

      <h2 className={styles.heading}>記事の保存先は 3回入れ替わった</h2>
      <ol className={styles.list}>
        <li>Step 2: TypeScript の定数配列</li>
        <li>Step 4: JSON ファイル</li>
        <li>Step 6: SQLite + Drizzle ORM</li>
      </ol>
      <p className={styles.text}>
        入れ替わったのは <code>src/lib/posts.ts</code> の中身だけで、そこが外に
        見せている関数の形は Step 2 のまま。だから一覧・詳細・検索・投稿の
        どのページも、一度も書き換えていない。
      </p>

      <p className={styles.note}>
        このページ自身もその静的ページで、<code>npm run build</code> の出力では{' '}
        <code>○ /about</code> と表示される。いま見えている HTML はビルド時に 1回
        だけ作られたもので、アクセスのたびに作り直してはいない。
      </p>
    </main>
  )
}
