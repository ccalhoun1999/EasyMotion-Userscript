// ==UserScript==
// @name         EasyMotion-style Link Hints
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Minimal EasyMotion-style link navigation
// @author       Charles Calhoun
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  const hintChars = "asdfghjklqwertyuiopzxcvbnm";
  let active = false;
  let hintMap = {};
  let hintEls = [];
  let openInNewTab = false;

  function generateHints(count) {
    const combos = [];
    const length = Math.ceil(Math.log(count) / Math.log(hintChars.length));
    const max = Math.pow(hintChars.length, length);

    for (let i = 0; i < max && combos.length < count; i++) {
      let combo = "";
      let n = i;
      for (let j = 0; j < length; j++) {
        combo = hintChars[n % hintChars.length] + combo;
        n = Math.floor(n / hintChars.length);
      }
      combos.push(combo);
    }
    return combos;
  }

  function showHints() {
    const links = Array.from(document.querySelectorAll('a, button, [role="button"], input[type="submit"]'))
      .filter(el => el.offsetParent !== null);

    const combos = generateHints(links.length);
    hintMap = {};
    hintEls = [];

    links.forEach((el, i) => {
      const combo = combos[i];
      const rect = el.getBoundingClientRect();
      const hint = document.createElement('div');
      hint.textContent = combo;
      hint.style.position = 'absolute';
      hint.style.left = `${window.scrollX + rect.left}px`;
      hint.style.top = `${window.scrollY + rect.top}px`;
      hint.style.background = 'yellow';
      hint.style.color = 'black';
      hint.style.font = 'bold 12px monospace';
      hint.style.padding = '1px 4px';
      hint.style.zIndex = 999999;
      hint.style.borderRadius = '3px';
      hint.style.boxShadow = '0 0 2px black';
      document.body.appendChild(hint);

      hintMap[combo] = el;
      hintEls.push(hint);
    });

    active = true;
    inputBuffer = "";
  }

  function clearHints() {
    hintEls.forEach(h => h.remove());
    hintMap = {};
    hintEls = [];
    active = false;
    inputBuffer = "";
    openInNewTab = false;
  }

  let inputBuffer = "";

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    // ignore Ctrl+F or Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') return;

    if (!active && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openInNewTab = (e.key === 'F');
      showHints();
    } else if (active) {
      e.preventDefault();
      inputBuffer += e.key.toLowerCase();
      if (hintMap[inputBuffer]) {
        const el = hintMap[inputBuffer];
        if (openInNewTab) {
            const url = el.href || el.dataset.href;
            if (url) window.open(url, '_blank');
            else el.click(); // fallback
        } else {
          el.click();
        }
        clearHints();
      } else if (!Object.keys(hintMap).some(k => k.startsWith(inputBuffer))) {
        // Invalid combo — reset
        clearHints();
      }
    }
  });
})();
