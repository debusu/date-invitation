/* Draws the final invitation onto a canvas (portrait, height grows with content).
 * Layout runs once to measure and record drawing ops, then replays them onto
 * a canvas of the exact height, so nothing is ever cut off. */
(() => {
  'use strict';

  const W = 1080;
  const SCRIPT = '"Dancing Script", "Brush Script MT", cursive';
  const SANS = 'Quicksand, "Segoe UI", system-ui, sans-serif';
  const C = {
    bg1: '#ffe4ee', bg2: '#ffd0e0', card: '#fffafc', line: '#ffc2d6', rose: '#ea5d8e',
    deep: '#c2416f', ink: '#6a3350', soft: '#9a6680', pink: '#ff85aa', petal: '#ffb3cb', gold: '#f2b84b',
  };

  function heartPath(ctx, x, y, s) {
    // heart centred at (x, y), width ≈ s
    const k = s / 100;
    ctx.beginPath();
    ctx.moveTo(x, y + 40 * k);
    ctx.bezierCurveTo(x - 32 * k, y + 18 * k, x - 48 * k, y - 2 * k, x - 48 * k, y - 21 * k);
    ctx.bezierCurveTo(x - 48 * k, y - 36 * k, x - 36 * k, y - 46 * k, x - 22 * k, y - 46 * k);
    ctx.bezierCurveTo(x - 12 * k, y - 46 * k, x - 4 * k, y - 40 * k, x, y - 32 * k);
    ctx.bezierCurveTo(x + 4 * k, y - 40 * k, x + 12 * k, y - 46 * k, x + 22 * k, y - 46 * k);
    ctx.bezierCurveTo(x + 36 * k, y - 46 * k, x + 48 * k, y - 36 * k, x + 48 * k, y - 21 * k);
    ctx.bezierCurveTo(x + 48 * k, y - 2 * k, x + 32 * k, y + 18 * k, x, y + 40 * k);
    ctx.closePath();
  }
  function heart(ctx, x, y, s, fill, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = fill; heartPath(ctx, x, y, s); ctx.fill(); ctx.restore();
  }
  function flower(ctx, x, y, r, petal, center, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = center; ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function leaf(ctx, x, y, len, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#9fd8b4';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0); ctx.fill();
    ctx.restore();
  }
  function bouquet(ctx, x, y, scale, mirror) {
    ctx.save(); ctx.translate(x, y); ctx.scale(mirror ? -scale : scale, scale);
    leaf(ctx, 0, 0, 70, -0.3); leaf(ctx, 0, 0, 60, 0.9); leaf(ctx, 0, 0, 55, 2.0);
    flower(ctx, 10, 6, 34, C.petal, '#ffe08a', 0.2);
    flower(ctx, 62, 38, 24, '#ffd0de', '#ffe08a', 0.8);
    flower(ctx, 40, -34, 20, C.pink, '#fff3c4', 0.5);
    ctx.restore();
  }
  function sparkle(ctx, x, y, s, color) {
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/); const lines = []; let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxW || !line) {
        // break single very long words
        if (!line && ctx.measureText(w).width > maxW) {
          let chunk = '';
          for (const ch of w) { if (ctx.measureText(chunk + ch).width > maxW) { lines.push(chunk); chunk = ch; } else chunk += ch; }
          line = chunk;
        } else line = test;
      } else { lines.push(line); line = w; }
    });
    if (line) lines.push(line);
    return lines;
  }
  // deterministic pseudo-random for decorations
  function rng(seed) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load(`700 80px ${SCRIPT}`), document.fonts.load(`600 40px ${SCRIPT}`),
          document.fonts.load(`700 30px ${SANS}`), document.fonts.load(`600 30px ${SANS}`), document.fonts.load(`500 30px ${SANS}`),
        ]),
        new Promise((r) => setTimeout(r, 3500)), // don't hang if offline
      ]);
    } catch { /* fall back to system fonts */ }
  }

  async function render(data) {
    await ensureFonts();
    const m = document.createElement('canvas').getContext('2d'); // measuring context
    const ops = [];
    const op = (fn) => ops.push(fn);
    const M = 70;              // outer margin
    const P = 70;              // inner padding
    const X0 = M + P;          // content left
    const CW = W - 2 * (M + P); // content width
    let y = M + 150;

    const text = (str, x, yy, font, color, align = 'left') => op((ctx) => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(str, x, yy); });
    const block = (str, font, color, lh, { x = X0, w = CW, align = 'left' } = {}) => {
      m.font = font; const lines = wrap(m, str, w);
      lines.forEach((ln) => { y += lh; text(ln, align === 'center' ? x + w / 2 : x, y, font, color, align); });
      return lines.length;
    };
    const divider = () => {
      const yy = y + 34;
      op((ctx) => {
        ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.setLineDash([2, 12]); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X0 + 40, yy); ctx.lineTo(W / 2 - 50, yy); ctx.moveTo(W / 2 + 50, yy); ctx.lineTo(X0 + CW - 40, yy); ctx.stroke(); ctx.setLineDash([]);
        heart(ctx, W / 2 - 22, yy, 22, C.petal); heart(ctx, W / 2, yy - 2, 30, C.rose); heart(ctx, W / 2 + 22, yy, 22, C.petal);
      });
      y += 68;
    };
    const heading = (str) => { y += 18; block(str, `700 60px ${SCRIPT}`, C.rose, 70, { align: 'center' }); y += 10; };

    /* ---- title ---- */
    block("You're Invited", `700 112px ${SCRIPT}`, C.rose, 120, { align: 'center' });
    block('to Our Date! 💗', `700 82px ${SCRIPT}`, C.deep, 92, { align: 'center' });
    y += 14;
    block(`For my dearest ${data.recipient}`, `600 34px ${SANS}`, C.soft, 46, { align: 'center' });
    divider();

    /* ---- date & place boxes ---- */
    {
      const gap = 28; const bw = (CW - gap) / 2; const top = y;
      const boxes = [
        { icon: '📅', label: 'WHEN', main: data.dateText, sub: data.planTitle },
        { icon: '📍', label: 'WHERE', main: data.location, sub: data.area },
      ];
      let maxH = 0;
      const prepared = boxes.map((b) => {
        m.font = `700 36px ${SANS}`; const mainL = wrap(m, b.main, bw - 60);
        m.font = `500 26px ${SANS}`; const subL = b.sub ? wrap(m, b.sub, bw - 60) : [];
        const h = 40 + 46 + 30 + mainL.length * 46 + (subL.length ? 10 + subL.length * 34 : 0) + 34;
        maxH = Math.max(maxH, h);
        return { ...b, mainL, subL };
      });
      prepared.forEach((b, i) => {
        const bx = X0 + i * (bw + gap);
        op((ctx) => {
          ctx.save(); ctx.shadowColor = 'rgba(234,93,142,.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
          ctx.fillStyle = '#fff'; roundRect(ctx, bx, top, bw, maxH, 34); ctx.fill(); ctx.restore();
          ctx.strokeStyle = C.line; ctx.lineWidth = 3; roundRect(ctx, bx, top, bw, maxH, 34); ctx.stroke();
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.font = `44px ${SANS}`; ctx.fillText(b.icon, bx + bw / 2, top + 72);
          ctx.font = `700 22px ${SANS}`; ctx.fillStyle = C.pink; ctx.fillText(b.label.split('').join(' '), bx + bw / 2, top + 112);
          let yy = top + 116;
          ctx.font = `700 36px ${SANS}`; ctx.fillStyle = C.deep;
          b.mainL.forEach((ln) => { yy += 46; ctx.fillText(ln, bx + bw / 2, yy); });
          ctx.font = `500 26px ${SANS}`; ctx.fillStyle = C.soft; yy += 10;
          b.subL.forEach((ln) => { yy += 34; ctx.fillText(ln, bx + bw / 2, yy); });
        });
      });
      y = top + maxH;
    }

    /* ---- itinerary ---- */
    heading('Our Little Plan');
    {
      const timeW = 210; const lineX = X0 + timeW + 26; const tx = lineX + 36; const tw = X0 + CW - tx;
      const first = y + 10;
      let lastMarker = first;
      data.items.forEach((it, i) => {
        const top = y + (i === 0 ? 10 : 26);
        m.font = `700 25px ${SANS}`;
        const timeL = it.time.split(' – ').flatMap((part, k) => wrap(m, k ? `to ${part}` : part, timeW));
        m.font = `700 33px ${SANS}`; const titleL = wrap(m, `${it.icon}  ${it.title}`, tw);
        m.font = `500 25px ${SANS}`;
        const detL = it.details.map((d) => wrap(m, d, tw - 30));
        let yy = top;
        timeL.forEach((ln, k) => { const ly = top + 30 + k * 31; text(ln, X0 + timeW, ly, `700 25px ${SANS}`, it.added ? '#b57d00' : C.rose, 'right'); });
        const markerY = top + 20;
        op((ctx) => heart(ctx, lineX, markerY, 34, it.added ? C.gold : it.free ? C.petal : C.rose));
        lastMarker = markerY;
        titleL.forEach((ln) => { yy += 40; text(ln, tx, yy, `700 33px ${SANS}`, it.free ? C.soft : C.deep); });
        if (it.added) { yy += 32; text('✨ your idea', tx, yy, `700 22px ${SANS}`, '#b57d00'); }
        detL.forEach((lines) => lines.forEach((ln, k) => {
          yy += 33;
          if (k === 0) op(((cy) => (ctx) => heart(ctx, tx + 9, cy - 9, 14, C.petal))(yy));
          text(ln, tx + 30, yy, `500 25px ${SANS}`, C.ink);
        }));
        y = Math.max(yy, top + 30 + timeL.length * 31) + 8;
      });
      const lineTop = first + 20; const lineBottom = lastMarker;
      // timeline line is drawn behind everything else
      ops.unshift((ctx) => {
        ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.setLineDash([3, 12]); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lineX, lineTop); ctx.lineTo(lineX, lineBottom); ctx.stroke(); ctx.restore();
      });
      y += 10;
      block(`Home sweet home by about ${data.homeBy} 🏡`, `600 26px ${SANS}`, C.soft, 36, { align: 'center' });
    }

    /* ---- movie ---- */
    if (data.movie) {
      y += 34;
      const top = y; const pad = 34;
      m.font = `700 38px ${SANS}`; const tL = wrap(m, data.movie.title, CW - 2 * pad - 90);
      const sub = [data.movie.cast && `Starring ${data.movie.cast}`, `Showtime: ${data.movie.showtime}`, data.movie.runtime && `Runtime: ${data.movie.runtime}`].filter(Boolean);
      m.font = `500 26px ${SANS}`; const sL = sub.flatMap((s) => wrap(m, s, CW - 2 * pad - 90));
      const h = pad + 34 + tL.length * 46 + 8 + sL.length * 34 + pad;
      op((ctx) => {
        const g = ctx.createLinearGradient(X0, top, X0 + CW, top + h); g.addColorStop(0, '#ffe9f0'); g.addColorStop(1, '#fff6f9');
        ctx.fillStyle = g; roundRect(ctx, X0, top, CW, h, 30); ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); roundRect(ctx, X0, top, CW, h, 30); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `60px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('🎬', X0 + pad + 36, top + h / 2 + 22);
        ctx.textAlign = 'left'; ctx.font = `700 22px ${SANS}`; ctx.fillStyle = C.pink; ctx.fillText('N O W   S H O W I N G', X0 + pad + 90, top + pad + 22);
        let yy = top + pad + 34;
        ctx.font = `700 38px ${SANS}`; ctx.fillStyle = C.deep; tL.forEach((ln) => { yy += 46; ctx.fillText(ln, X0 + pad + 90, yy); });
        yy += 8; ctx.font = `500 26px ${SANS}`; ctx.fillStyle = C.ink; sL.forEach((ln) => { yy += 34; ctx.fillText(ln, X0 + pad + 90, yy); });
      });
      y = top + h;
    }

    /* ---- her touches ---- */
    const listSection = (title, arr, bullet) => {
      if (!arr.length) return;
      y += 20; heading(title);
      arr.forEach((s) => {
        m.font = `500 27px ${SANS}`; const lines = wrap(m, s, CW - 80);
        lines.forEach((ln, k) => {
          y += 38;
          if (k === 0) op(((cy) => (ctx) => { ctx.font = `26px ${SANS}`; ctx.textAlign = 'left'; ctx.fillText(bullet, X0 + 20, cy); })(y));
          text(ln, X0 + 64, y, `500 27px ${SANS}`, C.ink);
        });
        y += 6;
      });
    };
    listSection('Your Sweet Additions', data.additions, '✨');
    listSection('Changes You Asked For', data.changes, '💗');
    listSection('Little Notes I\'ll Remember', data.notes.map((n) => `“${n}”`), '💌');

    /* ---- closing ---- */
    y += 20; divider();
    block("I can't wait to spend this day with you. Every little part of this plan was made with you in mind, and now it's ours. 💗",
      `600 46px ${SCRIPT}`, C.deep, 58, { align: 'center', x: X0 + 30, w: CW - 60 });
    y += 24;
    block(data.from ? `With all my love, ${data.from}` : 'With all my love 💕', `600 30px ${SANS}`, C.soft, 40, { align: 'center' });

    /* ---- bottom illustration: two hearts + ribbon ---- */
    y += 40;
    const illoY = y + 70;
    op((ctx) => {
      heart(ctx, W / 2 - 38, illoY, 120, C.petal);
      heart(ctx, W / 2 + 38, illoY + 6, 120, C.rose);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.ellipse(W / 2 + 10, illoY - 22, 12, 7, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      sparkle(ctx, W / 2 - 130, illoY - 30, 16, C.gold); sparkle(ctx, W / 2 + 140, illoY - 40, 12, C.pink); sparkle(ctx, W / 2 + 120, illoY + 40, 9, C.gold);
    });
    y = illoY + 70 + P;

    const H = Math.max(Math.round(y + M), Math.round(W * 1.5));
    const extra = H - (y + M); // centre content vertically if it's short

    /* ---- background & frame (drawn first) ---- */
    const bgOps = [(ctx) => {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = rng(7);
      for (let i = 0; i < Math.round(H / 60); i++) heart(ctx, r() * W, r() * H, 20 + r() * 40, '#ffffff', 0.35 + r() * 0.3);
      ctx.save(); ctx.shadowColor = 'rgba(194,65,111,.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      ctx.fillStyle = C.card; roundRect(ctx, M, M, W - 2 * M, H - 2 * M, 54); ctx.fill(); ctx.restore();
      ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.setLineDash([4, 14]); ctx.lineCap = 'round';
      roundRect(ctx, M + 22, M + 22, W - 2 * M - 44, H - 2 * M - 44, 40); ctx.stroke(); ctx.setLineDash([]);
      // corner bouquets
      bouquet(ctx, M + 20, M + 30, 1.1, false); bouquet(ctx, W - M - 20, M + 30, 1.1, true);
      bouquet(ctx, M + 20, H - M - 30, 1, false); bouquet(ctx, W - M - 20, H - M - 30, 1, true);
      // ribbon bow at top
      const bx = W / 2; const by = M + 6;
      ctx.fillStyle = C.pink;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.bezierCurveTo(bx - 90, by - 70, bx - 120, by + 40, bx, by); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.bezierCurveTo(bx + 90, by - 70, bx + 120, by + 40, bx, by); ctx.fill();
      ctx.fillStyle = C.rose;
      ctx.beginPath(); ctx.moveTo(bx - 8, by); ctx.lineTo(bx - 50, by + 80); ctx.lineTo(bx - 30, by + 74); ctx.lineTo(bx - 22, by + 92); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + 8, by); ctx.lineTo(bx + 50, by + 80); ctx.lineTo(bx + 30, by + 74); ctx.lineTo(bx + 22, by + 92); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fill();
      // sparkles
      const s = rng(3);
      // sparkles only in the side gutters so they never sit on text
      for (let i = 0; i < Math.round(H / 260); i++) {
        const gx = i % 2 ? M + 30 + s() * 30 : W - M - 60 + s() * 30;
        sparkle(ctx, gx, M + 220 + s() * (H - 2 * M - 440), 6 + s() * 8, i % 3 ? C.petal : C.gold);
      }
    }];

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    bgOps.forEach((f) => f(ctx));
    ctx.save(); ctx.translate(0, extra / 2);
    ops.forEach((f) => { ctx.save(); f(ctx); ctx.restore(); });
    ctx.restore();
    return canvas;
  }

  window.InvitationRenderer = { render };
})();
