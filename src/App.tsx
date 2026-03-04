import { useState, useCallback, useEffect, FC, KeyboardEvent, ChangeEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Batch {
  letter: string;
  unsoldRaw: string;
}

interface Prize {
  label: string;
}

interface Winner {
  letter: string;
  number: number;
  prize: string | null;
}

interface PublishedData {
  winners: Winner[];
  drawnAt: string;
}

interface CheckResult {
  win: boolean;
  position?: number;
  prize?: string | null;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #F7F7F5;
    --surface: #FFFFFF;
    --surface-2: #F0F0EE;
    --border: #E4E4E0;
    --border-strong: #C8C8C2;
    --text: #111110;
    --text-2: #6B6B67;
    --text-3: #A8A8A4;
    --accent: #0057FF;
    --accent-light: #EEF3FF;
    --accent-mid: #C8D9FF;
    --danger: #FF3B30;
    --success: #16A34A;
    --success-light: #F0FDF4;
    --success-mid: #BBF7D0;
    --prize-bg: #FFFBEA;
    --prize-border: #F0E080;
    --radius: 12px;
    --radius-sm: 8px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif;
    min-height: 100vh;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .app { max-width: 1000px; margin: 0 auto; padding: 48px 24px 96px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes winnerPop {
    from { transform: scale(0.4); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* TOPNAV */
  .topnav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; border-bottom: 1.5px solid var(--border);
    background: var(--surface); position: sticky; top: 0; z-index: 100;
  }
  .topnav-brand { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
  .topnav-links { display: flex; gap: 4px; }
  .nav-link {
    font-size: 0.82rem; font-weight: 500; color: var(--text-2); background: transparent;
    border: 1.5px solid transparent; border-radius: var(--radius-sm); padding: 6px 14px;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  }
  .nav-link:hover { background: var(--surface-2); color: var(--text); }
  .nav-link.active { background: var(--text); color: #fff; border-color: var(--text); }
  .nav-badge {
    background: var(--success); color: #fff; font-size: 0.6rem; font-weight: 600;
    border-radius: 100px; padding: 1px 6px; font-family: 'DM Mono', monospace; animation: chipIn 0.3s ease;
  }

  /* HEADER */
  .header { margin-bottom: 48px; padding-top: 48px; }
  .header-tag {
    display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent);
    background: var(--accent-light); border: 1px solid var(--accent-mid);
    border-radius: 100px; padding: 4px 12px; margin-bottom: 20px;
  }
  .header-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .header h1 {
    font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800;
    color: var(--text); line-height: 1.05; letter-spacing: -0.03em;
  }
  .header-desc { margin-top: 10px; color: var(--text-2); font-size: 1rem; font-weight: 300; max-width: 480px; }

  /* SECTION LABEL */
  .section-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; }

  /* INPUTS */
  .add-row { display: flex; gap: 10px; align-items: stretch; margin-bottom: 32px; flex-wrap: wrap; }
  .input-letter {
    width: 56px; height: 44px; background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Mono', monospace;
    font-size: 1.2rem; font-weight: 500; text-align: center; text-transform: uppercase;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s; flex-shrink: 0;
  }
  .input-letter:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .input-text {
    flex: 1; min-width: 200px; height: 44px; background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Mono', monospace;
    font-size: 0.88rem; padding: 0 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input-text:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .input-text::placeholder { color: var(--text-3); font-family: 'DM Sans', sans-serif; }

  /* BUTTONS */
  .btn {
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.88rem; border: none;
    cursor: pointer; border-radius: var(--radius-sm); transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  }
  .btn-primary { background: var(--text); color: #fff; padding: 0 20px; height: 44px; }
  .btn-primary:hover { background: #2a2a28; transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--text-2); border: 1.5px solid var(--border); padding: 0 16px; height: 44px; }
  .btn-ghost:hover { border-color: var(--border-strong); color: var(--text); }
  .btn-danger { background: transparent; color: var(--text-3); border: 1.5px solid var(--border); padding: 0 12px; height: 28px; font-size: 0.75rem; border-radius: 6px; }
  .btn-danger:hover { border-color: var(--danger); color: var(--danger); }
  .btn-publish {
    background: var(--success); color: #fff; padding: 0 22px; height: 44px; font-size: 0.9rem;
    font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; gap: 7px;
    box-shadow: 0 1px 3px rgba(22,163,74,0.2), 0 4px 12px rgba(22,163,74,0.12); transition: all 0.15s;
  }
  .btn-publish:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
  .btn-publish:disabled { opacity: 0.4; cursor: not-allowed; }

  .error-msg { font-size: 0.8rem; color: var(--danger); margin-top: 6px; margin-bottom: -6px; }

  /* STATS BAR */
  .stats-bar { display: flex; margin-bottom: 24px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: var(--surface); }
  .stat-item { flex: 1; padding: 14px 20px; border-right: 1.5px solid var(--border); }
  .stat-item:last-child { border-right: none; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 2px; }
  .stat-label { font-size: 0.7rem; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.07em; }

  /* BATCH CARDS */
  .batches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 40px; }
  .batch-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 20px; animation: fadeUp 0.25s ease both; transition: border-color 0.15s; }
  .batch-card:hover { border-color: var(--border-strong); }
  .batch-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .batch-id { display: flex; align-items: center; gap: 10px; }
  .batch-letter-badge { font-family: 'DM Mono', monospace; font-size: 1.3rem; font-weight: 500; color: var(--text); background: var(--surface-2); border-radius: 7px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .batch-meta { font-size: 0.78rem; color: var(--text-3); line-height: 1.6; }
  .batch-meta strong { color: var(--text-2); font-weight: 500; }
  .unsold-label { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 5px; display: block; }
  .input-text-sm { width: 100%; background: var(--surface-2); border: 1.5px solid var(--border); border-radius: 7px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 0.8rem; padding: 7px 10px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; margin-bottom: 14px; }
  .input-text-sm:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-light); }
  .input-text-sm::placeholder { color: var(--text-3); font-family: 'DM Sans', sans-serif; font-size: 0.78rem; }

  /* TICKET GRID */
  .ticket-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2.5px; }
  .ticket { aspect-ratio: 1; border-radius: 3px; transition: all 0.12s; position: relative; cursor: default; }
  .ticket:hover::after { content: attr(data-n); position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); background: var(--text); color: #fff; font-size: 0.62rem; font-family: 'DM Mono', monospace; padding: 2px 5px; border-radius: 4px; white-space: nowrap; pointer-events: none; z-index: 10; }
  .ticket-sold { background: var(--surface-2); }
  .ticket-unsold { background: var(--border); opacity: 0.4; }
  .ticket-winner { background: var(--accent) !important; opacity: 1 !important; box-shadow: 0 0 0 2px var(--accent-mid); animation: winnerPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* DIVIDER */
  .divider { height: 1.5px; background: var(--border); margin: 40px 0; }

  /* PRIZES */
  .prizes-section { margin-bottom: 28px; }
  .prize-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
  .prize-row { display: flex; align-items: center; gap: 8px; animation: fadeUp 0.2s ease both; }
  .prize-rank { font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500; color: var(--text-3); width: 56px; flex-shrink: 0; text-align: right; padding-right: 4px; }
  .prize-rank span { display: inline-block; background: var(--surface-2); border: 1.5px solid var(--border); border-radius: 5px; padding: 3px 8px; font-size: 0.72rem; color: var(--text-2); min-width: 44px; text-align: center; }
  .input-prize { flex: 1; height: 38px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.88rem; padding: 0 12px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .input-prize:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .input-prize::placeholder { color: var(--text-3); }
  .btn-remove-prize { background: transparent; border: 1.5px solid var(--border); color: var(--text-3); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; font-size: 1rem; line-height: 1; }
  .btn-remove-prize:hover { border-color: var(--danger); color: var(--danger); }
  .btn-add-prize { background: transparent; border: 1.5px dashed var(--border); color: var(--text-3); padding: 0 14px; height: 36px; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; margin-left: 64px; }
  .btn-add-prize:hover { border-color: var(--border-strong); color: var(--text-2); border-style: solid; }

  /* DRAW CONTROLS */
  .draw-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
  .input-count { width: 88px; height: 44px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 500; text-align: center; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .input-count:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .btn-draw { background: var(--accent); color: #fff; padding: 0 28px; height: 44px; font-size: 0.92rem; font-weight: 600; border-radius: var(--radius-sm); box-shadow: 0 1px 3px rgba(0,87,255,0.2), 0 4px 12px rgba(0,87,255,0.15); transition: all 0.15s; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; gap: 6px; }
  .btn-draw:hover:not(:disabled) { background: #0046cc; transform: translateY(-1px); }
  .btn-draw:disabled { opacity: 0.35; cursor: not-allowed; }

  /* RESULTS */
  .results-wrap { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; animation: fadeUp 0.2s ease; }
  .results-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1.5px solid var(--border); background: var(--surface-2); flex-wrap: wrap; gap: 10px; }
  .results-title { font-weight: 600; font-size: 0.88rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .results-badge { background: var(--accent); color: #fff; font-size: 0.68rem; font-weight: 600; border-radius: 100px; padding: 2px 8px; font-family: 'DM Mono', monospace; }
  .results-actions { display: flex; align-items: center; gap: 8px; }
  .results-body { padding: 20px; }

  /* WINNER ROWS */
  .winner-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1.5px solid var(--border); animation: chipIn 0.25s ease both; }
  .winner-row:last-child { border-bottom: none; padding-bottom: 0; }
  .winner-row:first-child { padding-top: 0; }
  .winner-position { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--text-3); width: 28px; flex-shrink: 0; text-align: right; }
  .winner-chip-inline { display: flex; border-radius: 7px; overflow: hidden; border: 1.5px solid var(--accent-mid); font-family: 'DM Mono', monospace; flex-shrink: 0; }
  .chip-letter { background: var(--accent); color: #fff; font-size: 0.8rem; font-weight: 500; padding: 5px 9px; }
  .chip-num { background: var(--accent-light); color: var(--accent); font-size: 0.8rem; font-weight: 500; padding: 5px 10px; }
  .winner-prize-tag { font-size: 0.82rem; font-weight: 500; color: #7a6a00; background: var(--prize-bg); border: 1.5px solid var(--prize-border); border-radius: 6px; padding: 3px 10px; white-space: nowrap; }
  .winner-prize-tag::before { content: '🏆 '; font-size: 0.75rem; }

  /* PUBLISH BANNER */
  .publish-banner { background: var(--success-light); border: 1.5px solid var(--success-mid); border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 16px; animation: fadeUp 0.25s ease; }
  .publish-banner-text { font-size: 0.85rem; color: var(--success); font-weight: 500; display: flex; align-items: center; gap: 7px; }
  .publish-banner-text svg { flex-shrink: 0; }

  /* MISC */
  .hint { font-size: 0.78rem; color: var(--text-3); margin-top: -12px; margin-bottom: 24px; font-style: italic; }
  .no-batches-state { text-align: center; border: 1.5px dashed var(--border); border-radius: var(--radius); padding: 40px 20px; color: var(--text-3); font-size: 0.9rem; margin-bottom: 40px; }

  /* PUBLIC RESULTS PAGE */
  .public-app { max-width: 680px; margin: 0 auto; padding: 64px 24px 96px; }
  .public-header { text-align: center; margin-bottom: 56px; }
  .public-header h1 { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: var(--text); letter-spacing: -0.03em; margin-bottom: 10px; }
  .public-header p { color: var(--text-2); font-size: 0.95rem; font-weight: 300; }
  .drawn-at { font-size: 0.75rem; color: var(--text-3); margin-top: 6px; font-family: 'DM Mono', monospace; }

  .public-winners { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .public-winner-row { display: flex; align-items: center; gap: 14px; padding: 16px 24px; border-bottom: 1.5px solid var(--border); animation: fadeUp 0.3s ease both; }
  .public-winner-row:last-child { border-bottom: none; }
  .public-pos { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--text-3); width: 32px; flex-shrink: 0; text-align: right; }
  .public-chip { display: flex; border-radius: 8px; overflow: hidden; border: 1.5px solid var(--accent-mid); font-family: 'DM Mono', monospace; flex-shrink: 0; }
  .public-chip-letter { background: var(--accent); color: #fff; font-size: 0.92rem; font-weight: 500; padding: 7px 12px; }
  .public-chip-num { background: var(--accent-light); color: var(--accent); font-size: 0.92rem; font-weight: 500; padding: 7px 13px; }
  .public-prize { font-size: 0.88rem; font-weight: 500; color: #7a6a00; background: var(--prize-bg); border: 1.5px solid var(--prize-border); border-radius: 7px; padding: 5px 12px; }
  .public-prize::before { content: '🏆 '; font-size: 0.8rem; }

  .checker-wrap { margin-top: 40px; }
  .checker-box { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 24px; }
  .checker-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
  .checker-desc { font-size: 0.85rem; color: var(--text-2); margin-bottom: 18px; }
  .checker-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .checker-result { margin-top: 16px; padding: 14px 18px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; animation: fadeUp 0.2s ease; }
  .checker-result.win { background: var(--success-light); border: 1.5px solid var(--success-mid); color: var(--success); }
  .checker-result.no-win { background: var(--surface-2); border: 1.5px solid var(--border); color: var(--text-2); }
  .checker-result .pos-label { font-weight: 600; }

  .empty-public { text-align: center; padding: 80px 24px; color: var(--text-3); }
  .empty-public .icon { font-size: 2.5rem; margin-bottom: 16px; opacity: 0.4; }
  .empty-public h2 { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--text-2); margin-bottom: 8px; }
  .empty-public p { font-size: 0.9rem; }
`;

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseUnsold(raw: string): Set<number> {
  if (!raw.trim()) return new Set();
  const nums = new Set<number>();
  raw.split(/[\s,;]+/).forEach((tok) => {
    if (!tok) return;
    if (tok.includes("-")) {
      const parts = tok.split("-").map(Number);
      const a = parts[0];
      const b = parts[1];
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (i >= 1 && i <= 100) nums.add(i);
        }
      }
    } else {
      const n = Number(tok);
      if (!isNaN(n) && n >= 1 && n <= 100) nums.add(n);
    }
  });
  return nums;
}

function getSold(unsold: Set<number>): number[] {
  const sold: number[] = [];
  for (let i = 1; i <= 100; i++) if (!unsold.has(i)) sold.push(i);
  return sold;
}

function drawWinners(batches: Batch[], count: number): Omit<Winner, "prize">[] {
  const batchPools = batches
    .map((b) => ({ letter: b.letter, sold: getSold(parseUnsold(b.unsoldRaw)) }))
    .filter((b) => b.sold.length > 0);

  if (!batchPools.length) return [];

  const shuffled = [...batchPools].sort(() => Math.random() - 0.5);
  const used = new Map<string, Set<number>>();
  batchPools.forEach((b) => used.set(b.letter, new Set()));

  const winners: Omit<Winner, "prize">[] = [];
  let attempts = 0;

  while (winners.length < count && attempts < count * 20) {
    attempts++;
    const pool = shuffled[winners.length % shuffled.length];
    const available = pool.sold.filter((n) => !used.get(pool.letter)!.has(n));
    const src =
      available.length > 0
        ? pool
        : shuffled.find((b) => b.sold.filter((n) => !used.get(b.letter)!.has(n)).length > 0);
    if (!src) break;
    const avail2 = src.sold.filter((n) => !used.get(src.letter)!.has(n));
    const pick = avail2[Math.floor(Math.random() * avail2.length)];
    used.get(src.letter)!.add(pick);
    winners.push({ letter: src.letter, number: pick });
  }
  return winners;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

// ─── Storage helpers (Vercel Blob via API routes) ─────────────────────────────

async function loadPublished(): Promise<PublishedData | null> {
  try {
    const res = await fetch("/api/winners-get");
    if (!res.ok) return null;
    const { data } = await res.json();
    return data as PublishedData | null;
  } catch {
    return null;
  }
}

async function savePublished(data: PublishedData): Promise<boolean> {
  try {
    const res = await fetch("/api/winners-put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function clearPublished(): Promise<boolean> {
  try {
    const res = await fetch("/api/winners-delete", { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Hash router ──────────────────────────────────────────────────────────────

function useHash(): [string, (h: string) => void] {
  const [hash, setHash] = useState<string>(() => window.location.hash || "#admin");

  useEffect(() => {
    const handler = () => setHash(window.location.hash || "#admin");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (h: string) => {
    window.location.hash = h;
  };

  return [hash, navigate];
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

interface TopNavProps {
  page: "admin" | "results";
  hasPublished: boolean;
}

const TopNav: FC<TopNavProps> = ({ page, hasPublished }) => (
  <nav className="topnav">
    <span className="topnav-brand">Winner Draw</span>
    <div className="topnav-links">
      <a className={`nav-link${page === "admin" ? " active" : ""}`} href="#admin">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="7" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="7" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Admin
      </a>
      <a className={`nav-link${page === "results" ? " active" : ""}`} href="#results">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M1 10L4.5 6.5L7 9L10.5 4.5L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Results
        {hasPublished && <span className="nav-badge">Live</span>}
      </a>
    </div>
  </nav>
);

// ─── Public Results Page ──────────────────────────────────────────────────────

const PublicPage: FC = () => {
  const [data, setData] = useState<PublishedData | null | undefined>(undefined);
  const [checkLetter, setCheckLetter] = useState("");
  const [checkNum, setCheckNum] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    loadPublished().then(setData);
  }, []);

  const handleCheck = () => {
    if (!data) return;
    const l = checkLetter.trim().toUpperCase();
    const n = parseInt(checkNum, 10);
    if (!l || isNaN(n)) return;
    const idx = data.winners.findIndex((w) => w.letter === l && w.number === n);
    setCheckResult(
      idx >= 0
        ? { win: true, position: idx + 1, prize: data.winners[idx].prize }
        : { win: false }
    );
  };

  if (data === undefined) {
    return (
      <div className="public-app">
        <div className="empty-public">
          <div className="icon">⏳</div>
          <h2>Loading…</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="public-app">
        <div className="empty-public">
          <div className="icon">🎫</div>
          <h2>No results yet</h2>
          <p>The draw hasn't been published. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-app">
      <div className="public-header">
        <div className="header-tag" style={{ margin: "0 auto 20px" }}>Official Results</div>
        <h1>Winning Tickets</h1>
        <p>Check below to see if your ticket is a winner.</p>
        {data.drawnAt && <div className="drawn-at">Draw completed {formatDate(data.drawnAt)}</div>}
      </div>

      <div className="public-winners">
        {data.winners.map((w, i) => (
          <div
            className="public-winner-row"
            key={i}
            style={{ animationDelay: `${Math.min(i * 0.04, 0.6)}s` }}
          >
            <span className="public-pos">{i + 1}.</span>
            <div className="public-chip">
              <span className="public-chip-letter">{w.letter}</span>
              <span className="public-chip-num">{String(w.number).padStart(3, "0")}</span>
            </div>
            {w.prize && <span className="public-prize">{w.prize}</span>}
          </div>
        ))}
      </div>

      <div className="checker-wrap">
        <div className="checker-box">
          <div className="checker-title">Check your ticket</div>
          <div className="checker-desc">Enter the batch letter and ticket number printed on your ticket.</div>
          <div className="checker-row">
            <input
              className="input-letter"
              style={{ height: 44 }}
              value={checkLetter}
              maxLength={1}
              placeholder="A"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCheckLetter(e.target.value);
                setCheckResult(null);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleCheck()}
            />
            <input
              type="number"
              className="input-count"
              style={{ width: 100 }}
              value={checkNum}
              min={1}
              max={100}
              placeholder="42"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCheckNum(e.target.value);
                setCheckResult(null);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleCheck()}
            />
            <button className="btn btn-primary" onClick={handleCheck}>Check</button>
          </div>
          {checkResult && (
            <div className={`checker-result ${checkResult.win ? "win" : "no-win"}`}>
              {checkResult.win ? (
                <>
                  🎉 <span className="pos-label">Congratulations!</span> Your ticket is winner #{checkResult.position}.
                  {checkResult.prize && <> — <strong>{checkResult.prize}</strong></>}
                </>
              ) : (
                <>Your ticket was not drawn this time. Better luck next time!</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Admin Page ───────────────────────────────────────────────────────────────

interface AdminPageProps {
  publishedData: PublishedData | null | undefined;
  onPublish: (data: PublishedData) => void;
  onClearPublished: () => void;
}

const AdminPage: FC<AdminPageProps> = ({ publishedData, onPublish, onClearPublished }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newLetter, setNewLetter] = useState("");
  const [newUnsold, setNewUnsold] = useState("");
  const [addError, setAddError] = useState("");
  const [drawCount, setDrawCount] = useState(10);
  const [prizes, setPrizes] = useState<Prize[]>([{ label: "" }]);
  const [winners, setWinners] = useState<Winner[] | null>(null);
  const [winnerSet, setWinnerSet] = useState<Map<string, Set<number>> | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const totalSold = batches.reduce(
    (s, b) => s + getSold(parseUnsold(b.unsoldRaw)).length,
    0
  );
  const totalUnsold = batches.length * 100 - totalSold;

  const handleAdd = useCallback(() => {
    const letter = newLetter.trim().toUpperCase();
    if (!letter || !/^[A-Z]$/.test(letter)) { setAddError("Enter a single letter A–Z."); return; }
    if (batches.some((b) => b.letter === letter)) { setAddError(`Batch ${letter} already exists.`); return; }
    setBatches((prev) => [...prev, { letter, unsoldRaw: newUnsold }]);
    setNewLetter(""); setNewUnsold(""); setAddError("");
    setWinners(null); setWinnerSet(null);
  }, [newLetter, newUnsold, batches]);

  const handleRemove = (letter: string) => {
    setBatches((prev) => prev.filter((b) => b.letter !== letter));
    setWinners(null); setWinnerSet(null);
  };

  const handleUnsoldChange = (letter: string, val: string) => {
    setBatches((prev) => prev.map((b) => (b.letter === letter ? { ...b, unsoldRaw: val } : b)));
    setWinners(null); setWinnerSet(null);
  };

  const addPrize = () => setPrizes((p) => [...p, { label: "" }]);
  const removePrize = (i: number) => setPrizes((p) => p.filter((_, j) => j !== i));
  const updatePrize = (i: number, val: string) =>
    setPrizes((p) => p.map((x, j) => (j === i ? { label: val } : x)));

  const handleDraw = () => {
    const result = drawWinners(batches, drawCount);
    const resultWithPrizes: Winner[] = result.map((w, i) => ({
      ...w,
      prize: prizes[i]?.label?.trim() || null,
    }));
    setWinners(resultWithPrizes);
    const map = new Map<string, Set<number>>();
    result.forEach((w) => {
      if (!map.has(w.letter)) map.set(w.letter, new Set());
      map.get(w.letter)!.add(w.number);
    });
    setWinnerSet(map);
    setJustPublished(false);
  };

  const handlePublish = async () => {
    if (!winners) return;
    setPublishing(true);
    const payload: PublishedData = { winners, drawnAt: new Date().toISOString() };
    const ok = await savePublished(payload);
    setPublishing(false);
    if (ok) { setJustPublished(true); onPublish(payload); }
  };

  const handleClearPublished = async () => {
    await clearPublished();
    setJustPublished(false);
    onClearPublished();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-tag">Admin</div>
        <h1>Winner Draw</h1>
        <p className="header-desc">Enter each batch's unsold tickets, draw winners, then publish the results for ticket buyers.</p>
      </header>

      <div className="section-label">Add a batch</div>
      <div className="add-row">
        <input
          className="input-letter"
          value={newLetter}
          maxLength={1}
          placeholder="A"
          onChange={(e: ChangeEvent<HTMLInputElement>) => { setNewLetter(e.target.value); setAddError(""); }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAdd()}
        />
        <input
          className="input-text"
          value={newUnsold}
          placeholder="Unsold ticket numbers — e.g. 3, 7, 15–20, 45"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUnsold(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Batch
        </button>
      </div>
      {addError && <div className="error-msg">{addError}</div>}

      {batches.length === 0 ? (
        <div className="no-batches-state">No batches yet — add one above to get started.</div>
      ) : (
        <>
          <div className="stats-bar">
            {[
              { val: batches.length, label: `Batch${batches.length !== 1 ? "es" : ""}` },
              { val: totalSold, label: "Sold" },
              { val: totalUnsold, label: "Unsold" },
              { val: batches.length * 100, label: "Total" },
            ].map((s) => (
              <div className="stat-item" key={s.label}>
                <div className="stat-val">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="batches-grid">
            {batches.map((b) => {
              const unsoldSet = parseUnsold(b.unsoldRaw);
              const soldList = getSold(unsoldSet);
              const wSet = winnerSet?.get(b.letter) ?? new Set<number>();
              return (
                <div className="batch-card" key={b.letter}>
                  <div className="batch-card-header">
                    <div className="batch-id">
                      <div className="batch-letter-badge">{b.letter}</div>
                      <div className="batch-meta">
                        <div><strong>{soldList.length}</strong> sold</div>
                        <div><strong>{unsoldSet.size}</strong> unsold</div>
                      </div>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleRemove(b.letter)}>Remove</button>
                  </div>
                  <span className="unsold-label">Unsold numbers</span>
                  <input
                    className="input-text-sm"
                    value={b.unsoldRaw}
                    placeholder="e.g. 3, 15–20, 45"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleUnsoldChange(b.letter, e.target.value)}
                  />
                  <div className="ticket-grid">
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
                      const unsold = unsoldSet.has(n);
                      const winner = wSet.has(n);
                      return (
                        <div
                          key={n}
                          data-n={n}
                          className={`ticket ${unsold ? "ticket-unsold" : "ticket-sold"} ${winner ? "ticket-winner" : ""}`}
                          style={winner ? { animationDelay: `${(n % 15) * 0.03}s` } : {}}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="divider" />

      <div className="section-label">
        Prizes{" "}
        <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", fontSize: "0.75rem" }}>
          — assign a prize description to the top winners (optional)
        </span>
      </div>
      <div className="prizes-section">
        <div className="prize-rows">
          {prizes.map((p, i) => (
            <div className="prize-row" key={i}>
              <div className="prize-rank"><span>#{i + 1}</span></div>
              <input
                className="input-prize"
                value={p.label}
                placeholder={i === 0 ? "1st Prize — Weekend Getaway" : i === 1 ? "2nd Prize — €500 Gift Card" : `Prize #${i + 1}`}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updatePrize(i, e.target.value)}
              />
              {prizes.length > 1 && (
                <button className="btn-remove-prize" onClick={() => removePrize(i)}>×</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-add-prize" onClick={addPrize}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Add prize tier
        </button>
      </div>

      <div className="section-label">Draw winners</div>
      <div className="draw-controls">
        <input
          type="number"
          className="input-count"
          value={drawCount}
          min={1}
          max={totalSold || 1}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDrawCount(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
        />
        <button className="btn-draw" onClick={handleDraw} disabled={totalSold === 0}>
          Draw {drawCount} winner{drawCount !== 1 ? "s" : ""}
        </button>
        {winners && (
          <button
            className="btn btn-ghost"
            onClick={() => { setWinners(null); setWinnerSet(null); setJustPublished(false); }}
          >
            Clear results
          </button>
        )}
      </div>

      {batches.length > 0 && totalSold === 0 && (
        <p className="hint">All tickets appear unsold — edit each batch to mark which were sold.</p>
      )}

      {winners && winners.length > 0 && (
        <div className="results-wrap">
          <div className="results-header">
            <div className="results-title">
              Winners <span className="results-badge">{winners.length}</span>
            </div>
            <div className="results-actions">
              <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Even distribution across batches</span>
            </div>
          </div>
          <div className="results-body">
            {winners.map((w, i) => (
              <div className="winner-row" key={i} style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
                <span className="winner-position">{i + 1}.</span>
                <div className="winner-chip-inline">
                  <span className="chip-letter">{w.letter}</span>
                  <span className="chip-num">{String(w.number).padStart(3, "0")}</span>
                </div>
                {w.prize && <span className="winner-prize-tag">{w.prize}</span>}
              </div>
            ))}
            <div className="publish-banner">
              <div className="publish-banner-text">
                {justPublished ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Results are live on the Results page. Ticket buyers can check their numbers now.
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#16A34A" strokeWidth="1.5" />
                      <path d="M8 5v3.5l2 2" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Ready to share? Publish these results so ticket buyers can verify their tickets.
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {justPublished && publishedData && (
                  <button
                    className="btn btn-ghost"
                    style={{ height: 36, fontSize: "0.8rem" }}
                    onClick={handleClearPublished}
                  >
                    Unpublish
                  </button>
                )}
                <button className="btn-publish" onClick={handlePublish} disabled={publishing}>
                  {publishing ? "Publishing…" : justPublished ? "Re-publish" : "Publish results →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {winners && winners.length === 0 && (
        <p className="hint" style={{ color: "var(--danger)" }}>
          Not enough sold tickets to fulfil that draw count.
        </p>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const App: FC = () => {
  const [hash] = useHash();
  const [publishedData, setPublishedData] = useState<PublishedData | null | undefined>(undefined);

  useEffect(() => {
    loadPublished().then(setPublishedData);
  }, []);

  const page: "admin" | "results" = hash === "#results" ? "results" : "admin";

  return (
    <>
      <style>{STYLE}</style>
      {page === "admin" && <TopNav page={page} hasPublished={!!publishedData} />}
      {page === "results" ? (
        <PublicPage />
      ) : (
        <AdminPage
          publishedData={publishedData}
          onPublish={(d) => setPublishedData(d)}
          onClearPublished={() => setPublishedData(null)}
        />
      )}
    </>
  );
};

export default App;
