#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產生單檔.py — 把整個 App 合併成一支 單檔版本_備份.html
==========================================================================
用途：
  想把原型直接寄給別人、或在沒有網路的電腦上雙擊開啟時使用。
  合併後的檔案沒有任何外部參照，一支檔案就是完整的 App。

怎麼用：
  改完 js/data.js 之後，在這個資料夾裡執行一次：

      python3 產生單檔.py

  就會覆蓋 單檔版本_備份.html。

注意：
  單檔版本是「產生出來的結果」，不是原始碼。
  永遠改 js/data.js，不要直接改單檔。
=========================================================================="""

import datetime
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).resolve().parent
OUT = BASE / "單檔版本_備份.html"
JS_FILES = ["data.js", "screens.js", "notes.js", "app.js"]


def read(rel):
    p = BASE / rel
    if not p.exists():
        sys.exit(f"✗ 找不到 {rel}，請確認在 康和好日子App 資料夾裡執行。")
    return p.read_text(encoding="utf-8")


def main():
    html = read("index.html")
    css = read("css/styles.css")
    js = "\n\n".join(read("js/" + f) for f in JS_FILES)

    # 1. 移除 PWA 專屬標籤（單檔版沒有 manifest 與圖示檔可以指）
    for pat in [
        r"\n<!-- ===== PWA 設定（讓手機可以「加到主畫面」變成 App） ===== -->",
        r'\n<link rel="manifest" href="manifest\.json">',
        r'\n<link rel="apple-touch-icon" href="assets/icons/icon-192\.png">',
        r'\n<link rel="icon" type="image/png" href="assets/icons/icon-192\.png">',
    ]:
        html = re.sub(pat, "", html)

    # 2. 外部樣式表 → 內嵌 <style>
    link = '<link rel="stylesheet" href="css/styles.css">'
    if link not in html:
        sys.exit("✗ index.html 裡找不到樣式表連結，請檢查是否被改過。")
    html = html.replace(link, "<style>\n" + css.rstrip() + "\n</style>")

    # 3. 四支 script → 內嵌單一 <script>
    html, n = re.subn(
        r'<!-- ===== 程式碼.*?-->\n(?:<script src="js/\w+\.js"></script>\n)+',
        "<script>\n" + js.rstrip() + "\n</script>\n",
        html,
        flags=re.S,
    )
    if n != 1:
        sys.exit("✗ index.html 裡的 <script> 區塊格式與預期不符，請檢查是否被改過。")

    # 4. 檔頭註記
    stamp = datetime.date.today().strftime("%Y-%m-%d")
    sw = re.search(r"haoerzi-(v\d+)", read("service-worker.js"))
    ver = sw.group(1) if sw else "?"
    html = html.replace(
        "<!DOCTYPE html>",
        f"""<!DOCTYPE html>
<!--
  康和「好日子」— 銀髮退休現金流管家　【單檔版本】
  ------------------------------------------------------------------
  這支檔案是由 index.html + css/ + js/ 自動合併產生的，方便單獨寄送或
  雙擊開啟。要修改內容請改原始的 js/data.js，改完後執行 產生單檔.py
  重新產生一次，不要直接改這裡。
  產生日期：{stamp}　·　對應 service-worker 版本：{ver}
  ------------------------------------------------------------------
-->""",
    )

    # 5. 檢查沒有殘留的外部參照
    #    這裡要抓的是「還沒內嵌的檔案」。錨點（#）、已內嵌的 data URI，
    #    以及 tel: / mailto: 這類動作連結都不是檔案，要排除掉。
    #    連到康和網站的 http(s) 連結寫在 js/data.js 的字串裡（由程式填 href），
    #    不會出現在這裡的靜態 HTML，所以不受影響。
    left = re.findall(r'(?:src|href)="(?!#|data:|tel:|mailto:)([^"]+)"', html)
    if left:
        sys.exit(f"✗ 還有外部參照未內嵌：{left}")

    OUT.write_text(html, encoding="utf-8")
    kb = len(html.encode("utf-8")) / 1024
    print(f"✓ 已產生 {OUT.name}（{kb:.0f} KB，無外部參照）")


if __name__ == "__main__":
    main()
