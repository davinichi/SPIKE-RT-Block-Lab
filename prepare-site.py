from pathlib import Path
import shutil
root=Path(__file__).resolve().parent
docs=root/'docs'
docs.mkdir(exist_ok=True)
shutil.copytree(root/'web',docs/'app',dirs_exist_ok=True)
(docs/'.nojekyll').write_text('')
(docs/'index.html').write_text('''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SPIKE-RT Block Lab</title><link rel="stylesheet" href="app/style.css"><article class="guide"><p>SBL-RT Windows · 0.3.0 実機試験版</p><h1>ブロックで考える。<br>SPIKE-RTで確かめる。</h1><p>SPIKE Prime Large Hub用のブロック編集アプリ。EBL-RTと共通する操作で作品を作り、３つのCファイルとして出力します。</p><p><a href="https://github.com/davinichi/SPIKE-RT-Block-Lab/releases">Windows版をダウンロード ↗</a>　<a href="app/index.html">ブラウザーで編集を試す →</a></p><h2>実機テストを始める</h2><ol><li>Windows ZIPをすべて展開してSBL-RT.exeを起動。</li><li>最初は「表示のみ」サンプルを保存・C生成。</li><li>準備済みDocker環境でコンパイル、またはActionsのサンプルビルドを取得。</li><li><a href="app/guide.html">事前準備・DFU・復帰ガイド</a>を確認し、<a href="app/transfer.html">書き込み・USBログ画面</a>へ。</li></ol><p><strong>本版のHubへの書き込み・起動・停止・復帰は実機未検証です。</strong>標準Hub OSを置き換えるため、Hub内の作品・設定・記録を退避してから試してください。ビルド成功と実機動作確認は別です。</p><h2>SBLと同じ15グループ・ブロックUI</h2><p>指定された公開SBLの保存版23を正本として、グループ・文言・順番・引数・選択肢を照合しました。未対応命令はデータを残して保存でき、C生成を止めます。数値変数・演算・一般的な分岐とループ、1個/2個のモーターの度・回転・秒指定、追加センサー、表示・ランプ・音、引数と戻り値のあるマイブロックに対応しました。<a href="app/comparison.html">比較・対応表</a>に制限と未対応を明記しています。同期走行、イベント、PID・CSV、４環境の作品互換は未対応です。Fはデバッグ用のためA〜Eのみ使用します。</p><p><a href="https://github.com/davinichi/SPIKE-RT-Block-Lab">ソース・テスト結果</a> ／ <a href="https://github.com/davinichi/SPIKE-RT-Block-Lab/actions">ビルド・Artifacts</a></p><p>LEGO公式アプリではありません。対象は６ポートのLarge Hubです。Essential Small Hub・EV3には対応しません。</p></article></html>''',encoding='utf8')
print(docs)
