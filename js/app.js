/* ==========================================================================
   app.js — 程式邏輯
   --------------------------------------------------------------------------
   一般情況下不用改這個檔案。
   要改數字 → data.js ／ 要改版型 → screens.js ／ 要改講稿 → notes.js
   ========================================================================== */

(function () {
  'use strict';

  var ROLE    = 'client';   // client | advisor
  var current = 'cash';
  var fontIdx = 0;          // 目前字級（對應 FONT_STEPS）
  var orderKey = null;      // 投資頁展開中的申購試算是哪一檔商品
  var PENDING_ASK = null;   // 從投資頁按「問小幫手」點過來時，要自動問的商品名稱

  function screens() { return ROLE === 'advisor' ? SCREENS_ADVISOR : SCREENS_CLIENT; }

  /* ---------- 啟動 ---------- */
  function init() {
    buildRoles();
    bindOnce();
    paintFooter();
    paintQR();
    paintChrome();
    render(screens()[0].id);
    registerServiceWorker();
  }

  /* 桌機版頁尾的風險揭露，跟 App 內共用 data.js 的同一份文字 */
  function paintFooter() {
    var el = document.getElementById('footDisc');
    if (el) el.textContent = GENERAL_DISCLAIMER;
  }

  /* 桌機版右側的「手機掃描開啟」QR code。
     只在啟動時畫一次——它跟右側講稿是兩個獨立的容器，切頁不會把它洗掉。
     QR 圖片本身是內嵌在 css 的 .qr-card .qr-img（data URI），
     這裡只負責填文字；改網址、重產圖片請看 data.js 的 DEPLOY 註解。 */
  function paintQR() {
    var el = document.getElementById('qrCard');
    if (!el) return;
    el.innerHTML =
      '<div class="qr-img" aria-hidden="true"></div>' +
      '<div class="qr-tx"><b>' + DEPLOY.label + '</b>' +
      '<span>' + DEPLOY.url.replace(/^https?:\/\//, '') + '</span></div>';
  }

  /* 只綁一次的事件（元素本身不會被換掉，只換 innerHTML） */
  function bindOnce() {
    document.getElementById('roles').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) setRole(b.dataset.r);
    });
    document.getElementById('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) render(b.dataset.s);
    });
    document.getElementById('nav').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) render(b.dataset.s);
    });
    /* 畫面內任何 [data-go] 按鈕都能跳頁 */
    document.getElementById('body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      /* 跳回 ① 一律停在月曆那一邊（會用到的情境都是要看月曆） */
      if (b.dataset.go === 'cash') SUB = 'cal';
      render(b.dataset.go);
    });
    document.getElementById('a11y').addEventListener('click', stepFont);
  }

  /* ---------- 身分切換 ---------- */
  function buildRoles() {
    document.getElementById('roles').innerHTML = ROLES.map(function (r) {
      return '<button class="role' + (r.id === ROLE ? ' on' : '') + '" data-r="' + r.id + '">' +
        r.nm + '<span>' + r.who + '</span></button>';
    }).join('');
  }

  function setRole(r) {
    if (r === ROLE) return;
    ROLE = r;
    setActive('#roles .role', r, 'r');
    paintChrome();
    render(screens()[0].id);
  }

  /* 重繪頁籤、底部導覽、問候語 */
  function paintChrome() {
    document.getElementById('greet').textContent =
      (ROLE === 'advisor' ? ADVISOR.name : CONFIG.userName) + '，早安';

    document.getElementById('tabs').innerHTML = screens().map(function (s) {
      return '<button class="tab" data-s="' + s.id + '">' + s.tab + '</button>';
    }).join('');

    document.getElementById('nav').innerHTML = screens().map(function (s) {
      return '<button data-s="' + s.id + '">' +
        '<svg viewBox="0 0 24 24">' + NAV_ICONS[s.id] + '</svg>' + s.nav + '</button>';
    }).join('');
  }

  /* ---------- 切換並繪製畫面 ---------- */
  function render(key) {
    if (!S[key]) return;
    current = key;
    closeSheet();

    var meta = screens().filter(function (s) { return s.id === key; })[0];
    if (!meta) return;

    /* 畫面 ① 有兩個子頁，標題與講稿要跟著左右切換 */
    var sub = (key === 'cash') ? curSub() : null;
    document.getElementById('scr-title').textContent = sub ? sub.title : meta.title;

    var body = document.getElementById('body');
    body.innerHTML = S[key]();
    body.scrollTop = 0;

    setActive('#tabs .tab', key, 's');
    setActive('#nav button', key, 's');
    renderNotes(sub ? sub.nt : key);

    if (key === 'cash')      initCashSubs();
    if (key === 'pension')   initPension();
    if (key === 'invest')    initInvest();
    if (key === 'ai')        initAI();
    if (key === 'advToday')  initAdvToday();
    if (key === 'advList')   initAdvList();

    initConcordsZone();   /* 有放康和專區的畫面才會接到東西 */
  }

  /* ---------- 畫面 ① 的左右子頁 ---------- */
  function curSub() {
    return CASH_SUBS.filter(function (s) { return s.id === SUB; })[0] || CASH_SUBS[0];
  }

  function initCashSubs() {
    document.getElementById('subtabs').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.dataset.sub === SUB) return;
      SUB = b.dataset.sub;
      render('cash');
    });

    /* 兩個子頁各自的內容初始化 */
    if (SUB === 'calc') initCalc(); else initCalendar();
  }

  function setActive(sel, key, attr) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.toggle('on', el.dataset[attr] === key);
    });
  }

  /* ---------- 右側講稿 ---------- */
  function renderNotes(key) {
    var N = NOTES[key];
    if (!N) return;
    document.getElementById('notes').innerHTML =
      '<div class="kicker">' + N.k + '</div>' +
      '<h2>' + N.h + '</h2>' +
      '<p class="lead">' + N.lead + '</p>' +
      N.n.map(function (x) {
        return '<div class="note ' + x[2] + '"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');
  }

  /* ======================================================================
     無障礙：字級三段切換
     ====================================================================== */
  function stepFont() {
    fontIdx = (fontIdx + 1) % FONT_STEPS.length;
    var f = FONT_STEPS[fontIdx];
    ['body', 'nav'].forEach(function (id) {
      document.getElementById(id).style.zoom = f.z;
    });
    document.getElementById('a11yTx').textContent = f.k;
  }

  /* ---------- 共用小工具 ---------- */
  function paintTrack(sl) {
    var p = (sl.value - sl.min) / (sl.max - sl.min) * 100;
    sl.style.background = 'linear-gradient(90deg,var(--teal) 0%,var(--teal) ' + p +
                          '%,#DCE6EC ' + p + '%,#DCE6EC 100%)';
  }

  /* 把「元」換算成「X 萬」 */
  function wan(v) { return Math.round(v / 10000).toLocaleString() + ' 萬'; }
  function nt(v)  { return 'NT$ ' + Math.round(v).toLocaleString(); }

  /* ======================================================================
     畫面 ①：現金流月曆（含 PLAN 模擬）
     ====================================================================== */
  function initCalendar() {
    var cal = document.getElementById('cal');
    if (!cal) return;

    var off = document.getElementById('planOff');
    if (off) off.addEventListener('click', function () { PLAN = null; render('cash'); });

    /* 自動計算當月 1 號是星期幾、當月共幾天 */
    var firstDay    = new Date(CONFIG.year, CONFIG.month - 1, 1).getDay();
    var daysInMonth = new Date(CONFIG.year, CONFIG.month, 0).getDate();

    var html = ['日','一','二','三','四','五','六'].map(function (d) {
      return '<div class="dow">' + d + '</div>';
    }).join('');

    for (var i = 0; i < firstDay; i++) html += '<div class="day blank"></div>';

    for (var d = 1; d <= daysInMonth; d++) {
      var isPay  = !!PAYS[d];
      var isPlan = !!PLAN && PLAN.day === d;
      var cls    = isPlan ? ' pay plan' : (isPay ? ' pay' : '');
      html += '<div class="day' + cls + '" data-d="' + d + '">' +
              d + (isPay || isPlan ? '<span class="dot"></span>' : '') + '</div>';
    }
    cal.innerHTML = html;

    cal.querySelectorAll('.day.pay').forEach(function (el) {
      el.addEventListener('click', function () { showPay(+el.dataset.d); });
    });
    showPay(0);
  }

  function showPay(day) {
    document.querySelectorAll('.day.pay').forEach(function (e) {
      e.classList.toggle('sel', +e.dataset.d === day);
    });

    var box = document.getElementById('paylist');
    if (!box) return;

    /* 點到模擬方案那一天 */
    if (PLAN && day === PLAN.day) {
      box.innerHTML =
        '<div class="list-title">' + CONFIG.month + ' 月 ' + day + ' 日 入帳（模擬）</div>' +
        '<div class="pay-row sim"><div><span class="n">' + PLAN.nm + '</span>' +
        '<div class="d">' + PLAN.freq + '</div></div>' +
        '<span class="v">+' + PLAN.add.toLocaleString() + '</span></div>' +
        '<button class="bigbtn o sm" id="backAll">← 看本月全部</button>';
      bindBack();
      return;
    }

    if (!day) {
      var rows = '';
      Object.keys(PAYS).forEach(function (k) {
        PAYS[k].forEach(function (p) {
          rows += '<div class="pay-row"><div><span class="n">' + p.n + '</span>' +
                  '<div class="d">' + CONFIG.month + ' 月 ' + k + ' 日</div></div>' +
                  '<span class="v">+' + p.v.toLocaleString() + '</span></div>';
        });
      });
      if (PLAN) {
        rows += '<div class="pay-row sim"><div><span class="n">' + PLAN.nm + '（模擬）</span>' +
                '<div class="d">' + CONFIG.month + ' 月 ' + PLAN.day + ' 日　' + PLAN.freq + '</div></div>' +
                '<span class="v">+' + PLAN.add.toLocaleString() + '</span></div>';
      }
      box.innerHTML =
        '<div class="list-title">本月入帳明細（點月曆金點看細節）</div>' + rows +
        '<div class="pay-row pay-total"><span class="n">合計</span>' +
        '<span class="v">+' + (TOTAL + (PLAN ? PLAN.add : 0)).toLocaleString() + '</span></div>';
    } else {
      box.innerHTML =
        '<div class="list-title">' + CONFIG.month + ' 月 ' + day + ' 日 入帳</div>' +
        PAYS[day].map(function (p) {
          return '<div class="pay-row"><div><span class="n">' + p.n + '</span>' +
                 '<div class="d">' + p.d + '</div></div>' +
                 '<span class="v">+' + p.v.toLocaleString() + '</span></div>';
        }).join('') +
        '<button class="bigbtn o sm" id="backAll">← 看本月全部</button>';
      bindBack();
    }
  }

  function bindBack() {
    var back = document.getElementById('backAll');
    if (back) back.addEventListener('click', function () { showPay(0); });
  }

  /* ======================================================================
     畫面 ②：我的月退俸 —— 把缺口換算成本金，再配對可承作的商品
     ====================================================================== */
  function initPension() {
    var sl = document.getElementById('tgt');
    if (!sl) return;
    sl.addEventListener('input', function () { pension(+sl.value); paintTrack(sl); });
    paintTrack(sl);
    pension(+sl.value);

    document.getElementById('solbox').addEventListener('click', function (e) {
      var b = e.target.closest('[data-plan]');
      if (b) choosePlan(b.dataset.plan, +sl.value);
    });
  }

  function pension(target) {
    document.getElementById('tgtVal').textContent = 'NT$ ' + target.toLocaleString();

    var gap = target - TOTAL;
    var box = document.getElementById('gapbox');
    var sol = document.getElementById('solbox');

    /* 已達標：不製造假需求，改推「把多出來的錢鎖成終身給付」 */
    if (gap <= 0) {
      box.className = 'result';
      box.innerHTML =
        '<div class="lbl">您目前的月現金流</div>' +
        '<div class="big">已達標</div>' +
        '<div class="tip">每月入帳 NT$ ' + TOTAL.toLocaleString() +
        '，比目標多 <b>' + (-gap).toLocaleString() + ' 元</b>。' +
        '多出來的部分可以規劃旅遊、孫子的教育金，或轉入年金險鎖住終身給付。</div>';
      sol.innerHTML = '<button class="bigbtn o" data-go="invest">看看有什麼可以放的商品</button>';
      return;
    }

    box.className = 'result warn';
    box.innerHTML =
      '<div class="lbl">距離每月 ' + target.toLocaleString() + ' 元，還差</div>' +
      '<div class="big">' + gap.toLocaleString() + ' 元</div>' +
      '<div class="tip">一年就是 <b>' + (gap * 12).toLocaleString() +
      ' 元</b>。下面三個方法都可以把這個缺口補起來。</div>';

    sol.innerHTML =
      '<div class="sec-h">補足缺口的三個方法</div>' +
      SOLUTIONS.map(function (s) {
        var need   = Math.round(gap * 12 / s.y);        // 需投入本金
        var per100 = Math.round(1000000 * s.y / 12);    // 每 100 萬每月可領
        var fit    = s.rr <= CONFIG.maxRR;
        return '<div class="sol s-' + s.k + '">' +
          '<div class="sol-top">' +
            '<span class="sol-tag">' + s.tag + '</span>' +
            '<span class="pill rr' + s.rr + '">RR' + s.rr + '</span>' +
          '</div>' +
          '<div class="sol-nm">' + s.nm + '</div>' +
          '<div class="sol-cat">' + s.cat + '</div>' +
          '<div class="sol-need"><span>需投入本金</span><b>' + wan(need) + '</b></div>' +
          '<div class="sol-d">年配息約 ' + (s.y * 100).toFixed(1) + '%　·　每 100 萬每月約領 ' +
            per100.toLocaleString() + ' 元</div>' +
          '<div class="sol-d">' + s.d + '</div>' +
          '<div class="sol-fit ' + (fit ? 'ok' : 'no') + '">' +
            (fit ? '✓ 符合您的' + CONFIG.riskProfile + '風險屬性'
                 : '⚠ 超過您的風險屬性，65 歲以上須完成加強版適合度評估') +
          '</div>' +
          '<button class="pick" data-plan="' + s.k + '">選這個 → 看月曆會變怎樣</button>' +
        '</div>';
      }).join('') +
      '<button class="bigbtn p" data-go="invest">看完整商品清單</button>' +
      '<button class="bigbtn o">請營業員幫我試算</button>';
  }

  /* 選定方案 → 寫入 PLAN → 跳回月曆看「補完之後長什麼樣」 */
  function choosePlan(k, target) {
    var s   = SOLUTIONS.filter(function (x) { return x.k === k; })[0];
    var gap = target - TOTAL;
    if (!s || gap <= 0) return;
    var need = Math.round(gap * 12 / s.y);
    PLAN = {
      k: s.k, nm: s.nm, cat: s.cat, day: s.day, freq: s.freq,
      add: gap, need: need, needTx: wan(need), target: target
    };
    SUB = 'cal';        /* 模擬後要看的是月曆，不是試算 */
    render('cash');
  }

  /* ======================================================================
     畫面 ①-右：老本撐多久試算
     ====================================================================== */
  function initCalc() {
    var sl = document.getElementById('exp');
    if (!sl) return;
    sl.addEventListener('input', function () { calc(+sl.value); paintTrack(sl); });
    paintTrack(sl);
    calc(+sl.value);
  }

  /**
   * 逐月模擬資產耗損
   * 每月：餘額 × (1+月報酬) + 被動收入 − 開銷；開銷隨通膨遞增
   */
  function calc(expense) {
    document.getElementById('expVal').textContent = 'NT$ ' + expense.toLocaleString();

    var bal  = CONFIG.totalAssets;
    var age  = CONFIG.currentAge;
    var exp  = expense;
    var inc  = TOTAL;
    var rM   = Math.pow(1 + CONFIG.annualReturn, 1 / 12) - 1;
    var infM = Math.pow(1 + CONFIG.inflation, 1 / 12) - 1;
    var months = 0;
    var CAP = 111;

    while (bal > 0 && age < CAP) {
      bal = bal * (1 + rM) + inc - exp;
      exp *= (1 + infM);
      months++;
      if (months % 12 === 0) age++;
    }

    var safe = age >= CAP;
    var res  = document.getElementById('res');

    document.getElementById('resAge').textContent = safe ? '100 歲以上' : age + ' 歲';

    var pct = Math.max(6, Math.min(100,
      (Math.min(age, 105) - CONFIG.currentAge) / (105 - CONFIG.currentAge) * 100));
    document.getElementById('resFill').style.width = pct + '%';

    res.className = 'result' + (safe || age >= 90 ? '' : (age >= 82 ? ' warn' : ' bad'));

    document.getElementById('resTip').innerHTML =
      (safe || age >= 90) ? '很安全，還有餘裕可以規劃旅遊或給孫子的教育金。'
      : (age >= 82)       ? '大致足夠，但建議提高每月配息收入，減緩動用本金的速度。'
                          : '資產可能提早用完。<b>建議與康和營業員討論調整方案。</b>';
  }

  /* ======================================================================
     畫面 ④：投資商品（含申購試算與二次確認）
     ====================================================================== */
  function initInvest() {
    var chips = document.getElementById('chips');
    if (!chips) return;

    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      chips.querySelectorAll('button').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      orderKey = null;
      paintProducts(b.dataset.c);
    });

    document.getElementById('prodbox').addEventListener('click', function (e) {
      /* 「還不確定？問小幫手」——跳去 ⑤，自動幫他問這一檔是什麼 */
      var ask_btn = e.target.closest('[data-ask]');
      if (ask_btn) { PENDING_ASK = ask_btn.dataset.ask; render('ai'); return; }

      var t = e.target.closest('[data-try]');
      if (t) {
        orderKey = (orderKey === t.dataset.try) ? null : t.dataset.try;
        paintProducts(document.querySelector('#chips .on').dataset.c);
        return;
      }
      if (e.target.closest('#ordNext')) openConfirm();
    });

    paintProducts('all');
  }

  /* ======================================================================
     康和專區（哪個畫面放了 S.concordsZone() 就自動生效）
     ====================================================================== */
  function initConcordsZone() {
    var app = document.getElementById('czApp');
    if (app) app.addEventListener('click', openTradeApp);

    /* 網址從 data.js 填入，外部瀏覽器開新分頁 */
    var site = document.getElementById('czSite');
    if (site) site.setAttribute('href', CONCORDS.site.url);

    /* 樂齡專線與客服：撥號連結（tel: 也不寫在版型裡，統一從 data.js 來） */
    document.querySelectorAll('[data-tel]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + el.dataset.tel);
    });

    /* 兩欄服務格：有 url 的補上外部連結 */
    document.querySelectorAll('[data-cz]').forEach(function (el) {
      var l = CONCORDS.links[+el.dataset.cz];
      if (l && l.url) {
        el.setAttribute('href', l.url);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    var call = document.getElementById('czCall');
    if (call) call.addEventListener('click', advisorCallback);

    var go = document.getElementById('czScamGo');
    if (go) go.addEventListener('click', checkScam);
  }

  /* 預約營業員回電（原型沒有真實分機，走預約流程而不是假撥號） */
  function advisorCallback() {
    var ad = CONCORDS.advisor, sn = CONCORDS.senior;
    showSheet(
      '<div class="ok-ic">✓</div>' +
      '<div class="sheet-big">' + ad.okT + '</div>' +
      '<div class="sheet-kv full">' + ad.okX + '</div>' +
      '<a class="bigbtn t" href="tel:' + sn.tel + '">' + sn.nm + '　' + sn.no + '</a>' +
      '<button class="bigbtn o" id="czCallOk">知道了</button>'
    );
    document.getElementById('czCallOk').addEventListener('click', closeSheet);
  }

  /* ---------- 防詐守門員：比對常見詐騙話術 ---------- */
  function checkScam() {
    var sc  = CONCORDS.scam;
    var box = document.getElementById('czScamOut');
    var tx  = (document.getElementById('czScamIn').value || '').toLowerCase();

    if (!tx.trim()) { box.innerHTML = ''; return; }

    var hits = sc.flags.filter(function (f) {
      return f.kw.some(function (k) { return tx.indexOf(k.toLowerCase()) >= 0; });
    });

    if (!hits.length) {
      box.innerHTML =
        '<div class="alert ok czr"><div class="ic">✓</div><div>' +
          '<div class="t">' + sc.safeT + '</div>' +
          '<div class="x">' + sc.safeX + '</div>' +
        '</div></div>';
      return;
    }

    box.innerHTML =
      '<div class="alert hi czr"><div class="ic">⚠</div><div>' +
        '<div class="t">' + sc.warnT + '</div>' +
        hits.map(function (f) {
          return '<div class="cz-flag"><b>' + f.w + '</b>' + f.x + '</div>';
        }).join('') +
        '<div class="x">' + sc.warnX + '</div>' +
      '</div></div>' +
      '<a class="bigbtn t" href="tel:' + CONCORDS.senior.tel + '">' +
        CONCORDS.senior.nm + '　' + CONCORDS.senior.no + '</a>' +
      '<a class="bigbtn r" href="tel:165">' + sc.call165 + '</a>';
  }

  /* ----------------------------------------------------------------------
     開啟「掌先機」下單 App
     ----------------------------------------------------------------------
     Android：intent:// 帶套件名，沒安裝時瀏覽器自己走 fallback 到 Google Play。
     iOS：先試 URL Scheme，時間內畫面沒有被切走就當成沒安裝 → 跳說明對話框。
     桌機：本來就沒有 App，直接跳說明對話框並給 App Store 連結。
     ====================================================================== */
  function openTradeApp() {
    var a  = CONCORDS.app;
    var ua = navigator.userAgent;

    if (/Android/i.test(ua)) {
      location.href = 'intent://open#Intent;package=' + a.android +
        ';S.browser_fallback_url=' + encodeURIComponent(a.play) + ';end';
      return;
    }

    if (!/iPhone|iPad|iPod/i.test(ua)) { askInstall(); return; }

    var timer = setTimeout(function () {
      document.removeEventListener('visibilitychange', gone);
      askInstall();
    }, a.waitMs);

    /* 畫面被切走 ＝ App 真的開起來了，就不要再跳下載對話框 */
    function gone() {
      if (document.hidden) {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', gone);
      }
    }
    document.addEventListener('visibilitychange', gone);

    location.href = a.scheme;
  }

  /* 沒安裝時的大字說明對話框 → 確認後才導到商店下載頁 */
  function askInstall() {
    var a     = CONCORDS.app;
    var store = /Android/i.test(navigator.userAgent) ? a.play : a.ios;

    showSheet(
      '<div class="sheet-big">' + a.askT + '</div>' +
      '<div class="sheet-x">' + a.askX + '</div>' +
      '<button class="bigbtn p" id="czGo">' + a.askGo + '</button>' +
      '<button class="bigbtn o" id="czNo">' + a.askNo + '</button>'
    );

    document.getElementById('czGo').addEventListener('click', function () {
      closeSheet();
      window.open(store, '_blank', 'noopener');
    });
    document.getElementById('czNo').addEventListener('click', closeSheet);
  }

  function paintProducts(cat) {
    var box  = document.getElementById('prodbox');
    var list = (cat === 'all') ? PRODUCTS : PRODUCTS.filter(function (p) { return p.c === cat; });

    var lastCat = '', lastSub = '';
    box.innerHTML = list.map(function (p) {
      var head = '';
      /* 換到新的一大類：印分類標題 + 一句白話解釋，子類記憶重置 */
      if (p.c !== lastCat) {
        head += '<div class="sec-h">' + CAT_NAMES[p.c] + '</div>';
        if (CAT_DESC[p.c]) head += '<div class="sec-d">' + CAT_DESC[p.c] + '</div>';
        lastCat = p.c;
        lastSub = '';
      }
      /* ETF 專用：換到新的小類再多印一層次標題（市值型／高股息…） */
      if (p.sub && p.sub !== lastSub) {
        head += '<div class="sec-h2">' + ETF_SUBS[p.sub] + '</div>';
        lastSub = p.sub;
      }

      var fit    = p.rr <= CONFIG.maxRR;
      var per100 = p.y ? Math.round(1000000 * p.y / 12) : 0;
      var open   = orderKey === p.nm;

      return head +
        '<div class="prod' + (p.warn ? ' warn' : '') + (open ? ' open' : '') + '">' +
          '<div class="prod-top">' +
            '<div class="prod-nm">' + p.nm + '</div>' +
            '<span class="pill rr' + p.rr + '">RR' + p.rr + '</span>' +
          '</div>' +
          (per100
            ? '<div class="prod-cash">每投入 100 萬　每月約領 <b>' + per100.toLocaleString() + '</b> 元</div>'
            : '<div class="prod-cash alt">' + (p.altTx || '保障型商品，不以配息計算') + '</div>') +
          '<div class="prod-d">' + p.d + '</div>' +
          '<div class="prod-meta"><span>最低 ' + p.min + '</span><span>' + p.pay + '</span></div>' +
          '<div class="sol-fit ' + (fit ? 'ok' : 'no') + '">' +
            (fit ? '✓ 適合您（' + CONFIG.riskProfile + '）' : '⚠ 需加強評估後方可承作') +
          '</div>' +
          '<div class="prod-help"><button data-ask="' + p.nm + '">❔ 還不確定？問小幫手</button></div>' +
          '<button class="pick" data-try="' + p.nm + '">' +
            (open ? '收起試算' : '試算並申購') + '</button>' +
          (open ? orderPanel(p) : '') +
        '</div>';
    }).join('');

    if (!list.length) {
      box.innerHTML = '<div class="card"><div class="sub">此分類尚無示意商品。</div></div>';
    }
    if (orderKey) initOrder();
  }

  /* 申購試算面板 */
  function orderPanel(p) {
    return '<div class="order">' +
      '<div class="ord-h">我要投入多少？</div>' +
      '<div class="slider-val" id="ordVal">' + nt(ORDER.def) + '</div>' +
      '<input type="range" id="ordSl" min="' + ORDER.min + '" max="' + ORDER.max +
        '" step="' + ORDER.step + '" value="' + ORDER.def + '" data-p="' + p.nm + '">' +
      '<div class="range-ends"><span>' + (ORDER.min / 10000) + ' 萬</span>' +
        '<span>' + (ORDER.max / 10000) + ' 萬</span></div>' +
      '<div class="ord-out" id="ordOut"></div>' +
      '<div class="ord-fee" id="ordFee"></div>' +
      '<button class="bigbtn p" id="ordNext">下一步</button>' +
    '</div>';
  }

  function initOrder() {
    var sl = document.getElementById('ordSl');
    if (!sl) return;
    sl.addEventListener('input', function () { order(+sl.value); paintTrack(sl); });
    paintTrack(sl);
    order(+sl.value);
  }

  function curProduct() {
    return PRODUCTS.filter(function (p) { return p.nm === orderKey; })[0];
  }

  function order(amt) {
    var p = curProduct();
    if (!p) return;
    var fee = CAT_FEE[p.c];

    document.getElementById('ordVal').textContent = nt(amt);
    document.getElementById('ordOut').innerHTML = p.y
      ? '<div><span>每月約領</span><b>' + nt(amt * p.y / 12) + '</b></div>' +
        '<div><span>一年約領</span><b>' + nt(amt * p.y) + '</b></div>'
      : '<div class="alt">保障型商品，給付方式依契約條款，不以配息計算。</div>';
    document.getElementById('ordFee').innerHTML =
      '費用：' + fee.tx + (fee.rate ? '　約 <b>' + nt(amt * fee.rate) + '</b>' : '');
  }

  /* ---------- 二次確認（防誤觸） ---------- */
  function openConfirm() {
    var p   = curProduct();
    var amt = +document.getElementById('ordSl').value;
    var fee = CAT_FEE[p.c];
    var fit = p.rr <= CONFIG.maxRR;

    showSheet(
      '<div class="sheet-t">請再確認一次</div>' +
      '<div class="sheet-big">' + p.nm + '</div>' +
      '<div class="sheet-kv"><span>投入金額</span><b>' + nt(amt) + '</b></div>' +
      (p.y ? '<div class="sheet-kv"><span>每月約領</span><b>' + nt(amt * p.y / 12) + '</b></div>' : '') +
      '<div class="sheet-kv"><span>費用</span><b>' +
        (fee.rate ? nt(amt * fee.rate) : '內含') + '</b></div>' +
      '<div class="sheet-warn">⚠ 本商品風險等級 RR' + p.rr + '，' +
        (fit ? '符合您的' + CONFIG.riskProfile + '風險屬性。'
             : '<b>超過您的風險屬性</b>，須由營業員完成高齡客戶加強版適合度評估後方可承作。') +
        '<br>投資均有風險，配息可能來自本金，本金可能虧損。</div>' +
      '<button class="bigbtn p" id="ordOk">確認送出</button>' +
      '<button class="bigbtn o" id="ordCancel">再想一下</button>'
    );

    document.getElementById('ordOk').addEventListener('click', orderDone);
    document.getElementById('ordCancel').addEventListener('click', closeSheet);
  }

  function orderDone() {
    var p = curProduct();
    showSheet(
      '<div class="ok-ic">✓</div>' +
      '<div class="sheet-big">已送出申購指示</div>' +
      '<div class="sheet-kv full">' + ADVISOR.name + '將於 1 小時內與您電話確認，' +
        '確認後才會正式扣款。您隨時可以反悔。</div>' +
      '<div class="sheet-kv full sub">商品：' + p.nm + '</div>' +
      '<button class="bigbtn p" id="ordDone">知道了</button>'
    );
    document.getElementById('ordDone').addEventListener('click', function () {
      closeSheet();
      orderKey = null;
      paintProducts(document.querySelector('#chips .on').dataset.c);
    });
  }

  function showSheet(html) {
    var s = document.getElementById('sheet');
    s.innerHTML = '<div class="sheet-box">' + html + '</div>';
    s.classList.add('on');
  }

  function closeSheet() {
    var s = document.getElementById('sheet');
    if (s) { s.classList.remove('on'); s.innerHTML = ''; }
  }

  /* ======================================================================
     畫面 ⑤：AI 小幫手（含語音輸入與朗讀）
     ====================================================================== */
  function initAI() {
    var quick = document.getElementById('quick');
    if (!quick) return;

    quick.addEventListener('click', function (e) {
      var b = e.target.closest('.qbtn');
      if (b) ask(b.dataset.q);
    });

    document.getElementById('chat').addEventListener('click', function (e) {
      var b = e.target.closest('.spk');
      if (b) speak(b.parentNode.dataset.say);
    });

    document.getElementById('mic').addEventListener('click', startVoice);

    /* 從投資頁「問小幫手」點過來的，這裡自動幫他問一次 */
    if (PENDING_ASK) {
      var nm = PENDING_ASK;
      PENDING_ASK = null;
      ask('什麼是「' + nm + '」？');
    }
  }

  /**
   * key     用來查 AI_ANSWERS 的題目
   * display 泡泡上要顯示的文字（語音輸入時是使用者實際說的話）
   */
  function ask(key, display) {
    var chat = document.getElementById('chat');
    if (!chat) return;

    chat.insertAdjacentHTML('beforeend', '<div class="bb me">' + (display || key) + '</div>');
    /* 每則回答都掛上小方的臉，看起來是「有人在回」而不是系統訊息 */
    chat.insertAdjacentHTML('beforeend',
      '<div class="bbr">' + S.mk('mk-av') +
      '<div class="bb ai typing">' + MASCOT.nm + '正在查…</div></div>');

    /* 把「問題」捲到最上方，回答就會完整出現在它下面 */
    var asked = chat.lastElementChild.previousElementSibling;
    scrollToEl(asked);

    setTimeout(function () {
      var t = chat.querySelector('.typing');
      if (!t) return;
      t.classList.remove('typing');

      /* 先查固定問答；查不到、且問句是「什麼是「XXX」？」這種格式，
         就試著當成商品名稱，自動生成一則說明（見 productAnswer）。
         這樣新增商品不用手動多寫一組 AI 問答，data.js 加一筆商品就自動有解說。 */
      var ans = AI_ANSWERS[key];
      if (!ans) {
        var m = /「(.+?)」/.exec(key);
        if (m) ans = productAnswer(m[1]);
      }

      t.innerHTML = ans ||
        '這個問題我還在學。要不要先<button class="ai-go" data-go="invest">看看商品清單</button>，' +
        '或直接請' + ADVISOR.name + '為您說明？';
      t.dataset.say = t.textContent;
      t.insertAdjacentHTML('beforeend', '<button class="spk">🔊 念給我聽</button>');
      scrollToEl(asked);
    }, 700);
  }

  /* 針對某一檔商品，自動組出一段白話說明（給④「問小幫手」用）。
     資料完全來自 data.js 的 PRODUCTS／RR_LEVELS，商品新增或改內容時
     這裡不用跟著改，說明會自動同步。 */
  function productAnswer(nm) {
    var p = PRODUCTS.filter(function (x) { return x.nm === nm; })[0];
    if (!p) return null;

    var rr     = RR_LEVELS.filter(function (r) { return r.n === p.rr; })[0];
    var per100 = p.y ? Math.round(1000000 * p.y / 12) : 0;
    var fit    = p.rr <= CONFIG.maxRR;

    return '<b>' + p.nm + '</b>　屬於「' + CAT_NAMES[p.c] + '」。<br>' +
      p.d + '<br>' +
      (per100
        ? '每投入 100 萬，每月約可領 <b>' + per100.toLocaleString() + '</b> 元。'
        : (p.altTx || '不配息，不以現金流計算。')) +
      '<br>風險等級 <b>RR' + p.rr + '</b>' + (rr ? '（' + rr.tx + '）' : '') + '。' +
      (fit ? '　✓ 符合您目前的風險屬性。'
           : '　⚠ 超過您目前的風險屬性，須完成加強版適合度評估後才能承作。') +
      '<button class="ai-go" data-go="invest">回去看其他商品</button>';
  }

  /* 捲動手機內容區，讓指定元素出現在頂端 */
  function scrollToEl(el) {
    var body = document.getElementById('body');
    var d = el.getBoundingClientRect().top - body.getBoundingClientRect().top;
    body.scrollTop += d - 14;
  }

  /* ---------- 語音輸入：優先用瀏覽器原生辨識，不支援時退回模擬 ---------- */
  var voiceIdx = 0;

  function startVoice() {
    var mic = document.getElementById('mic');
    if (mic.classList.contains('on')) return;

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || location.protocol === 'file:') { simulateVoice(); return; }

    var r = new SR();
    r.lang = 'zh-TW';
    r.interimResults = false;
    r.maxAlternatives = 1;

    var got = false;
    micOn(true, '聆聽中…請說話');

    r.onresult = function (e) {
      got = true;
      var said = e.results[0][0].transcript;
      micOn(false);
      ask(matchVoice(said), said);
    };
    r.onerror = function () { micOn(false); if (!got) simulateVoice(); };
    r.onend   = function () { micOn(false); };

    try { r.start(); } catch (err) { micOn(false); simulateVoice(); }
  }

  /* 沒有語音辨識（或用 file:// 開啟）時，依序問下一個常見問題 */
  function simulateVoice() {
    micOn(true, '聆聽中…');
    setTimeout(function () {
      micOn(false);
      ask(AI_QUICK[voiceIdx % AI_QUICK.length]);
      voiceIdx++;
    }, 900);
  }

  function micOn(on, tx) {
    var mic = document.getElementById('mic');
    if (!mic) return;
    mic.classList.toggle('on', on);
    document.getElementById('micTx').textContent = on ? (tx || '聆聽中…') : '按住說話';
  }

  /* 聽到的話裡有哪個關鍵字，就對應到哪一題 */
  function matchVoice(said) {
    for (var i = 0; i < VOICE_MATCH.length; i++) {
      for (var j = 0; j < VOICE_MATCH[i].kw.length; j++) {
        if (said.indexOf(VOICE_MATCH[i].kw[j]) >= 0) return VOICE_MATCH[i].q;
      }
    }
    return said;   // 沒對上就原文送進去，會走預設回覆
  }

  /* ---------- 朗讀回答 ---------- */
  function speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text.replace('🔊 念給我聽', ''));
    u.lang = 'zh-TW';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  /* ======================================================================
     營業員視角
     ====================================================================== */
  function initAdvToday() {
    var withGap = CLIENTS.filter(function (c) { return c.gap > 0; })
                         .sort(function (a, b) { return b.gap - a.gap; });

    var totalGap = withGap.reduce(function (s, c) { return s + c.gap; }, 0);
    var scale    = totalGap * 12 / ADV_CONV.yield;      // 可承接規模
    var fee      = scale * ADV_CONV.feeRate;            // 預估手續費

    document.getElementById('advHero').innerHTML =
      '<div class="lbl">本月可轉換缺口（' + withGap.length + ' 位客戶）</div>' +
      '<div class="amt"><small>NT$</small>' + wan(scale) + '</div>' +
      '<div class="note">預估手續費收入 ' + nt(fee) + '　·　合計缺口 ' +
        totalGap.toLocaleString() + ' 元／月</div>';

    document.getElementById('advTodo').innerHTML = withGap.map(function (c) {
      var need = c.gap * 12 / ADV_CONV.yield;
      return '<div class="todo">' +
        '<div class="todo-top"><b>' + c.nm + '</b>' +
          '<span class="pill hot' + c.hot + '">缺口 ' + c.gap.toLocaleString() + '／月</span></div>' +
        '<div class="todo-x">可承接 <b>' + wan(need) + '</b>　·　預估手續費 ' +
          nt(need * ADV_CONV.feeRate) + '</div>' +
        '<div class="todo-sig">' + c.sig + '　<i>' + c.when + '</i></div>' +
        '<button class="pick">撥電話</button>' +
      '</div>';
    }).join('');
  }

  function initAdvList() {
    var sorted = CLIENTS.slice().sort(function (a, b) {
      return (b.hot - a.hot) || (b.gap - a.gap);
    });
    var hotTx = { 3:'熱度高', 2:'熱度中', 1:'熱度低' };

    document.getElementById('advClients').innerHTML = sorted.map(function (c) {
      return '<div class="cl' + (c.nm === '陳伯伯' ? ' me' : '') + '">' +
        '<div class="cl-head">' +
          '<div class="avatar">' + c.nm.charAt(0) + '</div>' +
          '<div><div class="cl-nm">' + c.nm + '</div>' +
          '<div class="cl-sub">' + c.age + ' 歲　·　' + c.rr + '　·　AUM ' + wan(c.aum) + '</div></div>' +
          '<span class="pill hot' + c.hot + '">' + hotTx[c.hot] + '</span>' +
        '</div>' +
        '<div class="cl-sig">' + c.sig + '　<i>' + c.when + '</i></div>' +
        '<div class="cl-gap">' +
          (c.gap ? '每月缺口 <b>' + c.gap.toLocaleString() + ' 元</b>　→　可承接 ' +
                   wan(c.gap * 12 / ADV_CONV.yield)
                 : '月退俸已達標，適合談年金險與傳承規劃') +
        '</div>' +
        (c.nm === '陳伯伯' ? '<button class="pick" data-go="advClient">看詳情</button>' : '') +
      '</div>';
    }).join('');
  }

  /* ---------- PWA Service Worker ----------
     只有透過 http/https 開啟時才註冊（雙擊本機檔案時會自動略過，不會報錯） */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('service-worker.js').catch(function () { /* 忽略 */ });
    }
  }

  /* ---------- 開始 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
