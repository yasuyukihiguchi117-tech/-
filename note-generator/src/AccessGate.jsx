import React, { useState } from "react";

const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || "";
const STORAGE_ACCESS = "note-gen:access-granted";
const STORAGE_API_KEY = "note-gen:anthropic-api-key";

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_API_KEY) || "";
}

export function clearStoredApiKey() {
  localStorage.removeItem(STORAGE_API_KEY);
}

function GateScreen({ title, description, inputType = "text", placeholder, error, onSubmit }) {
  const [value, setValue] = useState("");

  return (
    <div style={styles.wrap}>
      <form
        style={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
        }}
      >
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.desc}>{description}</p>
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button}>
          進む
        </button>
      </form>
    </div>
  );
}

export default function AccessGate({ children }) {
  const [granted, setGranted] = useState(() => localStorage.getItem(STORAGE_ACCESS) === "1");
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [codeError, setCodeError] = useState("");

  if (!granted) {
    return (
      <GateScreen
        title="購入者限定コンテンツ"
        description="noteの有料部分に記載されているアクセスコードを入力してください。"
        placeholder="アクセスコード"
        error={codeError}
        onSubmit={(value) => {
          if (!ACCESS_CODE) {
            setCodeError("アクセスコードが設定されていません。運営にお問い合わせください。");
            return;
          }
          if (value.trim() === ACCESS_CODE) {
            localStorage.setItem(STORAGE_ACCESS, "1");
            setCodeError("");
            setGranted(true);
          } else {
            setCodeError("コードが正しくありません。");
          }
        }}
      />
    );
  }

  if (!apiKey) {
    return (
      <GateScreen
        title="Claude APIキーを入力"
        description="ご自身のAnthropic APIキーを入力してください。このキーはお使いのブラウザ内にのみ保存され、外部のサーバーには送信されません。"
        inputType="password"
        placeholder="sk-ant-..."
        onSubmit={(value) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          localStorage.setItem(STORAGE_API_KEY, trimmed);
          setApiKey(trimmed);
        }}
      />
    );
  }

  return children({
    apiKey,
    resetApiKey: () => {
      clearStoredApiKey();
      setApiKey("");
    },
  });
}

const styles = {
  wrap: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#EEEBE2",
    fontFamily: "'Zen Kaku Gothic New', sans-serif",
    padding: 20,
  },
  card: {
    background: "#1B2A2E",
    borderRadius: 14,
    padding: "28px 26px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { color: "#F5F1E6", fontSize: 18, margin: 0, fontFamily: "'Shippori Mincho', serif" },
  desc: { color: "#B7BCB0", fontSize: 12.5, lineHeight: 1.7, margin: 0 },
  input: {
    background: "#243B3F",
    border: "1px solid #3A5054",
    borderRadius: 10,
    color: "#F0EEE3",
    padding: "10px 12px",
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
  },
  error: { color: "#F3D6DA", fontSize: 12, margin: 0 },
  button: {
    background: "#C9A227",
    color: "#1B2A2E",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "inherit",
    cursor: "pointer",
  },
};
