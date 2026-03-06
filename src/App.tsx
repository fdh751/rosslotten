import { useState, useCallback, useEffect, FC, KeyboardEvent, ChangeEvent } from "react";
import { jsPDF } from "jspdf";

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
  winnerIndices?: number[];
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

  .app { width: 100%; max-width: 1400px; margin: 0 auto; padding: 40px 32px 96px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  /* TOPNAV */
  .topnav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; border-bottom: 1.5px solid var(--border);
    background: var(--surface); position: sticky; top: 0; z-index: 100;
  }
  .topnav-brand { font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
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
  .header { margin-bottom: 36px; padding-top: 32px; }
  .header-tag {
    display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent);
    background: var(--accent-light); border: 1px solid var(--accent-mid);
    border-radius: 100px; padding: 4px 12px; margin-bottom: 16px;
  }
  .header-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .header h1 {
    font-family: 'DM Sans', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800;
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
  .batches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 40px; }
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
  .results-wrap { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; animation: fadeUp 0.2s ease; margin-bottom: 40px; }
  .results-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1.5px solid var(--border); background: var(--surface-2); flex-wrap: wrap; gap: 12px; }
  .results-title { font-weight: 600; font-size: 0.92rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .results-badge { background: var(--accent); color: #fff; font-size: 0.72rem; font-weight: 600; border-radius: 100px; padding: 3px 10px; font-family: 'DM Mono', monospace; }
  .results-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .results-body { padding: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }

  /* WINNER ROWS */
  .winner-row { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: var(--surface-2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); animation: chipIn 0.25s ease both; text-align: center; cursor: pointer; transition: all 0.15s; }
  .winner-row:hover { background: var(--surface-3); border-color: var(--border-strong); }
  .winner-row.published { background: var(--success-light); border: 1.5px solid var(--success-mid); }
  .winner-row.published:hover { background: var(--success-light); opacity: 0.85; }
  .winner-position { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--text-3); font-weight: 600; }
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
  .public-app { width: 100%; max-width: 1200px; margin: 0 auto; padding: 64px 32px 96px; }
  .public-header { text-align: center; margin-bottom: 40px; }
  .public-header h1 { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: var(--text); letter-spacing: -0.03em; margin-bottom: 10px; }
  .public-header p { color: var(--text-2); font-size: 0.95rem; font-weight: 300; }
  .drawn-at { font-size: 0.75rem; color: var(--text-3); margin-top: 6px; font-family: 'DM Mono', monospace; }

  .public-winners { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .public-winner-row { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); animation: fadeUp 0.3s ease both; text-align: center; }
  .public-winner-row:last-child { border: 1.5px solid var(--border); }
  .public-pos { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--text-3); text-align: center; }
  .public-chip { display: flex; border-radius: 8px; overflow: hidden; border: 1.5px solid var(--accent-mid); font-family: 'DM Mono', monospace; flex-shrink: 0; }
  .public-chip-letter { background: var(--accent); color: #fff; font-size: 0.92rem; font-weight: 500; padding: 7px 12px; }
  .public-chip-num { background: var(--accent-light); color: var(--accent); font-size: 0.92rem; font-weight: 500; padding: 7px 13px; }
  .public-prize { font-size: 0.88rem; font-weight: 500; color: #7a6a00; background: var(--prize-bg); border: 1.5px solid var(--prize-border); border-radius: 7px; padding: 5px 12px; }
  .public-prize::before { content: '🏆 '; font-size: 0.8rem; }

  .checker-wrap { margin-top: 40px; }
  .checker-box { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 24px; max-width: 600px; margin: 40px auto 0; }
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

  /* BROADCAST PAGE */
  .broadcast-app { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%); color: #fff; overflow: hidden; }
  .broadcast-container { text-align: center; padding: 40px; max-width: 90vw; }
  .broadcast-label { font-size: clamp(1.5rem, 8vw, 3rem); font-weight: 700; margin-bottom: 30px; opacity: 0.9; letter-spacing: 0.02em; }
  .broadcast-ticket { display: flex; flex-direction: column; align-items: center; gap: 30px; animation: fadeUp 0.4s ease; }
  .broadcast-letter { font-size: clamp(2rem, 15vw, 8rem); font-weight: 800; font-family: 'DM Mono', monospace; letter-spacing: 0.1em; }
  .broadcast-number { font-size: clamp(2.5rem, 20vw, 12rem); font-weight: 800; font-family: 'DM Mono', monospace; letter-spacing: 0.05em; }
  .broadcast-prize { font-size: clamp(1rem, 5vw, 2.5rem); font-weight: 600; margin-top: 30px; opacity: 0.95; }
  .broadcast-empty { font-size: clamp(1.5rem, 8vw, 3rem); opacity: 0.8; }

  /* LOGIN PAGE */
  .login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: var(--bg); }
  .login-box { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 40px; max-width: 400px; width: 100%; animation: fadeUp 0.3s ease; }
  .login-box h1 { font-family: 'DM Sans', sans-serif; font-size: 1.8rem; font-weight: 800; color: var(--text); margin-bottom: 10px; letter-spacing: -0.02em; }
  .login-box p { color: var(--text-2); font-size: 0.9rem; margin-bottom: 30px; }
  .login-field { margin-bottom: 20px; }
  .login-field label { display: block; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
  .login-field input { width: 100%; height: 44px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; padding: 0 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .login-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .login-field input::placeholder { color: var(--text-3); }
  .login-error { color: var(--danger); font-size: 0.8rem; margin-top: 6px; }
  .login-btn { width: 100%; height: 44px; background: var(--text); color: #fff; border: none; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
  .login-btn:hover { background: #2a2a28; transform: translateY(-1px); }
  .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* SETTINGS MODAL */
  .settings-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; animation: fadeUp 0.2s ease; }
  .settings-modal { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 32px; max-width: 450px; width: 100%; animation: fadeUp 0.25s ease; }
  .settings-modal h2 { font-family: 'DM Sans', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--text); margin-bottom: 24px; }
  .settings-field { margin-bottom: 20px; }
  .settings-field label { display: block; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
  .settings-field input { width: 100%; height: 44px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; padding: 0 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .settings-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .settings-field input::placeholder { color: var(--text-3); }
  .settings-error { color: var(--danger); font-size: 0.8rem; margin-top: 6px; }
  .settings-success { color: var(--success); font-size: 0.8rem; margin-top: 6px; }
  .settings-actions { display: flex; gap: 12px; margin-top: 28px; }
  .settings-btn { flex: 1; height: 44px; background: var(--text); color: #fff; border: none; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
  .settings-btn:hover { background: #2a2a28; transform: translateY(-1px); }
  .settings-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .settings-btn-cancel { background: transparent; color: var(--text-2); border: 1.5px solid var(--border); }
  .settings-btn-cancel:hover { border-color: var(--border-strong); color: var(--text); background: var(--surface-2); }

  /* TOPNAV SETTINGS BUTTON */
  .btn-settings { background: transparent; color: var(--text-2); border: 1.5px solid var(--border); padding: 6px 14px; height: 32px; font-size: 0.75rem; font-family: 'DM Sans', sans-serif; font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s; }
  .btn-settings:hover { border-color: var(--border-strong); color: var(--text); }
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

async function loadPrizes(): Promise<Prize[]> {
  try {
    const res = await fetch("/api/prizes-get");
    if (!res.ok) return [{ label: "" }];
    const { prizes } = await res.json();
    return (prizes && prizes.length > 0) ? prizes : [{ label: "" }];
  } catch {
    return [{ label: "" }];
  }
}

async function savePrizes(prizes: Prize[]): Promise<boolean> {
  try {
    const res = await fetch("/api/prizes-put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prizes),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadBatches(): Promise<Batch[]> {
  try {
    const res = await fetch("/api/batches-get");
    if (!res.ok) return [];
    const { batches } = await res.json();
    return (batches && batches.length > 0) ? batches : [];
  } catch {
    return [];
  }
}

async function saveBatches(batches: Batch[]): Promise<boolean> {
  try {
    const res = await fetch("/api/batches-put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batches),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function generateWinnersPDF(winners: Winner[], drawnAt: string): void {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text("Vinnande biljetter", pageWidth / 2, yPos);
  yPos += 12;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const formattedDate = formatDate(drawnAt) || drawnAt || "";
  const dateText = "Dragning slutförd " + formattedDate;
  doc.text(dateText, pageWidth / 2, yPos);
  yPos += 10;

  // Table header
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");

  const col1 = 20;
  const col2 = 50;
  const col3 = 110;

  doc.text("Plats", col1, yPos);
  doc.text("Biljett", col2, yPos);
  doc.text("Pris", col3, yPos);
  yPos += 8;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos - 2, pageWidth - 15, yPos - 2);
  yPos += 2;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  winners.forEach((w, i) => {
    // Check if we need a new page
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(`${i + 1}.`, col1, yPos);
    doc.text(`${w.letter}${String(w.number).padStart(3, "0")}`, col2, yPos);
    doc.text(w.prize || "—", col3, yPos);
    yPos += 8;
  });

  doc.save("vinnare.pdf");
}

// ─── Authentication helpers ───────────────────────────────────────────────────

async function checkAuthRequired(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth-check");
    if (!res.ok) return false;
    const { requiresAuth } = await res.json();
    return requiresAuth;
  } catch {
    return false;
  }
}

async function loginWithCredentials(
  username: string,
  password: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/auth-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return null;
    const { sessionToken } = await res.json();
    return sessionToken;
  } catch {
    return null;
  }
}

async function setCredentials(
  username: string,
  password: string,
  currentPassword?: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/auth-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, currentPassword }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Hash router ──────────────────────────────────────────────────────────────

function useHash(): [string, (h: string) => void] {
  const [hash, setHash] = useState<string>(() => window.location.hash || "#results");

  useEffect(() => {
    const handler = () => setHash(window.location.hash || "#results");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (h: string) => {
    window.location.hash = h;
  };

  return [hash, navigate];
}

// ─── Login Page ───────────────────────────────────────────────────────────────

interface LoginPageProps {
  onLoginSuccess: () => void;
  isLoading?: boolean;
}

const LoginPage: FC<LoginPageProps> = ({ onLoginSuccess, isLoading }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Användarnamn och lösenord är obligatoriska.");
      return;
    }

    setLoading(true);
    setError("");

    const token = await loginWithCredentials(username, password);
    if (token) {
      localStorage.setItem("rosslotten-auth-token", token);
      onLoginSuccess();
    } else {
      setError("Ogiltiga autentiseringsuppgifter.");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Inloggning</h1>
        <p>Ange dina autentiseringsuppgifter för att få åtkomst till admin-panelen.</p>
        <div className="login-field">
          <label>Användarnamn</label>
          <input
            type="text"
            placeholder="Användarnamn"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
        </div>
        <div className="login-field">
          <label>Lösenord</label>
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" onClick={handleLogin} disabled={loading || isLoading}>
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </div>
    </div>
  );
};

// ─── Settings Modal ────────────────────────────────────────────────────────────

interface SettingsModalProps {
  onClose: () => void;
  requiresCurrentPassword: boolean;
}

const SettingsModal: FC<SettingsModalProps> = ({ onClose, requiresCurrentPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Användarnamn och lösenord är obligatoriska.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken långt.");
      return;
    }

    if (requiresCurrentPassword && !currentPassword) {
      setError("Du måste ange ditt nuvarande lösenord.");
      return;
    }

    setLoading(true);

    const ok = await setCredentials(
      username,
      password,
      requiresCurrentPassword ? currentPassword : undefined
    );

    if (ok) {
      setSuccess("Autentiseringsuppgifterna uppdaterades.");
      setTimeout(onClose, 1500);
    } else {
      setError(requiresCurrentPassword ? "Nuvarande lösenord är felaktig." : "Misslyckades uppdatera autentiseringsuppgifterna.");
    }

    setLoading(false);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Autentiseringsuppgifter</h2>

        {requiresCurrentPassword && (
          <div className="settings-field">
            <label>Nuvarande lösenord</label>
            <input
              type="password"
              placeholder="Nuvarande lösenord"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
              disabled={loading}
            />
          </div>
        )}

        <div className="settings-field">
          <label>Nytt användarnamn</label>
          <input
            type="text"
            placeholder="Nytt användarnamn"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            disabled={loading}
          />
        </div>

        <div className="settings-field">
          <label>Nytt lösenord</label>
          <input
            type="password"
            placeholder="Nytt lösenord"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            disabled={loading}
          />
        </div>

        <div className="settings-field">
          <label>Bekräfta lösenord</label>
          <input
            type="password"
            placeholder="Bekräfta lösenord"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            disabled={loading}
          />
        </div>

        {error && <div className="settings-error">{error}</div>}
        {success && <div className="settings-success">{success}</div>}

        <div className="settings-actions">
          <button className="settings-btn settings-btn-cancel" onClick={onClose} disabled={loading}>
            Avbryt
          </button>
          <button className="settings-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TopNav ───────────────────────────────────────────────────────────────────

interface TopNavProps {
  page: "admin" | "results" | "broadcast";
  hasPublished: boolean;
  onUnpublish?: () => void;
  onSettings?: () => void;
}

const TopNav: FC<TopNavProps> = ({ page, hasPublished, onUnpublish, onSettings }) => (
  <nav className="topnav">
    <span className="topnav-brand">Vinnardragning</span>
    <div className="topnav-links" style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
        Resultat
        {hasPublished && <span className="nav-badge">Live</span>}
      </a>
      <a className={`nav-link${page === "broadcast" ? " active" : ""}`} href="#broadcast">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M1.5 3.5L1.5 11.5M11.5 3.5L11.5 11.5M1.5 3.5L4 1.5L4 5.5M11.5 3.5L9 1.5L9 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Visning
      </a>
      {onSettings && (
        <button
          className="btn-settings"
          onClick={onSettings}
          title="Autentiseringsuppgifter"
        >
          Inställningar
        </button>
      )}
      {hasPublished && (
        <button
          className="nav-link"
          onClick={onUnpublish}
          style={{
            background: "transparent",
            border: "1.5px solid var(--border)",
            color: "var(--text-3)",
            cursor: "pointer",
            fontSize: "0.82rem",
            padding: "6px 14px",
          }}
        >
          Avpublicera
        </button>
      )}
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
    
    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadPublished().then(setData);
    }, 2000);
    
    return () => clearInterval(interval);
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
          <h2>Laddar…</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="public-app">
        <div className="empty-public">
          <div className="icon">🎫</div>
          <h2>Inga resultat ännu</h2>
          <p>Dragningen har inte publicerats. Kom tillbaka snart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-app">
      <div className="public-header">
        <div className="header-tag" style={{ margin: "0 auto 20px" }}>Officiella resultat</div>
        <h1>Vinnande biljetter</h1>
        <p>Kontrollera nedan för att se om din biljett är en vinnare.</p>
        {data.drawnAt && <div className="drawn-at">Dragning slutförd {formatDate(data.drawnAt)}</div>}
      </div>

      <div className="public-winners">
        {data.winners.map((w, i) => {
          const originalPos = data.winnerIndices?.[i] ?? i;
          return (
            <div
              className="public-winner-row"
              key={i}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.6)}s` }}
            >
              <span className="public-pos">{originalPos + 1}.</span>
              <div className="public-chip">
                <span className="public-chip-letter">{w.letter}</span>
                <span className="public-chip-num">{String(w.number).padStart(3, "0")}</span>
              </div>
              {w.prize && <span className="public-prize">{w.prize}</span>}
            </div>
          );
        })}
      </div>

      <div className="checker-wrap">
        <div className="checker-box">
          <div className="checker-title">Kontrollera din biljett</div>
          <div className="checker-desc">Ange ditt biljettnummer.</div>
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
            <button className="btn btn-primary" onClick={handleCheck}>Kontrollera</button>
          </div>
          {checkResult && (
            <div className={`checker-result ${checkResult.win ? "win" : "no-win"}`}>
              {checkResult.win ? (
                <>
                  🎉 <span className="pos-label">Grattis!</span> Din biljett är vinnare #{checkResult.position}.
                  {checkResult.prize && <> — <strong>{checkResult.prize}</strong></>}
                </>
              ) : (
                <>Din biljett drogs inte denna gång. Lycka till nästa gång!</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Broadcast Page ───────────────────────────────────────────────────────────

const BroadcastPage: FC = () => {
  const [data, setData] = useState<PublishedData | null | undefined>(undefined);

  useEffect(() => {
    loadPublished().then(setData);
    
    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadPublished().then(setData);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const lastWinner = data?.winners[data.winners.length - 1];

  if (data === undefined) {
    return (
      <div className="broadcast-app">
        <div className="broadcast-container">
          <div className="broadcast-empty">Laddar…</div>
        </div>
      </div>
    );
  }

  if (!lastWinner) {
    return (
      <div className="broadcast-app">
        <div className="broadcast-container">
          <div className="broadcast-empty">Inga vinnare ännu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-app">
      <div className="broadcast-container">
        <div className="broadcast-label">Senaste vinnare</div>
        <div className="broadcast-ticket">
          <div className="broadcast-letter">{lastWinner.letter}</div>
          <div className="broadcast-number">{String(lastWinner.number).padStart(3, "0")}</div>
          {lastWinner.prize && <div className="broadcast-prize">🏆 {lastWinner.prize}</div>}
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
  const [publishedIndices, setPublishedIndices] = useState<Set<number>>(new Set());
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [batchesLoaded, setBatchesLoaded] = useState(false);
  const isPublished = !!publishedData;

  // Load batches on mount
  useEffect(() => {
    loadBatches().then((loadedBatches) => {
      setBatches(loadedBatches);
      setBatchesLoaded(true);
    });
  }, []);

  // Save batches when they change (but not during initial load)
  useEffect(() => {
    if (!batchesLoaded) return;
    const timer = setTimeout(() => {
      saveBatches(batches);
    }, 500);
    return () => clearTimeout(timer);
  }, [batches, batchesLoaded]);

  // Load prizes on mount
  useEffect(() => {
    loadPrizes().then((loadedPrizes) => {
      setPrizes(loadedPrizes);
      setPrizesLoaded(true);
    });
  }, []);

  // Save prizes when they change (but not during initial load)
  useEffect(() => {
    if (!prizesLoaded) return;
    const timer = setTimeout(() => {
      savePrizes(prizes);
    }, 500);
    return () => clearTimeout(timer);
  }, [prizes, prizesLoaded]);

  // Determine published indices from publishedData
  useEffect(() => {
    if (publishedData && winners) {
      const indices = new Set<number>();
      publishedData.winners.forEach((pubWinner) => {
        const idx = winners.findIndex((w) => w.letter === pubWinner.letter && w.number === pubWinner.number);
        if (idx >= 0) indices.add(idx);
      });
      setPublishedIndices(indices);
    } else if (!publishedData) {
      // Clear published indices when all winners are unpublished
      setPublishedIndices(new Set());
    }
  }, [publishedData, winners]);

  const totalSold = batches.reduce(
    (s, b) => s + getSold(parseUnsold(b.unsoldRaw)).length,
    0
  );
  const totalUnsold = batches.length * 100 - totalSold;

  const handleAdd = useCallback(() => {
    const letter = newLetter.trim().toUpperCase();
    if (!letter || !/^[A-Z]$/.test(letter)) { setAddError("Ange en enda bokstav A–Z."); return; }
    if (batches.some((b) => b.letter === letter)) { setAddError(`Ring ${letter} finns redan.`); return; }
    setBatches((prev) => [...prev, { letter, unsoldRaw: newUnsold }]);
    setNewLetter(""); setNewUnsold(""); setAddError("");
    setWinners(null);
  }, [newLetter, newUnsold, batches]);

  const handleRemove = (letter: string) => {
    setBatches((prev) => prev.filter((b) => b.letter !== letter));
    setWinners(null);
  };

  const handleUnsoldChange = (letter: string, val: string) => {
    setBatches((prev) => prev.map((b) => (b.letter === letter ? { ...b, unsoldRaw: val } : b)));
    setWinners(null);
  };

  const addPrize = () => setPrizes((p) => [...p, { label: "" }]);
  const removePrize = (i: number) => setPrizes((p) => p.filter((_, j) => j !== i));
  const updatePrize = (i: number, val: string) =>
    setPrizes((p) => p.map((x, j) => (j === i ? { label: val } : x)));

  const handleDraw = async () => {
    // Clear any previously published results before drawing new ones
    if (isPublished) {
      await clearPublished();
      onClearPublished();
    }
    const result = drawWinners(batches, drawCount);
    const resultWithPrizes: Winner[] = result.map((w, i) => ({
      ...w,
      prize: prizes[i]?.label?.trim() || null,
    }));
    setWinners(resultWithPrizes);
    setPublishedIndices(new Set());
  };

  const handlePublishRow = async (index: number) => {
    if (!winners) return;
    const newPublishedIndices = new Set(publishedIndices);
    if (newPublishedIndices.has(index)) {
      newPublishedIndices.delete(index);
    } else {
      newPublishedIndices.add(index);
    }
    setPublishedIndices(newPublishedIndices);

    // Build the published winners list in order
    const sortedIndices = Array.from(newPublishedIndices).sort((a, b) => a - b);
    const publishedWinners = sortedIndices.map((idx) => winners[idx]);

    if (publishedWinners.length === 0) {
      await clearPublished();
      onClearPublished();
    } else {
      const payload: PublishedData = { winners: publishedWinners, drawnAt: new Date().toISOString(), winnerIndices: sortedIndices };
      const ok = await savePublished(payload);
      if (ok) { onPublish(payload); }
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-tag">Admin</div>
        <h1>RossLotten</h1>
        <p className="header-desc">Ange varje rings osålda lotter, dra vinnare och publicera sedan resultaten.</p>
      </header>

      <div className="section-label">
        Priser{" "}
        <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", fontSize: "0.75rem" }}>
          — lägg till en prisbeskrivning (valfritt)
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
                placeholder={i === 0 ? "1:a pris — Weekendgiveaway" : i === 1 ? "2:a pris — €500 gavokort" : `Pris #${i + 1}`}
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
          Lägg till beskrivning
        </button>
      </div>

      <div className="divider" />

      <div className="section-label">Lägg till en ring</div>
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
          placeholder="Osålda biljetter — t.ex. 3, 7, 15–20, 45"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUnsold(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Lägg till ring
        </button>
      </div>
      {addError && <div className="error-msg">{addError}</div>}

      {batches.length === 0 ? (
        <div className="no-batches-state">Inga ringar ännu — lägg till en ovan för att komma igång.</div>
      ) : (
        <>
          <div className="stats-bar">
            {[
              { val: batches.length, label: `Ring${batches.length !== 1 ? "er" : ""}` },
              { val: totalSold, label: "Sålda" },
              { val: totalUnsold, label: "Osålda" },
              { val: batches.length * 100, label: "Totalt" },
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
              return (
                <div className="batch-card" key={b.letter}>
                  <div className="batch-card-header">
                    <div className="batch-id">
                      <div className="batch-letter-badge">{b.letter}</div>
                      <div className="batch-meta">
                        <div><strong>{soldList.length}</strong> sålda</div>
                        <div><strong>{unsoldSet.size}</strong> osålda</div>
                      </div>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleRemove(b.letter)}>Ta bort</button>
                  </div>
                  <span className="unsold-label">Osålda lotter</span>
                  <input
                    className="input-text-sm"
                    value={b.unsoldRaw}
                    placeholder="t.ex. 3, 15–20, 45"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleUnsoldChange(b.letter, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="divider" />

      <div className="section-label">Dra vinnarlotter</div>
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
          Dra {drawCount} vinnare{drawCount !== 1 ? "" : ""}
        </button>
      </div>

      {batches.length > 0 && totalSold === 0 && (
        <p className="hint">Alla lotter verkar osålda — redigera varje ring för att markera vilka som sålts.</p>
      )}

      {winners && winners.length > 0 && (
        <div className="results-wrap">
          <div className="results-header">
            <div className="results-title">
              Vinnare <span className="results-badge">{winners.length}</span>
            </div>
            <div className="results-actions">
              <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Jämn fördelning över ringarna</span>
              {winners && winners.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => generateWinnersPDF(winners, new Date().toISOString())}
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  ⬇️ PDF
                </button>
              )}
            </div>
          </div>
          <div className="results-body">
            {winners.map((w, i) => (
              <div
                className={`winner-row ${publishedIndices.has(i) ? "published" : ""}`}
                key={i}
                onClick={() => handlePublishRow(i)}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
              >
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#16A34A" strokeWidth="1.5" />
                  <path d="M8 5v3.5l2 2" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Klicka på varje vinnarerad för att publicera den. Publicerade rader är markerade i grönt.
                {publishedIndices.size > 0 && ` (${publishedIndices.size} av ${winners.length} publicerade)`}
              </div>
            </div>
          </div>
        </div>
      )}

      {winners && winners.length === 0 && (
        <p className="hint" style={{ color: "var(--danger)" }}>
          Inte tillräckligt många sålda biljetter för att uppfylla det dragantalet.
        </p>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const App: FC = () => {
  const [hash] = useHash();
  const [publishedData, setPublishedData] = useState<PublishedData | null | undefined>(undefined);
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if auth is required and if user is already logged in
    const checkAuth = async () => {
      const required = await checkAuthRequired();
      setAuthRequired(required);
      
      if (required) {
        // Check if user has a valid session token
        const token = localStorage.getItem("rosslotten-auth-token");
        if (token) {
          // Assume token is valid if it exists (in production, you'd validate it)
          setIsAuthenticated(true);
        }
      } else {
        // No auth required, user is automatically "authenticated"
        setIsAuthenticated(true);
      }
    };

    checkAuth();
    loadPublished().then(setPublishedData);
  }, []);

  const page: "admin" | "results" | "broadcast" = 
    hash === "#results" ? "results" : 
    hash === "#broadcast" ? "broadcast" : 
    "admin";

  // If auth is still loading, show nothing
  if (authRequired === null) {
    return <style>{STYLE}</style>;
  }

  // If trying to access admin and auth is required but not authenticated, show login
  if (page === "admin" && authRequired && !isAuthenticated) {
    return (
      <>
        <style>{STYLE}</style>
        <LoginPage
          onLoginSuccess={() => setIsAuthenticated(true)}
          isLoading={false}
        />
      </>
    );
  }

  const handleUnpublish = async () => {
    await clearPublished();
    setPublishedData(null);
  };

  return (
    <>
      <style>{STYLE}</style>
      {page === "admin" && (
        <TopNav 
          page={page} 
          hasPublished={!!publishedData} 
          onUnpublish={handleUnpublish}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {page === "results" ? (
        <PublicPage />
      ) : page === "broadcast" ? (
        <BroadcastPage />
      ) : (
        <AdminPage
          publishedData={publishedData}
          onPublish={(d) => setPublishedData(d)}
          onClearPublished={() => setPublishedData(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          requiresCurrentPassword={authRequired}
        />
      )}
    </>
  );
};

export default App;