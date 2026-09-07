@AGENTS.md

# コミット・ブランチ規約

react-playground と同じ規約に揃える。

## コミットメッセージ

`type(scope): 内容` の Conventional Commits 形式。内容は日本語、命令形ではなく「〜を追加」「〜に戻す」のような体言止め／終止形。

- scope は `step0` `step1` … のように Step 番号を入れる
- Step に紐づかない全体的な変更は scope を省略する（`docs: 各 Step のブランチ運用を README に追記`）

| type | 用途 |
|---|---|
| `feat` | 機能を追加・動かす |
| `fix` | バグ修正 |
| `docs` | ドキュメント（`documents/` 配下、README） |
| `refactor` | 挙動を変えない整理・分割 |
| `chore` | 設定、型、依存など雑務 |

例:

```
docs(step0): Next.jsの全体像とプロジェクト構成のノートを追加
feat(step1): タスク管理アプリの静的UIをコンポーネントで組む
refactor(step4): ファイルを分割し、タスクのロジックをカスタムフックに切り出す
chore: TaskFormのsubmitハンドラの型をSubmitEventに戻す
```

## ブランチ運用

`main` は常に最新の状態。各 Step の完成時点のスナップショットを `step0` `step1` … というブランチでリモートに残し、後からその Step の画面に戻れるようにする。

Step N が終わったら:

```sh
git add -A && git commit -m "feat(stepN): ..."
git push origin main
git branch stepN && git push -u origin stepN
```

`main` から離れずにブランチを作るので、作業ブランチの切り替えは不要。
