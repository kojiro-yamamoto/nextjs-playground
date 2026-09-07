'use client'

import { useState } from 'react'
import styles from './share-button.module.css'

// Client Component が必要な理由が 2つ同時に出ている例。
//   1. useState（状態）
//   2. navigator / location（ブラウザにしか無い API）
export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    // ★ window / navigator を触るのは「イベントハンドラの中」だけ。
    //   Client Component も初回はサーバーでレンダリングされるため、
    //   コンポーネント本体で location を読むとサーバー側で落ちる。
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={copied}
    >
      {copied ? '✓ コピーしました' : 'リンクをコピー'}
    </button>
  )
}
