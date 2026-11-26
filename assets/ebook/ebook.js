/* Nabídka ebooku „AI ve firmě za 90 dní“ na fundament22.com.
 * - Vykreslí nabídku do každého <div data-ebook-cta="misto"></div> (místo = název pro měření).
 * - Po 45 s nebo po 60 % stránky jednou otevře popup (znovu nejdřív za 14 dní, po stažení už nikdy).
 * - Formulář posílá kontakt na stejný Apps Script jako průvodce (fundament22-formular-apps-script.gs),
 *   s verdict "ebook", takže řádek v tabulce Kontakty je poznat. Po odeslání ukáže odkaz na PDF.
 * - Měření (jen když je po souhlasu načtené gtag): cta_ebook_klik, ebook_popup_zobrazen, odeslany_ebook.
 * Související: index.html (umístění nabídek), FUNDAMENT22-GTM-strategie-v13.html (cíl a vyhodnocení).
 */
(function () {
  var SUBMIT = "https://script.google.com/macros/s/AKfycbzrRzWBLmW5Ytwv1tQ8GuSy7L3nRAslf6H_FpxVo6SeAnjpxb6wrLaOyjn7RGcaV_-A/exec";
  var PDF = "/assets/ebook/AI-ve-firme-za-90-dni.pdf";
  var CONTACT = "petr@locoglobal.ai";
  var KEY_SEEN = "f22_ebook_popup", KEY_DONE = "f22_ebook_ok";
  var POPUP_DELAY = 45000, POPUP_SCROLL = 0.6, POPUP_PAUSE_DAYS = 14;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ev(name, p) { if (window.gtag) window.gtag("event", name, p || {}); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function utm() {
    var o = {}, q = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) { if (q.get(k)) o[k] = q.get(k); });
    if (document.referrer) o.referrer = document.referrer.slice(0, 200);
    return o;
  }

  var css = document.createElement("style");
  css.textContent =
    ".ebk{display:flex;gap:22px;align-items:center;flex-wrap:wrap;max-width:980px;margin:0 auto;padding:22px 24px;border-radius:18px;background:#FFF4EC;border:1px solid rgba(232,84,26,.25)}" +
    ".ebk-wrap{padding:28px 20px}" +
    ".ebk-cover{flex:0 0 auto;width:92px;height:122px;border-radius:8px;background:linear-gradient(150deg,#10143A,#2B2F6B);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;font-weight:800;font-size:13px;line-height:1.15;box-shadow:0 10px 24px rgba(16,20,58,.28)}" +
    ".ebk-cover small{display:block;font-weight:600;font-size:9px;letter-spacing:.06em;color:#FDBA74;margin-bottom:6px}" +
    ".ebk-tx{flex:1 1 320px}.ebk-tx b{display:block;font-size:19px;margin-bottom:4px;color:#15183A}.ebk-tx p{margin:0;color:#3B3F63;font-size:15.5px;line-height:1.5}" +
    ".ebk .btn{flex:0 0 auto}" +
    ".ebm{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(16,20,58,.55)}" +
    ".ebm[hidden]{display:none}" +
    ".ebm-box{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#15183A;border-radius:20px;padding:26px 24px 22px;box-shadow:0 30px 80px rgba(16,20,58,.4)}" +
    ".ebm-x{position:absolute;top:10px;right:12px;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#6B6F8F;padding:6px}" +
    ".ebm h3{margin:0 0 6px;font-size:22px;line-height:1.25;padding-right:28px}.ebm p{margin:0 0 14px;color:#3B3F63;font-size:15px;line-height:1.5}" +
    ".ebm ul{margin:0 0 16px;padding-left:20px;color:#3B3F63;font-size:14.5px;line-height:1.5}" +
    ".ebm label{display:block;font-size:14px;font-weight:600;margin:0 0 10px}" +
    ".ebm input[type=text],.ebm input[type=email]{display:block;width:100%;box-sizing:border-box;margin-top:5px;font:inherit;font-weight:400;font-size:16px;padding:11px 12px;border:1px solid rgba(21,24,58,.22);border-radius:10px}" +
    ".ebm .two{display:flex;gap:10px;flex-wrap:wrap}.ebm .two label{flex:1 1 180px}" +
    ".ebm .ck{display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:13.5px;color:#3B3F63}.ebm .ck input{margin-top:3px}" +
    ".ebm .err{color:#B91C1C;font-size:14px;min-height:1px;margin:4px 0 10px}" +
    ".ebm .btn{width:100%;text-align:center;box-sizing:border-box;border:0;cursor:pointer;font:inherit;font-weight:700}" +
    ".ebm .legal{font-size:12.5px;color:#6B6F8F;margin:10px 0 0}";
  document.head.appendChild(css);

  /* ---- nabídky v textu ---- */
  document.querySelectorAll("[data-ebook-cta]").forEach(function (el) {
    var misto = el.getAttribute("data-ebook-cta") || "text";
    el.classList.add("ebk-wrap");
    el.innerHTML =
      '<div class="ebk"><div class="ebk-cover" aria-hidden="true"><small>EBOOK ZDARMA</small>AI ve firmě za 90 dní</div>' +
      '<div class="ebk-tx"><b>' + esc(el.getAttribute("data-title") || "Ebook zdarma: AI ve firmě za 90 dní") + "</b>" +
      "<p>" + esc(el.getAttribute("data-text") || "Jak vybrat jednu rutinu, vyzkoušet ji za čtyři týdny a spočítat, kolik času AI opravdu ušetří. Prakticky, pro firmy s 15 až 250 lidmi.") + "</p></div>" +
      '<a class="btn" href="#ebook" data-ebook-open="' + esc(misto) + '">Stáhnout ebook →</a></div>';
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-ebook-open]");
    if (!a) return;
    e.preventDefault();
    ev("cta_ebook_klik", { misto: a.getAttribute("data-ebook-open") });
    open("klik");
  });

  /* ---- okno s formulářem ---- */
  var m = document.createElement("div");
  m.className = "ebm"; m.hidden = true;
  m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "ebmT");
  document.body.appendChild(m);
  var lastFocus = null, source = "klik";

  function formHtml() {
    return '<div class="ebm-box"><button class="ebm-x" type="button" aria-label="Zavřít">×</button>' +
      '<h3 id="ebmT">Ebook zdarma: AI ve firmě za 90 dní</h3>' +
      "<p>Praktický průvodce pro majitele a vedení firmy. Funguje i bez nás.</p>" +
      "<ul><li>jak vybrat první úlohu, která se vyplatí</li><li>pravidla, co AI smí a co vždy schvaluje člověk</li><li>jak spočítat skutečnou úsporu času včetně kontroly</li><li>plán na 90 dní</li></ul>" +
      '<form novalidate><div class="two"><label>Jméno<input type="text" name="name" autocomplete="name" placeholder="Jan Novák" required></label>' +
      '<label>Firma<input type="text" name="company" autocomplete="organization" placeholder="Firma s.r.o." required></label></div>' +
      '<label>Pracovní e-mail<input type="email" name="email" inputmode="email" autocomplete="email" placeholder="jan@firma.cz" required></label>' +
      '<label class="ck"><input type="checkbox" name="news" value="ano"> Občas mi pošlete tip, jak firmy používají AI. Odhlásit se dá kdykoli.</label>' +
      '<p class="err" role="alert"></p><button class="btn" type="submit">Poslat ebook →</button>' +
      '<p class="legal">Kontakt použijeme k zaslání ebooku a k nabídce konzultace. Bez zaškrtnutí vám žádné tipy posílat nebudeme.</p></form></div>';
  }
  function doneHtml() {
    return '<div class="ebm-box"><button class="ebm-x" type="button" aria-label="Zavřít">×</button>' +
      '<h3 id="ebmT">Ebook je váš.</h3><p>Stáhněte si ho hned. Až budete vědět, kterou úlohu chcete zkusit, probereme ji spolu na konzultaci: 30 minut, zdarma.</p>' +
      '<a class="btn" href="' + PDF + '" target="_blank" rel="noopener" download>Stáhnout PDF →</a>' +
      '<p class="legal" style="margin-top:14px"><a href="/#analyza" data-ebook-close>Chci rovnou konzultaci</a></p></div>';
  }
  function bind() {
    m.querySelector(".ebm-x").onclick = close;
    var c = m.querySelector("[data-ebook-close]"); if (c) c.onclick = close;
    var form = m.querySelector("form"); if (!form) return;
    var err = form.querySelector(".err"), btn = form.querySelector("button[type=submit]");
    form.onsubmit = function (e) {
      e.preventDefault(); err.textContent = "";
      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      if (!d.name || !d.company) { err.textContent = "Doplňte prosím jméno a firmu."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) { err.textContent = "Zkontrolujte prosím e-mail."; return; }
      var payload = { name: d.name, company: d.company, email: d.email, verdict: "ebook", tasks: ["Ebook AI ve firmě za 90 dní"],
        painText: d.news === "ano" ? "souhlas s tipy: ano" : "souhlas s tipy: ne", answers: { zdroj: source, tipy: d.news === "ano" },
        utm: utm(), page: location.pathname, ts: new Date().toISOString() };
      btn.disabled = true; btn.textContent = "Odesílám…";
      /* text/plain: prostý požadavek bez preflightu, jinak ho Apps Script odmítne (stejně jako průvodce). */
      fetch(SUBMIT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (res) {
          if (!res || res.ok !== true) throw new Error("zapis");
          set(KEY_DONE, "1");
          ev("odeslany_ebook", { zdroj: source, tipy: d.news === "ano" ? "ano" : "ne" });
          m.innerHTML = doneHtml(); bind(); focusFirst();
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = "Poslat ebook →";
          err.innerHTML = 'Odeslání se nezdařilo. Zkuste to znovu, nebo napište na <a href="mailto:' + CONTACT + '">' + CONTACT + "</a>.";
        });
    };
  }
  function focusFirst() { var f = m.querySelector("input,a.btn,button.btn"); if (f) f.focus(); }
  function open(src) {
    source = src;
    lastFocus = document.activeElement;
    m.innerHTML = get(KEY_DONE) ? doneHtml() : formHtml();
    bind(); m.hidden = false; focusFirst();
  }
  function close() { m.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  m.addEventListener("click", function (e) { if (e.target === m) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) close(); });

  /* ---- popup po chvilce ---- */
  if (location.hash === "#ebook") setTimeout(function () { open("odkaz"); }, 300);
  var seen = Number(get(KEY_SEEN) || 0);
  var noPopup = document.documentElement.hasAttribute("data-no-ebook-popup");
  if (!noPopup && !get(KEY_DONE) && Date.now() - seen > POPUP_PAUSE_DAYS * 864e5) {
    var fired = false;
    var fire = function () {
      if (fired || !m.hidden) return;
      var bar = document.getElementById("cbar");
      if (bar && !bar.hidden) { setTimeout(fire, 8000); return; } /* nejdřív ať návštěvník vyřeší lištu s měřením */
      fired = true; set(KEY_SEEN, String(Date.now()));
      window.removeEventListener("scroll", onScroll);
      ev("ebook_popup_zobrazen", {});
      open("popup");
    };
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0 && scrollY / h >= POPUP_SCROLL) fire();
    };
    setTimeout(fire, POPUP_DELAY);
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
