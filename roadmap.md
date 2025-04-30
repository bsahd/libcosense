# API カバレッジ

[Scrapbox REST APIの一覧 - Cosense研究会](https://scrapbox.io/scrapboxlab/Scrapbox_REST_API%E3%81%AE%E4%B8%80%E8%A6%A7)

## ページの情報を取得する

- `api/pages/:projectname/:pagetitle`: `Page`クラスとして実装済み
- `api/pages/:projectname/search/titles`: `Project` クラス内の `pageList` 関数として実装済み
- below is not yet
- `api/pages/:projectname/:pagetitle/text`
  - `Page`クラス内にページテキストを取得する機能はつけたが、このAPIを呼び出す機能は付けない
- `api/pages/:projectname/:pagetitle/icon`
- `api/code/:projectname/:pagetitle/:filename`
- `api/table/:projectname/:pagetitle/:filename.csv`
- `api/page-snapshots/:projectname/:pageid`
- `api/page-snapshots/:projectname/:pageid/:timestampid`
- `api/commits/:projectname/:pageid`
- `api/deleted-pages/:projectname/:pageid`

## 全文検索

- `api/pages/:projectname/search/query`
- below is not yet
- `api/projects/search/query`
- `api/projects/search/watch-list`

## Projectの情報を取得する

- `api/pages/:projectname`
- `api/projects/:projectname`
- below is not yet
- `api/stream/:projectname/`
- `api/feed/:projectname`
- `api/projects/:projectname/notifications`
- `api/projects/:projectname/invitations`
- `api/project-backup/:projectname/list`
- `api/project-backup/:projectname/:backupId.json`
- `api/page-data/export/:projectname.json`

## Userの情報を取得する

- below is not yet
- `api/users/me`
- `api/projects`
- `api/gcs/:projectname/usage`

## Scrapboxの内部処理用

- below is not yet
- `api/settings`
- `api/google-map/static-map`
  - `Googleマップの埋め込み`に使う画像を取得する
