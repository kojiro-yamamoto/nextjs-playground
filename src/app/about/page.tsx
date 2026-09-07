import styles from './page.module.css'

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <h1>このサイトについて</h1>
      <p>
        Next.js の学習用に作っているブログアプリです。Step が進むごとに機能が増えていきます。
      </p>

      <dl className={styles.dl}>
        <dt>フレームワーク</dt>
        <dd>Next.js 16（App Router）</dd>
        <dt>UI</dt>
        <dd>React 19 + TypeScript</dd>
        <dt>スタイル</dt>
        <dd>素の CSS + CSS Modules</dd>
        <dt>データ</dt>
        <dd>Step 1 時点ではまだ持っていない（JSX に直書き）</dd>
      </dl>
    </main>
  )
}
