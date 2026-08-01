import React, { useState } from "react";
import { Lock, Copy, Check, RefreshCw, Sparkles, Tag, AlertCircle } from "lucide-react";

const MODES = [
  { id: "体験談", label: "体験談", desc: "自分のリアルな経験で共感を集める" },
  { id: "ノウハウ", label: "ノウハウ", desc: "具体的な手順・テンプレを渡す" },
  { id: "サービス誘導", label: "サービス誘導", desc: "自然に紹介したいサービスへ橋渡し" },
];

const CLAUDE_MODEL = "claude-sonnet-5";

async function callClaude(apiKey, prompt, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `API request failed with status ${res.status}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

function stripFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

export default function PaidNoteGenerator({ apiKey, onResetApiKey }) {
  const [persona, setPersona] = useState("");
  const [theme, setTheme] = useState("");
  const [mode, setMode] = useState("体験談");
  const [price, setPrice] = useState(500);
  const [includeCTA, setIncludeCTA] = useState(false);
  const [ctaText, setCtaText] = useState("");

  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [freePart, setFreePart] = useState("");
  const [tags, setTags] = useState([]);
  const [paidPart, setPaidPart] = useState("");

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingPaid, setLoadingPaid] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const hasResult = titles.length > 0;

  async function generateMain() {
    if (!theme.trim()) {
      setError("まず、書きたいテーマや伝えたいことを入力してください。");
      return;
    }
    setError("");
    setLoadingMain(true);
    setPaidPart("");
    setRevealed(false);
    try {
      const ctaNote =
        includeCTA && ctaText.trim()
          ? `note本文の締めくくりに、次のサービス・リンクへ自然に触れる一文を、無料部分の最後に軽く入れてください(宣伝色を強く出しすぎない):${ctaText}`
          : "特定のサービスへの誘導は不要です。";

      const personaLine = persona.trim()
        ? `【書き手の立場】${persona}`
        : "【書き手の立場】特に指定なし。テーマから自然に推測される一人称視点で書く";

      const prompt = `あなたは、これから指定する立場の人物になりきって、note(有料記事プラットフォーム)に投稿する記事の下書きを書きます。
以下の条件でJSON形式のみを出力してください。前置き・説明・マークダウンのコードフェンスは一切不要です。

${personaLine}
【テーマ】${theme}
【モード】${mode}(体験談=自分のリアルな経験で共感を集める/ノウハウ=具体的な手順やテンプレを渡す/サービス誘導=自然に紹介したいサービスへ橋渡し)
【価格】${price}円(初心者がまず1件売るための入門価格。分量はこの価格に見合う軽さでよい)
【文体】指定された立場の人物としての一人称。専門用語に頼らず、リアルな実感を大事にする。話し言葉に近い親しみやすいトーン。
${ctaNote}

次のJSON構造で出力してください(キー名を厳守):
{
  "titles": ["タイトル案1", "タイトル案2", "タイトル案3"],
  "free_part": "無料部分の本文(400字程度)。読者の悩みに共感し、有料部分を読みたくなる引きで終わる",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
}`;

      const raw = await callClaude(apiKey, prompt, 1000);
      const parsed = JSON.parse(stripFences(raw));
      setTitles(parsed.titles || []);
      setSelectedTitle((parsed.titles && parsed.titles[0]) || "");
      setFreePart(parsed.free_part || "");
      setTags(parsed.tags || []);
    } catch (e) {
      setError(`生成に失敗しました: ${e.message}`);
    } finally {
      setLoadingMain(false);
    }
  }

  async function generatePaid() {
    if (!selectedTitle || !freePart) return;
    setLoadingPaid(true);
    setError("");
    try {
      const personaLine = persona.trim()
        ? `あなたは「${persona}」という立場の人物です。`
        : "あなたは、この記事のテーマに合った一人称の書き手です。";

      const prompt = `${personaLine}以下のnote記事の続き(有料部分)を書いてください。
前置きや説明は不要です。本文のみを出力してください。

【タイトル】${selectedTitle}
【ここまでの無料部分】
${freePart}

【モード】${mode}
【価格】${price}円

この続きとして、有料部分(700〜900字程度)を書いてください。無料部分の流れを受けて、具体的なノウハウ・体験の核心・読者が本当に知りたい部分を、出し惜しみせず書いてください。最後に軽くまとめの一言を添えてください。`;

      const raw = await callClaude(apiKey, prompt, 1000);
      setPaidPart(raw.trim());
      setRevealed(true);
    } catch (e) {
      setError(`有料部分の生成に失敗しました: ${e.message}`);
    } finally {
      setLoadingPaid(false);
    }
  }

  function copyAll() {
    const tagLine = tags.map((t) => `#${t}`).join(" ");
    const full = `${selectedTitle}\n\n${freePart}\n\n▼ここから先が有料エリア(noteエディタで「ここから先は有料」を設定)\n\n${paidPart}\n\n${tagLine}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const charCount = freePart.length + paidPart.length;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #C9A22755; }
        textarea::placeholder { color: #8A8B85; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; opacity: 0.5; }
      `}</style>

      <div style={styles.shell}>
        {/* 左パネル */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.recordTab}>下書き設定</div>
            <h1 style={styles.panelTitle}>有料note ジェネレーター</h1>
            <p style={styles.panelSub}>立場とテーマを渡すと、有料noteの下書き一式を作ります</p>
            {onResetApiKey && (
              <button type="button" style={styles.apiKeyResetLink} onClick={onResetApiKey}>
                APIキーを変更する
              </button>
            )}
          </div>

          <label style={styles.label}>書き手の立場・プロフィール(任意)</label>
          <input
            type="text"
            style={styles.textInput}
            placeholder="例)介護職6年目 / 40歳から副業を始めた会社員 / 未経験からエンジニア転職した人"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          />

          <label style={styles.label}>テーマ・伝えたいこと</label>
          <textarea
            style={styles.textarea}
            placeholder="例)40歳からAI副業を始めて感じたこと / 未経験で介護に入って驚いたこと3つ"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={4}
          />

          <label style={styles.label}>モード</label>
          <div style={styles.modeRow}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  ...styles.modeBtn,
                  ...(mode === m.id ? styles.modeBtnActive : {}),
                }}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={styles.row2}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>価格</label>
              <div style={styles.priceInputWrap}>
                <span style={styles.yen}>¥</span>
                <input
                  type="number"
                  style={styles.priceInput}
                  value={price}
                  min={100}
                  step={100}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>誘導したいサービス</label>
              <button
                onClick={() => setIncludeCTA((v) => !v)}
                style={{
                  ...styles.toggle,
                  ...(includeCTA ? styles.toggleOn : {}),
                }}
              >
                <span style={styles.toggleDot(includeCTA)} />
                {includeCTA ? "入れる" : "入れない"}
              </button>
            </div>
          </div>

          {includeCTA && (
            <input
              type="text"
              style={styles.textInput}
              placeholder="例)レバウェル介護 / 楽天ROOMの掃除グッズ / 自分のLINE公式アカウント"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
            />
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <button style={styles.primaryBtn} onClick={generateMain} disabled={loadingMain}>
            {loadingMain ? (
              <>
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                下書きを作成中…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                下書きを生成する
              </>
            )}
          </button>

          <p style={styles.disclaimer}>
            ここで作るのは下書きです。noteへの投稿・有料設定は、ご自身でnoteエディタから行ってください。
          </p>
        </div>

        {/* 右プレビュー */}
        <div style={styles.previewWrap}>
          {!hasResult && !loadingMain && (
            <div style={styles.emptyState}>
              <div style={styles.emptyBadge}>¥{price}</div>
              <p style={styles.emptyText}>左のフォームにテーマを入れて、生成してください</p>
            </div>
          )}

          {hasResult && (
            <div style={styles.card}>
              <div style={styles.titleTabs}>
                {titles.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTitle(t)}
                    style={{
                      ...styles.titleTab,
                      ...(selectedTitle === t ? styles.titleTabActive : {}),
                    }}
                  >
                    案{i + 1}
                  </button>
                ))}
              </div>

              <h2 style={styles.articleTitle}>{selectedTitle}</h2>

              <div style={styles.freeText}>
                {freePart.split("\n").map((line, i) => (
                  <p key={i} style={styles.paragraph}>
                    {line}
                  </p>
                ))}
              </div>

              {!paidPart && (
                <button style={styles.genPaidBtn} onClick={generatePaid} disabled={loadingPaid}>
                  {loadingPaid ? (
                    <>
                      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                      有料部分を作成中…
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      有料部分を生成する
                    </>
                  )}
                </button>
              )}

              {paidPart && (
                <div style={styles.paywallZone}>
                  <div style={styles.fadeLine} />
                  <div style={{ ...styles.paidBody, filter: revealed ? "none" : "blur(4px)" }}>
                    {paidPart.split("\n").map((line, i) => (
                      <p key={i} style={styles.paragraph}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {!revealed && (
                    <div style={styles.lockOverlay}>
                      <div style={styles.priceStamp}>¥{price}</div>
                      <div style={styles.lockText}>ここから先は有料</div>
                      <button style={styles.revealBtn} onClick={() => setRevealed(true)}>
                        下書きを確認する
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tags.length > 0 && (
                <div style={styles.tagRow}>
                  <Tag size={13} style={{ opacity: 0.6 }} />
                  {tags.map((t, i) => (
                    <span key={i} style={styles.tagChip}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div style={styles.footerRow}>
                <span style={styles.charCount}>文字数 {charCount}字</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.ghostBtn} onClick={generateMain} disabled={loadingMain}>
                    <RefreshCw size={13} />
                    作り直す
                  </button>
                  <button
                    style={styles.copyBtn}
                    onClick={copyAll}
                    disabled={!paidPart || !revealed}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "コピーしました" : "全文コピー"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    background: "#EEEBE2",
    fontFamily: "'Zen Kaku Gothic New', sans-serif",
    color: "#20211D",
    padding: "clamp(12px, 3vw, 28px)",
  },
  shell: {
    display: "flex",
    gap: 20,
    maxWidth: 1040,
    margin: "0 auto",
    flexWrap: "wrap",
  },
  panel: {
    flex: "1 1 300px",
    minWidth: 280,
    background: "#1B2A2E",
    borderRadius: 14,
    padding: "22px 20px",
    color: "#EDEDE3",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    height: "fit-content",
  },
  panelHeader: { marginBottom: 4 },
  recordTab: {
    display: "inline-block",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "#C9A227",
    border: "1px solid #C9A22766",
    borderRadius: 999,
    padding: "3px 10px",
    marginBottom: 10,
  },
  panelTitle: {
    fontFamily: "'Shippori Mincho', serif",
    fontSize: 22,
    margin: "0 0 6px",
    color: "#F5F1E6",
  },
  panelSub: { fontSize: 12.5, color: "#B7BCB0", margin: 0, lineHeight: 1.6 },
  apiKeyResetLink: {
    background: "transparent",
    border: "none",
    color: "#C9A227",
    fontSize: 11,
    fontFamily: "inherit",
    padding: 0,
    marginTop: 8,
    textDecoration: "underline",
    cursor: "pointer",
  },
  label: {
    fontSize: 11.5,
    color: "#9FB0A8",
    letterSpacing: "0.04em",
    marginTop: 6,
  },
  textInput: {
    background: "#243B3F",
    border: "1px solid #3A5054",
    borderRadius: 10,
    color: "#F0EEE3",
    padding: "10px 12px",
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
  },
  textarea: {
    background: "#243B3F",
    border: "1px solid #3A5054",
    borderRadius: 10,
    color: "#F0EEE3",
    padding: "10px 12px",
    fontSize: 13.5,
    fontFamily: "inherit",
    resize: "vertical",
    lineHeight: 1.6,
    outline: "none",
  },
  modeRow: { display: "flex", gap: 6 },
  modeBtn: {
    flex: 1,
    background: "transparent",
    border: "1px solid #3A5054",
    color: "#C7CDC4",
    borderRadius: 8,
    padding: "8px 6px",
    fontSize: 12.5,
    fontFamily: "inherit",
  },
  modeBtnActive: {
    background: "#8C3B4B",
    borderColor: "#8C3B4B",
    color: "#FDF3EF",
    fontWeight: 700,
  },
  row2: { display: "flex", gap: 12, marginTop: 4 },
  priceInputWrap: {
    display: "flex",
    alignItems: "center",
    background: "#243B3F",
    border: "1px solid #3A5054",
    borderRadius: 10,
    padding: "4px 10px",
    marginTop: 4,
  },
  yen: { color: "#C9A227", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, marginRight: 4 },
  priceInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#F0EEE3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    width: "100%",
    padding: "6px 0",
  },
  toggle: {
    marginTop: 4,
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#243B3F",
    border: "1px solid #3A5054",
    borderRadius: 10,
    padding: "9px 12px",
    color: "#B7BCB0",
    fontSize: 12.5,
    fontFamily: "inherit",
  },
  toggleOn: { color: "#F0EEE3", borderColor: "#C9A227" },
  toggleDot: (on) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: on ? "#C9A227" : "#5A6863",
  }),
  errorBox: {
    display: "flex",
    gap: 6,
    background: "#4A2430",
    border: "1px solid #8C3B4B",
    color: "#F3D6DA",
    fontSize: 12,
    borderRadius: 8,
    padding: "8px 10px",
    lineHeight: 1.5,
  },
  primaryBtn: {
    marginTop: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#C9A227",
    color: "#1B2A2E",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "inherit",
  },
  disclaimer: { fontSize: 10.5, color: "#7C8880", lineHeight: 1.6, marginTop: 2 },

  previewWrap: { flex: "1 1 420px", minWidth: 300 },
  emptyState: {
    height: "100%",
    minHeight: 320,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#FBF9F3",
    border: "1px dashed #C8C3B4",
    borderRadius: 14,
    gap: 14,
  },
  emptyBadge: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "2px solid #C9A227",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#8C3B4B",
    fontWeight: 700,
  },
  emptyText: { color: "#8A8B85", fontSize: 13 },

  card: {
    background: "#FBF9F3",
    borderRadius: 14,
    padding: "26px 26px 20px",
    border: "1px solid #E3DFD1",
  },
  titleTabs: { display: "flex", gap: 6, marginBottom: 14 },
  titleTab: {
    fontSize: 11.5,
    fontFamily: "'JetBrains Mono', monospace",
    background: "transparent",
    border: "1px solid #D8D2C0",
    borderRadius: 999,
    padding: "4px 11px",
    color: "#8A8B85",
  },
  titleTabActive: { background: "#8C3B4B", borderColor: "#8C3B4B", color: "#FBF9F3" },
  articleTitle: {
    fontFamily: "'Shippori Mincho', serif",
    fontSize: "clamp(19px, 3vw, 24px)",
    lineHeight: 1.5,
    margin: "0 0 16px",
    color: "#20211D",
  },
  freeText: {},
  paragraph: { fontSize: 14.5, lineHeight: 1.9, margin: "0 0 10px", color: "#33342E" },
  genPaidBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#20211D",
    color: "#F5F1E6",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12.5,
    fontFamily: "inherit",
    marginTop: 6,
  },
  paywallZone: { position: "relative", marginTop: 6 },
  fadeLine: {
    height: 26,
    background: "linear-gradient(to bottom, transparent, #FBF9F3)",
    marginTop: -26,
    position: "relative",
    zIndex: 2,
  },
  paidBody: { position: "relative" },
  lockOverlay: {
    position: "absolute",
    inset: 0,
    top: -10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "linear-gradient(to bottom, #FBF9F3AA, #FBF9F3F5 40%)",
  },
  priceStamp: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    border: "2px solid #8C3B4B",
    color: "#8C3B4B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    transform: "rotate(-8deg)",
  },
  lockText: { fontSize: 12.5, color: "#5A5B54" },
  revealBtn: {
    background: "#8C3B4B",
    color: "#FDF3EF",
    border: "none",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 12.5,
    fontWeight: 700,
    fontFamily: "inherit",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 18 },
  tagChip: {
    fontSize: 11.5,
    background: "#EFE9D8",
    color: "#5A5B44",
    borderRadius: 999,
    padding: "3px 10px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 14,
    borderTop: "1px solid #E3DFD1",
  },
  charCount: { fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#9A9B90" },
  ghostBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "transparent",
    border: "1px solid #D8D2C0",
    borderRadius: 8,
    padding: "7px 11px",
    fontSize: 12,
    color: "#5A5B54",
    fontFamily: "inherit",
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#20211D",
    color: "#F5F1E6",
    border: "none",
    borderRadius: 8,
    padding: "7px 13px",
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: 600,
  },
};
