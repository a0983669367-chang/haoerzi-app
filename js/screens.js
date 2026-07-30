/* ==========================================================================
   screens.js — 五個畫面的版型
   --------------------------------------------------------------------------
   每個畫面都是一個函式，回傳 HTML 字串。
   ★ 想改「版面長相」改這裡；想改「數字內容」請改 data.js
   ★ 想新增第六個畫面：在 data.js 的 SCREENS 加一筆，再到這裡加一個函式
   ========================================================================== */

var S = {};

/* ---------- 畫面 ①：現金流月曆 ----------
   若使用者在 ② 選過方案（PLAN 有值），這一頁會切換成「模擬後」的樣子：
   總額補到目標、月曆多一顆虛線金點、明細多一列。                       */
S.cash = function () {
  var on  = !!PLAN;
  var sum = TOTAL + (on ? PLAN.add : 0);

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

  '<div id="solbox"></div>';
};

/* ---------- 畫面 ③：老本撐多久試算 ---------- */
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

  '<div class="chips" id="chips">' +
    PRODUCT_CATS.map(function (c, i) {
      return '<button class="chip' + (i === 0 ? ' on' : '') + '" data-c="' + c.id + '">' + c.nm + '</button>';
    }).join('') +
  '</div>' +

  '<div id="prodbox"></div>' +

  '<div class="disc">' + INVEST_DISCLAIMER + '</div>' +

  '<button class="bigbtn p">預約營業員說明商品</button>';
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
    '<div class="bb ai">' + AI_INTRO + '</div>' +
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

  '<div class="disc">' + AI_DISCLAIMER + '</div>';
};
