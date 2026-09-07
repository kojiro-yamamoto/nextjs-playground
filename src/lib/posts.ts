// 記事のデータ層。
// Step 2 ではまだ「ただの定数配列」だが、呼び出し側から見た形（async 関数）を
// 先に決めておく。Step 4 で JSON ファイル、Step 6 で SQLite に差し替えても、
// ページ側のコードは書き換えなくて済む。

export type Post = {
  slug: string // URL に使う識別子。/blog/<slug> になる
  title: string
  date: string // YYYY-MM-DD
  excerpt: string // 一覧に出す要約
  body: string // 本文
}

const posts: Post[] = [
  {
    slug: 'hello-nextjs',
    title: 'Next.js の学習をはじめた',
    date: '2026-09-07',
    excerpt:
      'React だけでは足りない部分をフレームワークがどう埋めるのか、から確認していく。',
    body: `React で画面は作れるようになったが、URL ごとの画面切り替えやデータ取得は自分で組む必要があった。

Next.js は React を内側に抱えたまま、そこへ「サーバー」と「ルーティング」を足してくれる。だから覚えることは増えるが、書くコードは減る。`,
  },
  {
    slug: 'folder-is-url',
    title: 'フォルダがそのまま URL になる',
    date: '2026-09-07',
    excerpt:
      'App Router のルーティングは、page.tsx を置いた場所が公開される URL になる。',
    body: `ルーティングの設定ファイルは書かない。app/ の中にフォルダを作り、そこに page.tsx を置く。それだけで URL になる。

角括弧で囲んだ [slug] のようなフォルダを作ると動的ルートになり、1つのファイルで記事の数だけページを賄える。この記事自体がその実例。`,
  },
  {
    slug: 'nested-layouts',
    title: 'layout は入れ子になる',
    date: '2026-09-07',
    excerpt:
      'ルートの layout の内側に、セグメントごとの layout が積み重なっていく。',
    body: `app/layout.tsx がサイト全体を包み、app/blog/layout.tsx がその内側で /blog 配下だけを包む。

嬉しいのは、ページ遷移してもレイアウトが作り直されないこと。スクロール位置や開閉状態が保たれる。`,
  },
]

/** 記事を新しい順に全件返す */
export async function getPosts(): Promise<Post[]> {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

/** slug に一致する記事を返す。見つからなければ undefined */
export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((post) => post.slug === slug)
}
