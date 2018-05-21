基本ユーティリティ
====

keシリーズの基本となる基底のクラスです。ここからさまざまなツールへと派生してゆきます。
ユーティリティー的な機能や運用のことを意識した機能など、どこでもよく使うベースとなるクラスです。

---
## 解説
---
  主に次のようなグルーピングで機能を包含しています。
  1. アプリケーションを起動する際に外部からデータを与えることにより、動きを制御するための仕組み
  2. 非同期処理でのスパゲッティループを避けるための仕組み
  3. 細かなデータハンドリング機能
  4. パラメータ展開やファイル内での区分データ管理機能
  5. エッセージログ管理機能
  6. HTTTP関係のコミュニケーション機能
  7. 単純にジョブとして実行する場合はmainProcedureをオーバーライドし、オブジェクトコンストラクション時に(true, {オプションパラメタ})で呼び出す。

---
## 依存関係
---
* ubuntu  16.04
* Node.js v7.4.0 LTS

---
## 稼働環境制御基盤
---
  稼働環境を制御する変数はユーザールートに「master.config」または、「debug.config」というJSONファイルにより設定することができます。

### サンプル

~~~json
[
  {"group": "all", "level": "warn", "mode": "always",
    "dictionary": "/home/ubuntu/web-project/data/dict.json",
    "aws": {"cfg": "/home/ubuntu/web-project/data/awsconfig.json"},
    "server": "192.168.1.3",
    "cms": {
      "port": "80",
      "keyPath": "/home/kimura/localconf/server.key",
      "csrPath": "/home/kimura/localconf/server.crt",
      "caPath": "/home/kimura/localconf/server.ca",
      "domain": "localhost",
      "phrase": "5rdxcvbgt"
    },
    "dyndns": {
      "hostname": "www.mydns.jp",
      "path": "/login.html",
      "username": "abcdefg",
      "password": "1234567",
      "check": 60
    },
    "facebook": {
      "token": "1234567abcdefg0987654hijklmn"
    }
  },
  {"group": "web-project", "mode": "master", "valid": "180101:180228",
    "server": "192.168.1.4"
  }
]
~~~

### 変数の指定と参照
  - その他: 自由にアプリにパラメタを引き渡すことができます。
  - グループをキーとして、複数の配列は同じパラメタがあればうわかぶせになります。

|パラメタ|説明|例[省略時]|
|:-|:-|:-|
|group|「all」または「プロジェクトパス（ユーザールート直下のフォルダ名）」を指定します。 |all|
|mode|debug,master,alwaysが指定できます。定義を有効にするモードです。|always|
|valid|from:toのyymmddで有効期間が指定できます。指定しないといつでも有効です。|180101:181231|
|level|メッセージレベル|warn|
|dictionary|辞書ファイルフルパス|-|
|dbdriver|使用DB|[postgre]|
|admin|管理者ID| |
|psw|パスワード| |
|service|通知サービス|gmail|
|log|ログファイルパス|*.log|

参照系

|パラメタ|説明|例[省略時]|
|:-|:-|:-|
|path|実行フルパス|-|
|pid|プロセスID|-|
|current|実行フォルダ|-|
|apli|実行ファイル名|-|
|groupid|グループ番号|-|
|uid|ユーザー番号|-|
|platform|OS|-|
|user|ユーザーID|-|
|home|ホームパス|-|
|config|実行パラメータフルパス|-|
|groupid|実行グループ|-|

---
## 関数種類と機能
---

 |関数|解説|
 |:-|:-|
 |localconf|ローカル実行環境ファイルを読み込みます。[JSON形式]|
 |dict|辞書変換をします。|
 |argv|起動引数の取り出し|
 |develop|テンプレートの展開|
 |parm|パラメータを展開する|
 |parse|URL?querystringをパースします。|
 |stringify|URL?querystringを作ります|
 |unstring|文字列をスペースデリミタで分解|
 |lastOf|文字列中の指定文字の最終出現位置|
 |pullDir|フルパスからディレクトリ部分を取り出す|
 |repby|対象文字列中の指定文字列を置き換え文字列に置き換える|
 |separate|対象文字列を指定文字で、前後２つに分離する|
 |modifier|ファイル名から接尾拡張子を取り出す|
 |filepart|ファイル名から本体部分を取り出す|
 |pathpart|ファイルフルパスからパス部分を取り出す|
 |date|日付編集|
 |today|今日の日付をY/M/Dで返す|
 |now|今の時間をH/I/Sで返す|
 |addDays|日付演算|
 |unixTime|現在のUNIXタイムを取得する|
 |unixStamp|保存された時刻からの経過時間がlimitを超えているかを判断|
 |sort|Arrayオブジェクトのソート|
 |isExist|ファイルの存在確認|
 |mkdir|ディレクトリを作成|
 |checkDir|ディレクトが存在しない時に作成|
 |dir|ディレクトリリスト|
 |stat|ファイルの属性情報を返す|
 |getCsv|ｃｓｖファイルを読み込み、RECインターフェイスに編集|
 |getObject|JSON形式ファイル読み込み、RECインターフェイスに編集|
 |getText|テキストファイルを読み込み|
 |getJson|JSONファイルを読み込み|
 |getFs|ファイル読み込み|
 |on|イベント監視|
 |fire|イベント通知|
 |off|イベント監視の取り消し|
 |ready|逐次制御の開始|
 |wait|逐次制御での待ち合わせ|
 |post|逐次制御での待ち合わせの解除通知|
 |sleep|指定時間の待ち合わせ|
 |isDebug|デバッグモードかどうかの判定|
 |surveilance|グローバルエラーを捕捉|
 |sevierLog|重大エラー時のログ|
 |errorLog|通常エラー時のログ|
 |noticeLog|注意メッセージ|
 |warnLog|警告メッセージ|
 |infoLog|情報メッセージ|
 |debugLog|デバッグのためのログ|
 |justLog|ログのみ出力し、メッセージは表示しない|
 |notify|コミュニケーターをWEBHOOK|
 |getRequest|HTTP/Getメソッドによるメッセージ送出|
 |postRequest|HTTP/Postメソッドによるメッセージ送出|
 |getIp|自分のIpアドレスを返します|
 |shell|シェルコマンドを実行します。(完了を待ち合わせます)|
 |brakets|カッコ内を抽出|
 |base64|Base64変換|
