#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
streamlit_app.py — 把原型包成 Streamlit App，變成一條可以傳給別人的網址
==========================================================================
用途：
  原型本身是純 HTML / CSS / JS。這支檔案不改動原型，只是在執行時把
  index.html + css/styles.css + js/*.js 合併成一支完整的 HTML，
  再整頁塞進 Streamlit 裡，讓它可以部署到 Streamlit Community Cloud，
  拿到一條 https://xxx.streamlit.app 的網址直接傳給別人。

怎麼用：
  本機預覽（會自動開瀏覽器）：

      pip install -r requirements.txt
      streamlit run streamlit_app.py

  部署上線：把這個資料夾推上 GitHub，到 https://share.streamlit.io
  選這個 repo、主檔案填 streamlit_app.py，按 Deploy。

注意：
  內容永遠改原始的 js/data.js，這支檔案每次重新整理都會重新合併，
  不需要跑 產生單檔.py。
=========================================================================="""

import pathlib
import re

import streamlit as st

JS_FILES = ["data.js", "screens.js", "notes.js", "app.js"]


# ===== 1. 找到原型所在的資料夾 =====
def find_app_dir():
    """支援兩種擺法：這支檔案跟 index.html 同層，或放在它的上一層。"""
    here = pathlib.Path(__file__).resolve().parent
    candidates = [here, here / "康和好日子App"]
    candidates += sorted(p for p in here.iterdir() if p.is_dir())
    for c in candidates:
        if (c / "index.html").exists():
            return c
    return None


# ===== 2. 把整個 App 合併成一支自足的 HTML（等同 產生單檔.py 的邏輯） =====
@st.cache_data(show_spinner=False)
def build_html(app_dir_str, _fingerprint):
    """_fingerprint 只是給快取用的：原始檔一改動，這裡就會重新合併。"""
    app_dir = pathlib.Path(app_dir_str)
    read = lambda rel: (app_dir / rel).read_text(encoding="utf-8")

    html = read("index.html")

    # 2-1 移除 PWA 與圖示標籤（iframe 內沒有這些檔案可以指）
    for pat in [
        r'\n<link rel="manifest" href="manifest\.json">',
        r'\n<link rel="apple-touch-icon" href="[^"]+">',
        r'\n<link rel="icon" type="image/png" href="[^"]+">',
    ]:
        html = re.sub(pat, "", html)

    # 2-2 外部樣式表 → 內嵌 <style>
    html = re.sub(
        r'<link rel="stylesheet" href="css/styles\.css">',
        lambda _: "<style>\n" + read("css/styles.css").rstrip() + "\n</style>",
        html,
    )

    # 2-3 四支 script → 內嵌單一 <script>
    js = "\n\n".join(read("js/" + f) for f in JS_FILES)
    html, n = re.subn(
        r'(?:<script src="js/\w+\.js"></script>\n?)+',
        lambda _: "<script>\n" + js.rstrip() + "\n</script>\n",
        html,
    )
    if n != 1:
        raise ValueError("index.html 的 <script> 區塊格式與預期不符")

    # 這裡刻意不動原型的任何樣式：styles.css 在 ≤860px 時會把 body 留白歸零，
    # 多加一條 body{padding} 會蓋掉它，手機版的底部導覽就會被推出畫面。
    return html


def fingerprint(app_dir):
    """所有原始檔的修改時間 + 大小，任一改動就換一組快取。"""
    files = ["index.html", "css/styles.css"] + ["js/" + f for f in JS_FILES]
    return tuple((f, (app_dir / f).stat().st_mtime_ns, (app_dir / f).stat().st_size)
                 for f in files)


# ===== 3. 頁面設定 =====
st.set_page_config(
    page_title="康和「好日子」— 銀髮退休現金流管家",
    page_icon="🌤️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# 藏掉 Streamlit 自己的頁首、留白與捲軸，讓原型看起來就是一個獨立網站
st.markdown(
    """
<style>
  /* 藏掉頁首、右上工具列、右下狀態燈 */
  header[data-testid="stHeader"],
  [data-testid="stToolbar"],
  [data-testid="stStatusWidget"],
  [data-testid="stDecoration"],
  [data-testid="stBottom"],
  #MainMenu, footer { display: none !important; }

  /* 去掉主內容區的留白與寬度上限（新舊版 Streamlit 的兩種名稱都寫） */
  .block-container,
  [data-testid="stMainBlockContainer"],
  [data-testid="stAppViewBlockContainer"],
  [data-testid="stMain"] {
    padding: 0 !important; max-width: 100% !important;
  }
  [data-testid="stVerticalBlock"] { gap: 0 !important; }
  [data-testid="stAppViewContainer"] { overflow: hidden; }

  /* 原型的 iframe 撐滿整個瀏覽器視窗（100dvh 讓手機網址列不會壓到內容） */
  iframe {
    width: 100% !important; border: 0 !important;
    height: 100vh !important; height: 100dvh !important;
  }
</style>
""",
    unsafe_allow_html=True,
)


# ===== 4. 把原型整頁放進來 =====
app_dir = find_app_dir()

if app_dir is None:
    st.error(
        "找不到 index.html。請把 streamlit_app.py 放在 康和好日子App 資料夾裡，"
        "或放在它的上一層。"
    )
    st.stop()

try:
    page = build_html(str(app_dir), fingerprint(app_dir))
except Exception as err:  # 原始檔缺一支就退回單檔備份
    backup = app_dir / "單檔版本_備份.html"
    if not backup.exists():
        st.error(f"合併失敗：{err}")
        st.stop()
    st.warning(f"合併原始檔失敗（{err}），改用 單檔版本_備份.html。")
    page = backup.read_text(encoding="utf-8")

if hasattr(st, "iframe"):        # Streamlit ≥ 1.60
    st.iframe(page, height="stretch")
else:                            # 舊版 Streamlit 的寫法
    import streamlit.components.v1 as components

    components.html(page, height=1200, scrolling=True)
