#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產生QRcode.py — 依 js/data.js 的 DEPLOY.url 重新產生 QR code，寫回 css/styles.css
==========================================================================
用途：
  桌機簡報畫面右側有一張「手機掃描開啟 App」的小卡片，點下去會放大成
  一個大 QR code 浮層，方便台下的人掃描。兩個尺寸共用同一張圖，內嵌在
  css/styles.css 裡的 base64 圖檔（跟康和 logo 的做法一樣，這樣單檔版本
  才不會有外部參照），夾在 `QR:BEGIN` / `QR:END` 兩行註解中間。

網址改變時（例如 Streamlit 重新部署、換了網址），流程是：
  1. 改 js/data.js 的 DEPLOY.url
  2. 在這個資料夾執行一次：python3 產生QRcode.py
  3. 再執行一次：python3 產生單檔.py（同步單檔版本）

只改第 1 步、忘記做第 2 步的話，畫面上顯示的網址文字會跟 QR code
實際掃出來的網址對不上——網址一律從 data.js 讀，不會有第二個地方要改，
但重新產圖這個動作沒辦法自動做，還是得手動跑一次這支腳本。

第一次使用前，需要安裝一次：
    pip3 install qrcode[pil]
==========================================================================
"""

import base64
import io
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).resolve().parent
DATA_JS = BASE / "js/data.js"
CSS = BASE / "css/styles.css"

try:
    import qrcode
except ImportError:
    sys.exit(
        "✗ 尚未安裝 qrcode 套件。\n"
        "  請先執行：pip3 install qrcode[pil]\n"
        "  安裝好之後再重新執行這支腳本一次。"
    )


def get_url():
    if not DATA_JS.exists():
        sys.exit(f"✗ 找不到 {DATA_JS}，請確認在 康和好日子App 資料夾裡執行。")
    src = DATA_JS.read_text(encoding="utf-8")
    m = re.search(r'var DEPLOY\s*=\s*\{.*?url:\s*"([^"]+)"', src, re.S)
    if not m:
        sys.exit("✗ 在 js/data.js 找不到 DEPLOY.url，請確認那個區塊沒有被改壞格式。")
    return m.group(1)


def main():
    url = get_url()

    # box_size 大一點（原本 8）是因為同一張圖現在有兩個用途：
    # 右側小卡（84px）跟點開的放大浮層（最大到 280px）都用它，
    # 圖片原生解析度不夠大，放大浮層裡的 QR 會糊、可能掃不出來。
    img = qrcode.make(
        url,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=3,
    ).convert("RGB")

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    if not CSS.exists():
        sys.exit(f"✗ 找不到 {CSS}。")
    css = CSS.read_text(encoding="utf-8")

    pattern = r"(?<=QR:BEGIN —)([\s\S]*?)(?=/\* QR:END \*/)"
    if not re.search(pattern, css):
        sys.exit(
            "✗ 在 css/styles.css 找不到 QR:BEGIN / QR:END 標記，"
            "請確認樣式表的 QR 區塊沒有被改壞。"
        )

    new_block = (
        " 這個規則由 產生QRcode.py 自動改寫，不要手動編輯這裡面的內容 */\n"
        ".qr-card .qr-img,.qr-zoom-box .qr-img-big{background:#fff no-repeat "
        'center/contain url("data:image/png;base64,' + b64 + '")}\n'
    )
    css = re.sub(pattern, new_block, css, count=1)
    CSS.write_text(css, encoding="utf-8")

    kb = len(b64) * 3 / 4 / 1024
    print(f"✓ 已依網址 {url}")
    print(f"  重新產生 QR code（約 {kb:.1f} KB，含小卡與放大兩種尺寸共用），寫入 css/styles.css")
    print("  記得接著執行 python3 產生單檔.py 同步單檔版本。")


if __name__ == "__main__":
    main()
