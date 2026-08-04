/* ==========================================================================
   screens.js — 五個畫面的版型
   --------------------------------------------------------------------------
   每個畫面都是一個函式，回傳 HTML 字串。
   ★ 想改「版面長相」改這裡；想改「數字內容」請改 data.js
   ★ 想新增第六個畫面：在 data.js 的 SCREENS 加一筆，再到這裡加一個函式
   ========================================================================== */

var S = {};

/* ==========================================================================
   吉祥物「小方」——純 SVG，放大縮小都不會糊
   --------------------------------------------------------------------------
   S.mk(cls)    整隻小方，cls 決定大小（mk-lg / mk-md / mk-sm / mk-av）
   S.mkSay(...) 小方 ＋ 對話泡泡（康和專區、AI 小幫手用）
   動畫（浮動、揮手、眨眼）在 styles.css，且會尊重系統的「減少動態效果」。
   台詞在 data.js 的 MASCOT。
   ========================================================================== */
S.mk = function (cls) {
  return '' +
  '<svg class="mk ' + (cls || 'mk-md') + '" viewBox="0 0 128 158" aria-hidden="true">' +
    '<ellipse cx="64" cy="152" rx="29" ry="4.5" fill="#0F4C75" opacity=".13"/>' +
    '<g class="mk-b">' +
      /* 腳與鞋 */
      '<path d="M50 122v13M78 122v13" stroke="#3F3229" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M38 142q0-8 9-8t9 8q0 4-4 4H42q-4 0-4-4z" fill="var(--brand)" stroke="#3F3229" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M72 142q0-8 9-8t9 8q0 4-4 4H76q-4 0-4-4z" fill="var(--brand)" stroke="#3F3229" stroke-width="3.2" stroke-linejoin="round"/>' +
      /* 左手 */
      '<path d="M32 102q-13 4-19 12" stroke="#3F3229" stroke-width="7.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M13 112q-7 3-5 8t9 2 5-8-9-2z" fill="#fff" stroke="#3F3229" stroke-width="3.2"/>' +
      /* 右手（揮手） */
      '<g class="mk-h">' +
        '<path d="M94 100q14-3 21-13" stroke="#3F3229" stroke-width="7.5" stroke-linecap="round" fill="none"/>' +
        '<path d="M112 84q4-6 9-2t0 10-9 2-.5-6z" fill="#fff" stroke="#3F3229" stroke-width="3.2"/>' +
      '</g>' +
      /* 身體（康和品牌紅） */
      '<path d="M32 88h62a5 5 0 015 5v22a9 9 0 01-9 9H36a9 9 0 01-9-9V93a5 5 0 015-5z" fill="var(--brand)" stroke="#3F3229" stroke-width="3.4"/>' +
      '<path d="M63 92v30" stroke="var(--brand-dk)" stroke-width="2.4"/>' +
      '<circle cx="70" cy="101" r="2" fill="#fff"/><circle cx="70" cy="111" r="2" fill="#fff"/>' +
      /* 頭頂的金色愛心 */
      '<path d="M70 20c-4-9 7-14 10-6 3-8 14-3 10 6-3 6-10 11-10 11s-7-5-10-11z" fill="var(--gold)" stroke="#3F3229" stroke-width="3.2" stroke-linejoin="round"/>' +
      /* 頭：立方體 */
      '<path d="M26 34 40 21h68L94 34z" fill="#F4F7F9" stroke="#3F3229" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="M94 34 108 21v55L94 89z" fill="#DCE4E9" stroke="#3F3229" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<rect x="26" y="34" width="68" height="55" rx="11" fill="#fff" stroke="#3F3229" stroke-width="3.4"/>' +
      /* 螢幕臉 */
      '<rect x="33" y="40" width="54" height="26" rx="10" fill="#EDF2F5" stroke="#3F3229" stroke-width="2.8"/>' +
      '<g class="mk-e">' +
        '<circle cx="48" cy="53" r="8" fill="#fff" stroke="#3F3229" stroke-width="2.6"/>' +
        '<circle cx="72" cy="53" r="8" fill="#fff" stroke="#3F3229" stroke-width="2.6"/>' +
        '<circle cx="49.5" cy="54" r="4.7" fill="#4A3B31"/><circle cx="73.5" cy="54" r="4.7" fill="#4A3B31"/>' +
        '<circle cx="47.5" cy="51.6" r="1.6" fill="#fff"/><circle cx="71.5" cy="51.6" r="1.6" fill="#fff"/>' +
      '</g>' +
      /* 嘴與腮紅 */
      '<path d="M51 72q10 12 21 0z" fill="#E39A66" stroke="#3F3229" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<ellipse cx="36" cy="76" rx="5.2" ry="3.2" fill="#F6C3C3"/>' +
      '<ellipse cx="84" cy="76" rx="5.2" ry="3.2" fill="#F6C3C3"/>' +
    '</g>' +
  '</svg>';
};

/* 小方 ＋ 對話泡泡 */
S.mkSay = function (html, cls) {
  return '' +
  '<div class="mk-row">' + S.mk(cls || 'mk-md') +
    '<div class="mk-say">' + html + '</div>' +
  '</div>';
};

/* ---------- 畫面 ①：現金流月曆 ＋ 老本試算（同一個分頁，上方左右切換）----------
   上面兩顆按鈕切換子頁，切換由 app.js 的 SUB 決定，標題與右側講稿會一起換。  */
S.cash = function () {
  return '' +
  '<div class="subtabs" id="subtabs">' +
    CASH_SUBS.map(function (s) {
      return '<button class="subtab' + (s.id === SUB ? ' on' : '') +
             '" data-sub="' + s.id + '">' + s.nm + '</button>';
    }).join('') +
  '</div>' +
  (SUB === 'calc' ? S.calc() : S.cashCal());
};

/* ---------- ①-左：現金流月曆 ----------
   若使用者在 ② 選過方案（PLAN 有值），這一頁會切換成「模擬後」的樣子：
   總額補到目標、月曆多一顆虛線金點、明細多一列。                       */
S.cashCal = function () {
  var on   = !!PLAN;
  var sum  = TOTAL + (on ? PLAN.add : 0);
  var diff = sum - CONFIG.expenseDefault;

  /* 小方的招呼語：金額卡下面那句話，會跟著實際金額變 */
  var say = on ? MASCOT.cashSim
    : (diff >= 0 ? MASCOT.cashOk : MASCOT.cashLow)
        .replace('{a}', sum.toLocaleString())
        .replace('{b}', Math.abs(diff).toLocaleString());

  return '' +
  '<div class="hero' + (on ? ' sim' : '') + '">' +
    '<div class="lbl">' + CONFIG.year + ' 年 ' + CONFIG.month + ' 月　' +
      (on ? '模擬後預計入帳' : '預計入帳') + '</div>' +
    '<div class="amt"><small>NT$</small>' + sum.toLocaleString() + '</div>' +
    (on
      ? '<div class="note">✦ 已含模擬方案：' + PLAN.nm + '　+' + PLAN.add.toLocaleString() + '</div>'
      : '<div class="note">✓ 已超過您設定的每月開銷 ' +
          CONFIG.expenseDefault.toLocaleString() + ' 元</div>') +
  '</div>' +

  /* 小方在金額卡下面說一句話（金額卡裡不放，會擠掉「已超過開銷」那一行） */
  S.mkSay(say, 'mk-sm') +

  (on
    ? '<div class="alert md"><div class="ic">✦</div><div>' +
        '<div class="t">這是模擬畫面</div>' +
        '<div class="x">投入 <b>' + PLAN.needTx + '</b> 於「' + PLAN.nm + '」之後，' +
          '您的月曆就會長成這樣，每月剛好領到 <b>' + PLAN.target.toLocaleString() + ' 元</b>。' +
          '<br>' + PLAN.freq + '</div>' +
        '<button class="ai-go" data-go="invest">請營業員幫我辦</button>' +
        '<button class="ai-go" id="planOff">取消模擬，看回原本的樣子</button>' +
      '</div></div>'
    : '') +

  '<div class="card">' +
    '<div class="cal-head"><span>‹</span><b>' + CONFIG.year + ' 年 ' + CONFIG.month + ' 月</b><span>›</span></div>' +
    '<div class="cal" id="cal"></div>' +
    '<div class="pay-list" id="paylist"></div>' +
  '</div>' +

  '<div class="card">' +
    '<h3>接下來三個月</h3>' +
    FORECAST.map(function (f) {
      return '<div class="pay-row"><span class="n">' + f.m + '</span>' +
             '<span class="v">NT$ ' + (f.v + (on ? PLAN.add : 0)).toLocaleString() + '</span></div>';
    }).join('') +
    '<div class="sub" style="margin-top:10px">' +
      (on ? '💡 加入方案後，原本入帳較少的 8 月與 10 月也一併補平了。' : FORECAST_TIP) +
    '</div>' +
  '</div>' +

  '<div class="disc">' + GENERAL_DISCLAIMER + '</div>' +

  (on ? '' : '<button class="bigbtn o" data-go="pension">我想每個月領更多 →</button>');
};

/* ---------- 畫面 ②：我的月退俸（缺口 → 商品配對）----------
   滑桿與結果由 app.js 的 pension() 動態填入 #gapbox 與 #solbox        */
S.pension = function () {
  return '' +
  '<div class="card">' +
    '<h3>我想要的月退俸</h3>' +
    '<div class="sub">拉動下面的圓球，設定您希望每個月能領到多少錢。</div>' +
    '<div class="slider-wrap">' +
      '<div class="slider-val" id="tgtVal">NT$ ' + PENSION.targetDefault.toLocaleString() + '</div>' +
      '<input type="range" id="tgt" min="' + PENSION.targetMin + '" max="' + PENSION.targetMax +
        '" step="' + PENSION.targetStep + '" value="' + PENSION.targetDefault + '">' +
      '<div class="range-ends"><span>' + (PENSION.targetMin / 10000) + ' 萬</span>' +
        '<span>' + (PENSION.targetMax / 10000) + ' 萬</span></div>' +
    '</div>' +
    '<div class="kv-row"><span>目前每月入帳</span><b>NT$ ' + TOTAL.toLocaleString() + '</b></div>' +
  '</div>' +

  '<div class="result" id="gapbox"></div>' +

  '<div id="solbox"></div>' +

  '<div class="disc">' + GENERAL_DISCLAIMER + '</div>';
};

/* ---------- ①-右：老本撐多久試算（原本的畫面 ③，現在併進 ① 的右邊）---------- */
S.calc = function () {
  return '' +
  '<div class="card">' +
    '<h3>我的老本可以撐多久？</h3>' +
    '<div class="sub">拉動下面的圓球，設定您每月大約要花多少錢。</div>' +
    '<div class="slider-wrap">' +
      '<div class="slider-val" id="expVal">NT$ ' + CONFIG.expenseDefault.toLocaleString() + '</div>' +
      '<input type="range" id="exp" min="' + CONFIG.expenseMin + '" max="' + CONFIG.expenseMax +
        '" step="' + CONFIG.expenseStep + '" value="' + CONFIG.expenseDefault + '">' +
      '<div class="range-ends"><span>' + (CONFIG.expenseMin / 10000) + ' 萬</span>' +
        '<span>' + (CONFIG.expenseMax / 10000) + ' 萬</span></div>' +
    '</div>' +
  '</div>' +

  '<div class="result" id="res">' +
    '<div class="lbl">您的資產預計可支撐到</div>' +
    '<div class="big" id="resAge">—</div>' +
    '<div class="timeline"><div class="fill" id="resFill" style="width:0%">目前 ' + CONFIG.currentAge + ' 歲</div></div>' +
    '<div class="tip" id="resTip"></div>' +
  '</div>' +

  '<div class="card"><h3>試算條件</h3>' +
    '<div class="pay-row"><span class="n">目前總資產</span><span class="v">' +
      (CONFIG.totalAssets / 10000) + ' 萬</span></div>' +
    '<div class="pay-row"><span class="n">每月被動收入</span><span class="v">' +
      TOTAL.toLocaleString() + '</span></div>' +
    '<div class="pay-row"><span class="n">假設年報酬率</span><span class="n">' +
      (CONFIG.annualReturn * 100).toFixed(1) + '%</span></div>' +
    '<div class="pay-row"><span class="n">假設通膨率</span><span class="n">' +
      (CONFIG.inflation * 100).toFixed(1) + '%</span></div>' +
  '</div>' +

  '<div class="disc">' + GENERAL_DISCLAIMER + '</div>' +

  '<button class="bigbtn p">預約營業員視訊討論</button>' +
  '<button class="bigbtn o" data-go="invest">看看能提高現金流的商品</button>';
};

/* ---------- 畫面 ④：投資商品（好日子精選）----------
   商品清單由 app.js 的 paintProducts() 填入 #prodbox                  */
S.invest = function () {
  return '' +
  '<div class="card kyc">' +
    '<div class="kyc-l">您的風險屬性</div>' +
    '<div class="kyc-v">' + CONFIG.riskProfile + '　<span class="pill rr' + CONFIG.maxRR + '">可承作至 RR' + CONFIG.maxRR + '</span></div>' +
    '<div class="sub">年齡 ' + CONFIG.currentAge + ' 歲。超過 RR' + CONFIG.maxRR + ' 的商品會標示「需加強評估」，仍可承作但須由營業員完成高齡客戶適合度程序。</div>' +
  '</div>' +

  /* RR1–RR5 白話對照：不占太多版面，一個卡片、五行字 */
  '<div class="card rr-legend">' +
    '<div class="rr-legend-h">風險等級 RR1–RR5 是什麼意思？</div>' +
    RR_LEVELS.map(function (r) {
      return '<div class="rr-row"><span class="pill rr' + r.n + '">RR' + r.n + '</span><span>' + r.tx + '</span></div>';
    }).join('') +
  '</div>' +

  '<div class="chips" id="chips">' +
    PRODUCT_CATS.map(function (c, i) {
      return '<button class="chip' + (i === 0 ? ' on' : '') + '" data-c="' + c.id + '">' + c.nm + '</button>';
    }).join('') +
  '</div>' +

  '<div id="prodbox"></div>' +

  '<div class="disc">' + INVEST_DISCLAIMER +
    '<div class="disc-x">' + GENERAL_DISCLAIMER + '</div></div>' +

  '<button class="bigbtn p">預約營業員說明商品</button>';
};

/* ---------- 畫面 ③：康和專區 ----------
   把「離開好日子、連到康和真正的服務」全部收在這一頁，分四段：
   ① 找專人（營業員名片＋樂齡專線）② 下單與研究 ③ 其他服務 ④ 防詐守門員／快訊
   標題不用文字，直接放康和 logo（以 data URI 存在 styles.css 的 .cz-logo）。 */
S.concords = function () {
  var C = CONCORDS, sn = C.senior, ad = C.advisor, sc = C.scam;

  return '' +
  /* ===== 小方帶路 ＋ 帳號狀態（logo 已移到標題列與桌機頁首，這裡不重複）===== */
  '<div class="card cz-head">' +
    S.mkSay(MASCOT.concords, 'mk-md') +
    '<div class="cz-bind">✓ ' + C.bind + '</div>' +
  '</div>' +

  /* ===== ① 找專人 ===== */
  '<div class="sec-h">找專人</div>' +

  '<div class="card cz-nc">' +
    '<div class="cl-head">' +
      '<div class="avatar">' + ADVISOR.name.charAt(0) + '</div>' +
      /* 分兩行：一行放不完會在「服務人員」中間斷字，很難看 */
      '<div><div class="cl-nm">' + ADVISOR.name + '</div>' +
      '<div class="cl-sub">' + ad.sub + '<br>' + ADVISOR.branch + '</div></div>' +
    '</div>' +
    '<button class="pick" id="czCall">' + ad.call + '</button>' +
  '</div>' +

  '<a class="bigbtn t cz-b" id="czTel" data-tel="' + sn.tel + '">' +
    '<svg class="cz-ic" viewBox="0 0 24 24">' + CZ_ICONS.phone + '</svg>' +
    '<span class="cz-tx">' + sn.nm + '　' + sn.no + '<i>' + sn.sub + '</i></span>' +
  '</a>' +

  /* ===== ② 下單與研究 ===== */
  '<div class="sec-h">下單與研究</div>' +
  S.concordsZone() +

  /* ===== ③ 其他服務（兩欄格）===== */
  '<div class="sec-h">康和其他服務</div>' +
  '<div class="cz-grid">' +
    CONCORDS.links.map(function (l, i) {
      return '<a class="cz-t" data-cz="' + i + '"' +
             (l.tel ? ' data-tel="' + l.tel + '"' : '') + '>' +
        '<svg viewBox="0 0 24 24">' + CZ_ICONS[l.ic] + '</svg>' +
        '<b>' + l.nm + '</b><i>' + l.sub + '</i></a>';
    }).join('') +
  '</div>' +

  /* ===== ④ 防詐守門員 ===== */
  '<div class="sec-h">' + sc.t + '</div>' +
  '<div class="card">' +
    '<div class="sub">' + sc.x + '</div>' +
    '<textarea class="cz-in" id="czScamIn" rows="3" placeholder="' + sc.ph + '"></textarea>' +
    '<button class="pick" id="czScamGo">' + sc.btn + '</button>' +
    '<div id="czScamOut"></div>' +
  '</div>' +

  /* ===== ⑤ 康和快訊 ===== */
  '<div class="sec-h">康和快訊</div>' +
  '<div class="card">' +
    CONCORDS.news.map(function (n, i) {
      return '<div class="cz-nw' + (i ? ' bd' : '') + '">' +
        '<div class="cz-nw-t">' + n.t + '</div>' +
        '<div class="cz-nw-x">跟您的關係：' + n.x + '</div></div>';
    }).join('') +
    '<div class="sub" style="margin-top:12px">快訊內容為示意，實際版會接康和投顧的研究報告。</div>' +
  '</div>' +

  '<div class="disc">' + GENERAL_DISCLAIMER + '</div>';
};

/* ---------- 共用區塊：康和專區的兩顆大按鈕 ----------
   跳去掌先機下單 App、開康和投顧網站。
   想在別的畫面也放一組，就在那個畫面的字串裡加一次 S.concordsZone()，
   行為由 app.js 的 initConcordsZone() 自動接上，不用另外寫程式。

   網址刻意不寫在這裡的 href：一律由 app.js 從 CONCORDS 填入。
   這樣 產生單檔.py 的「不得有外部參照」檢查才過得去。               */
S.concordsZone = function () {
  var a = CONCORDS.app, s = CONCORDS.site;
  return '' +
  '<div class="cz">' +
    '<button class="bigbtn p cz-b" id="czApp">' +
      '<svg class="cz-ic" viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/>' +
      '<path d="M10.5 5.6h3"/><path d="M9.3 15.2l2.6-3.1 2 1.7 2.8-3.6"/></svg>' +
      '<span class="cz-tx">開啟' + a.nm + '下單<i>' + a.sub + '</i></span>' +
    '</button>' +
    '<a class="bigbtn o cz-b" id="czSite" target="_blank" rel="noopener noreferrer">' +
      '<svg class="cz-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>' +
      '<path d="M3.3 9.5h17.4M3.3 14.5h17.4M12 3a16 16 0 000 18M12 3a16 16 0 010 18"/></svg>' +
      '<span class="cz-tx">' + s.nm + '<i>' + s.sub + '</i></span>' +
    '</a>' +
  '</div>';
};

/* ==========================================================================
   營業員視角：三個畫面（看的是同一套客戶行為資料）
   ========================================================================== */

/* ---------- 營⓵：今日待辦 ---------- */
S.advToday = function () {
  return '' +
  '<div class="hero adv" id="advHero"></div>' +

  '<div class="sec-h">今天該打的電話（依缺口大小排序）</div>' +
  '<div id="advTodo"></div>' +

  '<div class="disc">缺口換算以「月配息債券基金」年配 ' +
    (ADV_CONV.yield * 100).toFixed(1) + '%、申購手續費 ' +
    (ADV_CONV.feeRate * 100).toFixed(1) + '% 估算，僅供內部參考，非承諾業績。</div>';
};

/* ---------- 營⓶：我的客戶 ---------- */
S.advList = function () {
  return '' +
  '<div class="card kyc">' +
    '<div class="kyc-l">' + ADVISOR.branch + '</div>' +
    '<div class="kyc-v">' + ADVISOR.name + '　<span class="pill rr3">管理 ' +
      ADVISOR.clientCount + ' 位</span></div>' +
    '<div class="sub">本週收到 <b>' + ADVISOR.signalsWeek +
      '</b> 則客戶意圖訊號。訊號來自客戶在 App 裡的實際行為，不是問卷、也不是推測。</div>' +
  '</div>' +

  '<div class="sec-h">意圖訊號（熱度由高到低）</div>' +
  '<div id="advClients"></div>';
};

/* ---------- 營⓷：客戶詳情 ---------- */
S.advClient = function () {
  return '' +
  '<div class="card">' +
    '<div class="cl-head">' +
      '<div class="avatar">陳</div>' +
      '<div><div class="cl-nm">陳伯伯</div>' +
      '<div class="cl-sub">68 歲　·　穩健型　·　AUM 700 萬</div></div>' +
      '<span class="pill hot3">熱度高</span>' +
    '</div>' +
    '<div class="kv-row"><span>每月現金流缺口</span><b>12,140 元</b></div>' +
    '<div class="kv-row"><span>換算可承接規模</span><b>265 萬</b></div>' +
    '<div class="kv-row"><span>預估手續費收入</span><b>39,750 元</b></div>' +
  '</div>' +

  '<div class="sec-h">他在 App 裡做了什麼</div>' +
  '<div class="card">' +
    CLIENT_TIMELINE.map(function (e) {
      return '<div class="tl"><div class="tl-t">' + e.t + '</div>' +
             '<div class="tl-x">' + e.x + '</div></div>';
    }).join('') +
  '</div>' +

  '<div class="alert ok"><div class="ic">✓</div><div>' +
    '<div class="t">系統建議的切入點</div>' +
    '<div class="x">他昨晚看了「月配息債券基金」3 分鐘卻沒有下一步，' +
      '今天又把目標從 5.5 萬拉到 7 萬——<b>是在比較、不是在猶豫</b>。' +
      '建議直接談這一檔，並主動說明手續費折扣。</div>' +
  '</div></div>' +

  '<button class="bigbtn p">撥打電話　0912-XXX-XXX</button>' +
  '<button class="bigbtn o">排一場視訊說明</button>';
};

/* ---------- 畫面 ⑤：AI 小幫手 ---------- */
S.ai = function () {
  return '' +
  '<div class="alert md"><div class="ic">✦</div><div>' +
    '<div class="t">' + AI_PUSH.t + '</div>' +
    '<div class="x">' + AI_PUSH.x + '</div>' +
    '<button class="ai-go" data-go="pension">看補平方案</button>' +
  '</div></div>' +

  '<div class="chat" id="chat">' +
    '<div class="bbr">' + S.mk('mk-av') + '<div class="bb ai">' + MASCOT.ai + '</div></div>' +
  '</div>' +

  '<div class="quick" id="quick">' +
    '<div class="list-title">常見問題（點一下就問）</div>' +
    AI_QUICK.map(function (q) {
      return '<button class="qbtn" data-q="' + q + '">' + q + '</button>';
    }).join('') +
  '</div>' +

  '<button class="mic" id="mic">' +
    '<svg class="mic-ic" viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="11" rx="3"/>' +
    '<path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7"/></svg>' +
    '<span id="micTx">按住說話</span></button>' +

  '<div class="disc">' + AI_DISCLAIMER +
    '<div class="disc-x">' + GENERAL_DISCLAIMER + '</div></div>';
};
