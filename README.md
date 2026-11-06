# SBL-RT Windows 0.3.1

SPIKE Prime Large Hub向けのブロック編集・C生成Windows試作版。指定された公開SBLのSites保存版23（commit 9c81c6fab69737319230440b38a215ba2ee7a3aa）を正本として、同じ15グループ・文言・順番・引数・選択肢を使います。実機未検証です。

## 起動・公開先

https://davinichi.github.io/SPIKE-RT-Block-Lab/

ReleasesからWindows ZIPをすべて通常の書き込み可能なフォルダーへ展開してSBL-RT.exeを起動します。インストール・管理者権限は不要。未署名です。編集とC生成はオフラインで動きます。完全なSDK・コンパイラは同梱しません。

## 追加した範囲

- モーター1個・2個の連続、度・回転・秒指定、パワー、ブレーキ・惰性・保持
- 距離・有効判定、反射光・周囲光、フォース、左右ボタン、タイマー、電圧、エンコーダ
- 数値変数、算術・比較・論理、数学関数、丸め・剰余・範囲制限
- if/else-if/else、回数、while/until、条件待ち、終了
- 画像・数値・画素・定数文字、ランプ、音
- 数値引数２個と戻り値１個のマイブロック

常にA〜Eのみ。Fは公式SPIKE-RT v0.2.0のデバッグUART用です。SDKの非公式開放パッチは適用しません。２個のモーターは独立制御で同期補正なし。速さ100%は1050度/秒の指令値でPWMパワーと区別します。

保存・読込、未知ブロック・不正ポートの拒否、版付きIRからの生成、中央ボタン停止・異常停止、３ファイルの分割コンパイルまで対応します。旧.sblrtは読み込めます。

未対応：複数スタートとイベント、車体の距離移動・旋回・同期補正、加減速、色番号・姿勢角、PID、CSV、文字変数・リスト、可変数引数・複数戻り値、既存SBL/EBL作品の直接読込と４環境共通形式。詳細は [比較・対応表](web/comparison.html)。画面に未実装ブロックを対応済みとして並べていません。

## ビルドと検証

Node.js 24で `npm install --ignore-scripts` → `npm test`。`node server.mjs` でブラウザー版を起動。Electron45.2.1を別途用意すれば `electron .` でデスクトップ起動。

ローカルビルドには利用者が準備したGit、Docker、依存を取得済みの公式SPIKE-RT v0.2.0、公式richイメージが必要です。SDKをコピーした領域でビルドし、元SDKは変更しません。

GitHub Actionsは、公式SDKを変更せず、公式指定のARM GCC10.3-2021.10でサンプルをビルドします。生成Cは app.c / sbl_myblocks.c / sbl_rt_runtime.c の３つです。

TEST_RESULTS.mdとActionsの完了状態を確認してください。ビルド成功は実機動作の証拠ではありません。Hub書込・起動・停止時間・抜線・再起動・標準OS復帰は未検証です。最初は機器を外してdisplay.binから始めてください。

[導入・DFU・標準環境への復帰](web/guide.html) ／ [ソースの出典・ライセンス](THIRD_PARTY.md)

LEGO公式アプリではありません。Fの制約を確認する際の参考資料: https://qiita.com/koushiro/items/480559806f5572902c5c

## SBL UI contract in 0.3.1

The seven files in web/sbl-reference are unchanged copies of the retrieved published SBL source. provenance.json records their SHA-256 hashes. The previous local SBL 0.7.0 files match this published source. The live page itself returned 403; the authenticated Sites source repository supplied the saved version's exact commit. No SBL source or Site was edited.

All 15 category names and their order, 119 static palette entries (including different variants of the same block), and 141 definition signatures are checked against tests/fixtures/sbl-ui-v23.json, generated independently from the retrieved SBL source. The signature covers visible fields, menu options, input names/types, colours and connection shape. Random variable IDs are normalized only during comparison. Dynamic variable/procedure/argument categories use the unchanged SBL callbacks. The standard Japanese labels and Zelos renderer are enabled. Legacy-only blocks remain loadable for old SBL-RT projects but are not added to the canonical palette.

The RT-specific difference is capability warnings and explicit export errors. Unsupported commands and F port values can be edited, saved and loaded without remapping. Unknown definitions or malformed ports are rejected before loading, leaving the current project and original file intact. This does not implement direct .spikelab/.ev3lab import. Full execution compatibility across the four environments remains future work.

SBL-style procedure definitions/calls, two named numeric arguments, one return, early returns and distance/reflection/force comparisons translate to the existing three-C-file backend. The SBL dialog may store up to eight arguments/outputs, preserving the original interface; values beyond the RT backend's 2/1 limits block generation. Parameter assignment is currently unsupported. Numeric display remains -99..99 with fractional truncation, unlike SBL scrolling; see web/comparison.html for all limits.

Run node audit-sbl.mjs to render the per-category comparison and complete machine-readable audit record, then python prepare-site.py for Pages. Run npm test for the equality and project-preservation checks. Native UI integration is available through SBL_SMOKE=1 and SBL_UI_SMOKE=1 (no Hub access).
