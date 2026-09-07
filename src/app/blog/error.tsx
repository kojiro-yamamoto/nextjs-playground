'use client' // error.tsx は必ず Client Component

import styles from './error.module.css'

export default function BlogError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>記事の読み込みに失敗しました</h2>
      <p className={styles.lead}>
        一時的な問題かもしれません。もう一度お試しください。
        {/* 本番では error.message が汎用文に差し替わる。digest でサーバーログと突き合わせる */}
        {error.digest && <code className={styles.digest}>digest: {error.digest}</code>}
      </p>
      <button type="button" className={styles.button} onClick={() => retry()}>
        再試行
      </button>
    </div>
  )
}
