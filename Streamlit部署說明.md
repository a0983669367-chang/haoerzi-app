# 用 Streamlit 產生一條可以傳給別人的網址

原型本身是純 HTML/CSS/JS。`streamlit_app.py` 不改動原型，只是在執行時把
`index.html` + `css/styles.css` + `js/*.js` 合併成一支完整的 HTML，
再整頁塞進 Streamlit，讓它可以部署到 Streamlit Community Cloud（免費）。

看到的畫面跟雙擊 `index.html` 完全一樣：Streamlit 的頁首、選單、留白都藏起來了。

---

## 一、先在自己電腦上看一次

```bash
cd 康和好日子App
pip install -r requirements.txt
streamlit run streamlit_app.py
```

瀏覽器會自動打開 <http://localhost:8501>。
這條網址只有你自己的電腦看得到，還不能傳給別人。

## 二、推上 GitHub

Streamlit Community Cloud 只認 GitHub 上的程式碼，所以要先把資料夾推上去。

1. 到 <https://github.com/new> 開一個 repo（名字例如 `haoerzi-app`，Public 或 Private 都可以）
2. 在 **`康和好日子App` 資料夾裡**執行（把網址換成你剛開的 repo）：

```bash
cd 康和好日子App
git init
git add .
git commit -m "康和好日子 App 原型"
git branch -M main
git remote add origin https://github.com/<你的帳號>/haoerzi-app.git
git push -u origin main
```

> 把 `康和好日子App` 這個資料夾本身當成 repo 的根目錄，
> `streamlit_app.py` 和 `requirements.txt` 就都在根目錄，設定最單純。

## 三、部署

1. 到 <https://share.streamlit.io>，用 GitHub 帳號登入
2. 按 **Create app** → **Deploy a public app from GitHub**
3. 填三格：
   - Repository：`<你的帳號>/haoerzi-app`
   - Branch：`main`
   - Main file path：`streamlit_app.py`
4. （可選）按 Advanced settings，Python version 選 3.11
5. 按 **Deploy**，等 1～3 分鐘

完成後會拿到一條網址，例如：

```
https://haoerzi-app.streamlit.app
```

這條就是可以傳給別人的網址，手機、電腦、任何瀏覽器直接開都可以，
對方不用安裝任何東西、不用登入。

## 四、之後要改內容

改 `js/data.js`（金額、商品、AI 問答……），然後：

```bash
git add .
git commit -m "更新資料"
git push
```

Streamlit Cloud 會自己重新部署，網址不變。
**不需要**再跑 `產生單檔.py`——`streamlit_app.py` 每次都會重新合併原始檔。

---

## 幾件要知道的事

| 事情 | 說明 |
|---|---|
| 會睡著 | 免費方案的 App 沒人開超過幾天會進入休眠，下次有人開需要等 30 秒左右喚醒。傳給重要的人之前先自己開一次。 |
| 網址結尾 | 想在別的網頁裡嵌入時，網址加上 `?embed=true` 可以更乾淨。直接傳給別人不用加。 |
| 語音輸入 | AI 小幫手的麥克風在 iframe 裡可能被瀏覽器擋掉，這時會自動退回模擬問答（原型本來就有這個備援）。 |
| 加到主畫面 | 這個做法是把原型放在 iframe 裡，PWA 的「加到主畫面」不會生效。需要 PWA 的話用下面的靜態空間。 |
| 只想要一條網址 | 其實不一定要 Streamlit。把整個資料夾拖到 <https://app.netlify.com/drop> 也會馬上得到一條網址，而且 PWA、離線快取都能用。Streamlit 的好處是之後想接 Python（真的試算、後端資料）比較方便。 |

## 檔案

```
streamlit_app.py        Streamlit 外殼（合併原型 + 藏掉 Streamlit 介面）
requirements.txt        部署時要裝的套件
.streamlit/config.toml  配色設定（對齊 styles.css 的 :root）
```
