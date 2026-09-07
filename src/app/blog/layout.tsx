import styles from './layout.module.css'

// /blog 配下のすべてのページで共有される外枠。
// ルートの layout.tsx（ヘッダー・フッター）の内側に、さらに入れ子で入る。
export default function BlogLayout({ children }: LayoutProps<'/blog'>) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>ブログ</h1>
      <p className={styles.note}>
        この見出しと帯は <code>app/blog/layout.tsx</code> のもの。/blog 配下のどのページでも表示される。
      </p>
      {children}
    </div>
  )
}
