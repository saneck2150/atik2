import React, { useState, useRef } from "react";
import api from "../api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ text: "", type: "" });
  const fileInputRef = useRef(null);
  const STATUS_TIMEOUT = 3000;

  const resetInput = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const flashStatus = (text, type) => {
    setStatus({ text, type });
    setTimeout(() => setStatus({ text: "", type: "" }), STATUS_TIMEOUT);
  };

const countWords = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:8001/count-words/", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Word count failed");

    const data = await res.json();
    alert(`✅ Words in file: ${data.word_count}`);
  } catch (err) {
    console.error("Error:", err);
    alert("❌ Error counting words");
  }
};

const handleUpload = async () => {
  if (!file) {
    flashStatus("Choose a file first", "error");
    return resetInput();
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    await api.post("upload/", formData);
    await countWords(file);
    flashStatus(`Файл загружен успешно. Слов в файле: ${data.word_count}`, "success");

    // === отправка в микросервис счётчика слов ===
    const countForm = new FormData();
    countForm.append("file", file);

    const response = await fetch("http://localhost:8001/count-words/", {
      method: "POST",
      body: countForm,
    });

    const data = await response.json();
    if (response.ok) {
      flashStatus(`Слов в файле: ${data.word_count}`, "success");
    } else {
      flashStatus(`Ошибка подсчёта слов: ${data.error || "unknown"}`, "error");
    }
  } catch (err) {
    let reason = "Upload failed";
    if (err.response) {
      const data = err.response.data;
      if (typeof data === "string") reason = data;
      else if (data.detail) reason = data.detail;
      else if (data.message) reason = data.message;
      else if (data.error) reason = data.error;
    } else if (err.message) {
      reason = err.message;
    }
    flashStatus(reason, "error");
  } finally {
    resetInput();
  }
};

  return (
    <>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Upload File</h2>

        <div style={styles.row}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files[0] ?? null)}
            style={styles.input}
          />

          <button onClick={handleUpload} style={styles.button}>
            Upload
          </button>
        </div>
      </div>

      {/* статус-сообщение — ВНЕ wrapper'а */}
      {status.text && (
        <p
          style={{
            ...styles.status,
            color: status.type === "success" ? "#28a745" : "#dc3545",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {status.text}
        </p>
      )}
    </>
  );
}
<p style={{ color: "red" }}>🔥 Это новая версия компонента Upload</p>
const styles = {
  wrapper: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 24,
    borderRadius: 12,
    background: "#e6e9ec",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  title: { margin: 0 },
  row: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    padding: "6px 12px",
  },
  button: {
    minWidth: 120,
    padding: "10px 18px",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    background: "#007bff",
    color: "#fff",
  },
  status: {
    fontWeight: 500,
  },
};
