import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import styles from "./Dashboard.module.css";
import { fetchThumbnail } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [extensions, setExtensions] = useState([]);
  const [selectedExt, setSelectedExt] = useState(null);
  const [thumbnails, setThumbnails] = useState({});

  useEffect(() => {
    api.get("me/").then(res => setUser(res.data)).catch(console.error);
    fetchFiles();
  }, []);

  useEffect(() => {
    api.get("my-file-extensions/")
      .then(res => setExtensions(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchFiles(query, selectedExt), 300);
    return () => clearTimeout(id);
  }, [query, selectedExt]);

  const fetchFiles = (q = "", ext = null) => {
    const params = {};
    if (q) params.search = q;
    if (ext) params.ext = ext;
  
    api.get("my-files/", { params })
      .then(res => setFiles(res.data))
      .catch(console.error);
  };

  useEffect(() => {
  files.forEach((file) => {
    if (
      file.content_type?.startsWith("image/") &&
      !thumbnails[file.id]
    ) {
      api.get(`file/${file.id}/download/`, { responseType: "blob" })
        .then((res) => fetchThumbnail(res.data))
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setThumbnails((prev) => ({ ...prev, [file.id]: url }));
        })
        .catch((err) => {
          console.error("Thumbnail error:", err);
        });
    }
  });
}, [files, thumbnails]);

  useEffect(() => {
    const id = setTimeout(() => fetchFiles(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const flashMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
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

  const handleUpload = () => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
  
    api.post("upload/", formData)
      .then(() => {
         // 👇 ДОБАВЛЕННЫЙ КОД: вызов микросервиса
      const countForm = new FormData();
      countForm.append("file", file);

      fetch("http://localhost:8001/count-words/", {
        method: "POST",
        body: countForm,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.size_bytes !== undefined) {
            flashMessage(`Uploaded! File size: ${data.size_kb} KB`);
          } else {
            flashMessage(`Uploaded with unnoun size`);
        }
})

      // 👇 Очистка и обновление
      setFile(null);
      fetchFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    })
    .catch((err) => {
      let reason = "Upload failed";
      if (err.response?.data?.detail) {
        reason = err.response.data.detail;
      }
      flashMessage(reason);
    });
  };
  

  const handlePreview = (id) => {
    api.get(`file/${id}/raw/`)
      .then(res => {
        setPreview({
          id,
          filename: res.data.filename,
          contentType: res.data.content_type,
          base64: res.data.base64
        });
      })
      .catch(() => {
        setPreview({ filename: "Error", content: "[Preview not available]" });
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    window.location.href = "/";
  };

  const handleDownload = (file) => {
    api.get(`file/${file.id}/download/`, { responseType: "blob" })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", file.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => alert("Failed to download file."));
  };

  const handleDelete = (file) => {
    if (window.confirm(`Delete file "${file.filename}"?`)) {
      api.delete(`file/${file.id}/`)
        .then(() => {
          setPreview(null);
          fetchFiles();
        })
        .catch(() => alert("Failed to delete file."));
    }
  };

  const toggleMenu = () => {
    if (!menuOpen) {
      api.get("profile/").then(res => {
        setProfile(res.data);
        setMenuOpen(true);
      }).catch(console.error);
    } else {
      setMenuOpen(false);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        {user && (
          <div
            className={`${styles["user-menu"]} ${menuOpen ? styles.open : ""}`}
            onClick={toggleMenu}
          >
            {user.username}
            {menuOpen && profile && (
              <div className={styles.dropdown}>
                <div style={{ padding: "10px", textAlign: "left" }}>
                  <p><strong>Username:</strong> {profile.username}</p>
                  <p><strong>Full name:</strong> {profile.full_name || "—"}</p>
                  <p><strong>Email:</strong> {profile.email || "—"}</p>
                  <p style={{ fontSize: "0.85em", color: "#888" }}>
                    Joined: {new Date(profile.date_joined).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.container}>
        <h2>Dashboard</h2>

        <section className={styles.uploadMenu}>
          <h3>Upload File</h3>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={!file}
            style={{
              minWidth: 120,
              padding: "10px 18px",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              background: "#007bff",
              color: "#fff",
              cursor: file ? "pointer" : "not-allowed",
              opacity: file ? 1 : 0.5,
            }}
          >
            Upload
          </button>
        </section>

        {message && (
            <p
              style={{
              textAlign: "center",
              marginTop: 12,
              color: "#28a745", // ярко-зелёный
              fontWeight: "bold",
              }}
            >
            {message}
          </p>
)}

        {extensions.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "16px",
            padding: "8px 0"
          }}>
            <strong style={{ marginRight: "8px" }}>Filter by extension:</strong>
            {extensions.map(ext => (
              <button
                key={ext}
                onClick={() => setSelectedExt(selectedExt === ext ? null : ext)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.8em",
                  borderRadius: "4px",
                  border: selectedExt === ext ? "1px solid #007bff" : "1px solid #ccc",
                  background: selectedExt === ext ? "#007bff" : "#f0f0f0",
                  color: selectedExt === ext ? "#fff" : "#000",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  lineHeight: "1",
                  minWidth: "unset",
                  maxWidth: "unset",
                  width: "auto"
                }}
              >
                .{ext}
            </button>
            ))}
          </div>
        )}



        <section style={{ marginTop: "30px" }}>
          <h3>My Files</h3>
          <div className={styles.searchBar}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                ✕
              </button>
            )}
          </div>
          {files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            <div className={styles["file-list"]}>
              {files.filter(f => {
                if (!selectedExt) return true;
                return f.filename.toLowerCase().endsWith(`.${selectedExt}`);
              }).map(f => (
                <div
        key={f.id}
        className={styles["file-card"]}
        onClick={() => handlePreview(f.id)}
      >
        {/* 👇 превью, если есть */}
        {thumbnails[f.id] && (
          <img
            src={thumbnails[f.id]}
            alt="preview"
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
        )}
        <strong>{f.filename}</strong>
        <div className={styles["file-type"]}>{f.content_type}</div>
        <div className={styles["file-date"]}>
        {new Date(f.uploaded_at).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
)}
</section>

        {preview && (
          <section className={styles["preview-section"]}>
            <h3>Preview: {preview.filename}</h3>
            {preview.contentType.startsWith("text/") ? (
              <pre className={styles["preview-content"]}>
                {atob(preview.base64)}
              </pre>
            ) : preview.contentType.startsWith("image/") ? (
              <img
                className={styles["preview-content"]}
                src={`data:${preview.contentType};base64,${preview.base64}`}
                alt="preview"
              />
            ) : preview.contentType === "application/pdf" ? (
              <iframe
                className={styles["preview-content"]}
                src={`data:${preview.contentType};base64,${preview.base64}`}
                title="PDF preview"
                height="400px"
                style={{ border: "1px solid #ccc" }}
              />
            ) : (
              <p>Preview not supported for this file type.</p>
            )}
            <div className={styles["button-group"]}>
              <button onClick={() => handleDownload(preview)}>Download</button>
              <button onClick={() => handleDelete(preview)} className={styles.danger}>Delete</button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
