# SBL-RT Windows 0.1.1

SPIKE Prime Large Hub向け、ブロックでCプログラムを作るWindows x64試作版。
EBL-RTの作品操作・編集・生成・転送パネルを参考にした独立アプリです。

## 起動

ReleasesのSBL-RT-Windows-0.1.1.zipをすべて展開し、SBL-RT.exeを起動します。
編集とC生成はオフラインで動作します。完全なSPIKE-RTコンパイラ環境は同梱しません。
ローカルDockerビルドには利用者が準備した公式SDK v0.2.0（サブモジュール含む）、Git、Docker、公式richイメージが必要です。
アプリはSDKをコピーしてビルドし、元のSDKを変更しません。

## 対応範囲

- 単一スタート、画像4種類、待機、時間指定モーター（90/180/360度毎秒、正逆転、A〜E）
- 回数ループ、無限ループ、距離センサーの条件分岐
- 引数なしマイブロック定義と呼び出し（再帰不可）
- .sblrt作品の保存・読込・ローカル自動保存
- app.c / sbl_myblocks.c / sbl_rt_runtime.c とヘッダー・cfg・cdl・Makefile.incの出力
- 用意済みDocker環境でのビルド呼び出し
- Chrome / EdgeのWebUSB DFU書込・USBシリアルログ画面

未対応：変数・演算、引数・戻り値、イベント・複数スタート・周期タスク、角度指定・同期移動、色・フォース・姿勢・音・PID・CSV。
EBL、EBL-RT、SBLの既存作品の直接読込と4環境互換は未実装です。
将来の共通モデルへのアダプターを設けられるよう、Blocklyから版付きのDOM非依存プログラムデータへ変換して生成します。

## 実機テスト

本版のHubへの書込、起動、停止、標準OSへの復帰は実機未検証です。
既存Toolkitの過去の実機成功記録を本版の検証結果として扱いません。
DFU転送完了は全バイト読み戻し照合ではありません。
中央ボタンで開始・停止します。最初は機器を外した表示のみサンプルから試します。
[導入・復帰ガイド](web/guide.html)を先に参照してください。

## 開発

Node.js 24で `npm test`。ブラウザー版は `node server.mjs` を実行し表示されたlocalhostをChrome / Edgeで開きます。
Electron 45.2.1で `electron .`。Electronは別途準備してください。
GitHub Actionsはサンプルの実コンパイルとPages公開を行います。Artifactsのsample-firmwareは自分で編集中の作品とは別です。

## 検証の区別

TEST_RESULTS.mdにローカル自動試験・Windows起動試験・公式ツールチェーン試験・実機試験の実施有無を記録します。
生成物のtarget.jsonはhardwareTested:falseです。

LEGO公式アプリではありません。出典とライセンスはTHIRD_PARTY.md。

## 0.1.1 ポートFの訂正

公式SPIKE-RT v0.2.0ではFはデバッグUART用に予約されています。0.1.0でFを提示した点を訂正し、選択・生成・作品読込の段階で拒否します。SDKの非公式F開放パッチは適用していません。
参考: https://qiita.com/koushiro/items/480559806f5572902c5c
一次根拠: https://github.com/spike-rt/pybricks-micropython/blob/abb77e921453c15bf8155feedc637e364f20f55c/lib/pbio/platform/prime_hub_spike-rt/pbdrvconfig.h
