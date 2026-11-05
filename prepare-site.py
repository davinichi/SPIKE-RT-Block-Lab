from pathlib import Path
import shutil
root=Path(__file__).resolve().parent
docs=root/'docs'
docs.mkdir(exist_ok=True)
shutil.copytree(root/'web',docs/'app',dirs_exist_ok=True)
(docs/'.nojekyll').write_text('')
(docs/'index.html').write_text('''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SPIKE-RT Block Lab</title><link rel="stylesheet" href="app/style.css"><article class="guide"><p>SBL-RT Windows · 0.1.0 実機試験版</p><h1>ブロックで考える。<br>SPIKE-RTで確かめる。</h1><p>SPIKE Prime Large Hub用のブロック編集アプリ。EBL-RTと共通する操作で作品を作り、３つのCファイルとして出力します。</p><p><a href="https://github.com/davinichi/SPIKE-RT-Block-Lab/releases">Windows版をダウンロード ↗</a>　<a href="app/index.html">ブラウザーで編集を試す →</a></p><h2>実機テストを始める</h2><ol><li>Windows ZIPをすべて展開してSBL-RT.exeを起動。</li><li>最初は「表示のみ」サンプルを保存・C生成。</li><li>準備済みDocker環境でコンパイル、またはActionsのサンプルビルドを取得。</li><li><a href="app/guide.html">事前準備・DFU・復帰ガイド</a>を確認し、<a href="app/transfer.html">書き込み・USBログ画面</a>へ。</li></ol><p><strong>本版のHubへの書き込み・起動・停止・復帰は実機未検証です。</strong>標準Hub OSを置き換えるため、Hub内の作品・設定・記録を退避してから試してください。ビルド成功と実機動作確認は別です。</p><h2>初版の対応範囲</h2><p>単一スタート、表示、待機、時間指定モーター、繰り返し、距離分岐、引数なしマイブロック。既存EBL/SBL作品の直接読込、４環境互換、変数・演算、イベント、同期移動、PIDなどは未対応です。</p><p><a href="https://github.com/davinichi/SPIKE-RT-Block-Lab">ソース・テスト結果</a> ／ <a href="https://github.com/davinichi/SPIKE-RT-Block-Lab/actions">ビルド・Artifacts</a></p><p>LEGO公式アプリではありません。対象は６ポートのLarge Hubです。Essential Small Hub・EV3には対応しません。</p></article></html>''',encoding='utf8')
print(docs)
