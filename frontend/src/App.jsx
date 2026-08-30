import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("trustshare_token")
  );

  const [user, setUser] = useState(null);

  const [page, setPage] = useState("dashboard");

  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);

  const [recipientEmail, setRecipientEmail] = useState("");

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [authMode, setAuthMode] = useState("login");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // =========================
  // LOAD USER
  // =========================

  useEffect(() => {
    if (token) {
      getCurrentUser();
      loadFiles();
      loadSharedFiles();
    }
  }, [token]);

  // =========================
  // API HELPERS
  // =========================

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // =========================
  // GET CURRENT USER
  // =========================

  async function getCurrentUser() {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();

      setUser(data);
    } catch (err) {
      setError("Cannot connect to backend");
    }
  }

  // =========================
  // LOGIN
  // =========================

  async function login(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password");
        return;
      }

      localStorage.setItem(
        "trustshare_token",
        data.access_token
      );

      setToken(data.access_token);

      setLoginData({
        email: "",
        password: "",
      });

      setMessage("Welcome back to TrustShare");
    } catch (err) {
      setError("Cannot connect to backend");
    }
  }

  // =========================
  // REGISTER
  // =========================

  async function register(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed");
        return;
      }

      setMessage("Account created. You can now sign in.");

      setRegisterData({
        username: "",
        email: "",
        password: "",
      });

      setAuthMode("login");
    } catch (err) {
      setError("Cannot connect to backend");
    }
  }

  // =========================
  // LOGOUT
  // =========================

  function logout() {
    localStorage.removeItem("trustshare_token");

    setToken(null);
    setUser(null);
    setFiles([]);
    setSharedFiles([]);
    setPage("dashboard");
  }

  // =========================
  // LOAD MY FILES
  // =========================

  async function loadFiles() {
    try {
      const response = await fetch(`${API_URL}/files`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // LOAD SHARED FILES
  // =========================

  async function loadSharedFiles() {
    try {
      const response = await fetch(
        `${API_URL}/shared-files`,
        {
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setSharedFiles(data.files || []);
    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // UPLOAD
  // =========================

  async function uploadFile(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();

    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Upload failed");
        setUploading(false);
        return;
      }

      setMessage(
        `${data.filename} uploaded successfully`
      );

      await loadFiles();

      setPage("files");
    } catch (err) {
      setError("Upload failed. Check your backend.");
    }

    setUploading(false);

    e.target.value = "";
  }

  // =========================
  // DOWNLOAD
  // =========================

  async function downloadFile(filename) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/download/${encodeURIComponent(filename)}`,
        {
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        setError(
          data.detail || "Unable to download file"
        );

        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Download failed");
    }
  }

  // =========================
  // DELETE
  // =========================

  async function deleteFile(filename) {
    const confirmed = window.confirm(
      `Delete "${filename}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/delete/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Unable to delete file"
        );

        return;
      }

      setMessage(`${filename} deleted`);

      await loadFiles();
    } catch (err) {
      setError("Delete failed");
    }
  }

  // =========================
  // SHARE FILE
  // =========================

  async function shareFile(e) {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!recipientEmail) {
      setError("Please enter recipient email");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: selectedFile,
          recipient_email: recipientEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Sharing failed");
        return;
      }

      setMessage(
        `${selectedFile} shared with ${recipientEmail}`
      );

      setRecipientEmail("");
      setSelectedFile(null);

      await loadSharedFiles();

      setPage("shared");
    } catch (err) {
      setError("Cannot connect to backend");
    }
  }

  // =========================
  // AUTH SCREEN
  // =========================

  if (!token) {
    return (
      <>
        <style>{styles}</style>

        <div className="auth-page">

          <div className="auth-orbit orbit-one"></div>
          <div className="auth-orbit orbit-two"></div>

          <div className="auth-left">

            <div className="brand-mark">
              <div className="brand-shield">✓</div>

              <div>
                <div className="brand-name">
                  TrustShare
                </div>

                <div className="brand-tagline">
                  Share with confidence.
                </div>
              </div>
            </div>

            <div className="hero-copy">

              <div className="eyebrow">
                <span></span>
                PRIVATE FILE EXCHANGE
              </div>

              <h1>
                Your files.
                <br />

                <span>Your trust.</span>
              </h1>

              <p>
                A secure space to store, share and
                access the files that matter.
              </p>

              <div className="trust-pills">

                <div>
                  <span>◈</span>
                  Private
                </div>

                <div>
                  <span>✓</span>
                  Protected
                </div>

                <div>
                  <span>↗</span>
                  Simple
                </div>

              </div>

            </div>

            <div className="auth-footer">
              TRUSTSHARE • YOUR DIGITAL VAULT
            </div>

          </div>

          <div className="auth-right">

            <div className="auth-card">

              <div className="mini-trust">

                <div className="mini-ring">
                  <span>✓</span>
                </div>

                <div>
                  <strong>Trust Layer</strong>
                  <small>
                    Your private workspace
                  </small>
                </div>

              </div>

              {authMode === "login" ? (
                <>
                  <div className="form-heading">
                    <h2>Welcome back</h2>

                    <p>
                      Enter your details to continue.
                    </p>
                  </div>

                  <form onSubmit={login}>

                    <label>Email</label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          email: e.target.value,
                        })
                      }
                      required
                    />

                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                      required
                    />

                    {error && (
                      <div className="error-box">
                        {error}
                      </div>
                    )}

                    {message && (
                      <div className="success-box">
                        {message}
                      </div>
                    )}

                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Enter TrustShare
                      <span>→</span>
                    </button>

                  </form>

                  <div className="auth-switch">
                    Don't have an account?

                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setError("");
                        setMessage("");
                      }}
                    >
                      Create one
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-heading">
                    <h2>Create your vault</h2>

                    <p>
                      Start sharing with confidence.
                    </p>
                  </div>

                  <form onSubmit={register}>

                    <label>Username</label>

                    <input
                      type="text"
                      placeholder="Your name"
                      value={registerData.username}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          username: e.target.value,
                        })
                      }
                      required
                    />

                    <label>Email</label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      required
                    />

                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      required
                    />

                    {error && (
                      <div className="error-box">
                        {error}
                      </div>
                    )}

                    {message && (
                      <div className="success-box">
                        {message}
                      </div>
                    )}

                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Create TrustShare
                      <span>→</span>
                    </button>

                  </form>

                  <div className="auth-switch">
                    Already have an account?

                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setError("");
                        setMessage("");
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}

            </div>

          </div>

        </div>
      </>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <>
      <style>{styles}</style>

      <div className="app-shell">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-shield small">
              ✓
            </div>

            <div>
              <strong>TrustShare</strong>

              <small>
                Secure workspace
              </small>
            </div>

          </div>

          <nav>

            <button
              className={
                page === "dashboard"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("dashboard")}
            >
              <span>⌂</span>
              Overview
            </button>

            <button
              className={
                page === "files"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("files")}
            >
              <span>▣</span>
              My Files
              <b>{files.length}</b>
            </button>

            <button
              className={
                page === "shared"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage("shared")}
            >
              <span>⇄</span>
              Shared With Me
              <b>{sharedFiles.length}</b>
            </button>

          </nav>

          <div className="sidebar-trust">

            <div className="sidebar-trust-ring">
              ✓
            </div>

            <div>
              <strong>Protected</strong>

              <span>
                Your session is secure
              </span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            ↪
            Sign out
          </button>

        </aside>

        {/* MAIN */}

        <main className="main-content">

          <header className="topbar">

            <div>
              <div className="topbar-label">
                TRUSTSHARE / {page.toUpperCase()}
              </div>

              <h1>
                {page === "dashboard" &&
                  "Your trusted space."}

                {page === "files" &&
                  "Your files."}

                {page === "shared" &&
                  "Files shared with you."}

                {page === "share" &&
                  "Share securely."}
              </h1>
            </div>

            <div className="profile">

              <div className="avatar">
                {(
                  user?.email?.[0] || "U"
                ).toUpperCase()}
              </div>

              <div>
                <strong>
                  {user?.email || "User"}
                </strong>

                <span>
                  Verified account
                </span>
              </div>

            </div>

          </header>

          {/* ALERTS */}

          {error && (
            <div className="global-error">
              <span>!</span>
              {error}

              <button
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {message && (
            <div className="global-success">
              <span>✓</span>
              {message}

              <button
                onClick={() => setMessage("")}
              >
                ×
              </button>
            </div>
          )}

          {/* DASHBOARD */}

          {page === "dashboard" && (
            <div className="content">

              <section className="welcome-grid">

                <div className="welcome-card">

                  <div className="welcome-eyebrow">
                    GOOD TO SEE YOU
                  </div>

                  <h2>
                    Welcome to your
                    <span> trusted vault.</span>
                  </h2>

                  <p>
                    Everything you upload stays
                    connected to your account.
                    Share only when you're ready.
                  </p>

                  <label className="upload-button">

                    {uploading
                      ? "Uploading..."
                      : "＋ Upload a file"}

                    <input
                      type="file"
                      onChange={uploadFile}
                      disabled={uploading}
                    />

                  </label>

                </div>

                <div className="trust-card">

                  <div className="trust-ring-large">

                    <div className="ring-inner">
                      <strong>100%</strong>
                      <span>TRUST</span>
                    </div>

                  </div>

                  <div className="trust-card-copy">

                    <span>YOUR SECURITY</span>

                    <h3>
                      Account protected
                    </h3>

                    <p>
                      Authenticated session active.
                    </p>

                  </div>

                </div>

              </section>

              <section className="stats">

                <div className="stat-card">

                  <div className="stat-icon">
                    ▣
                  </div>

                  <div>
                    <span>MY FILES</span>
                    <strong>{files.length}</strong>
                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    ⇄
                  </div>

                  <div>
                    <span>SHARED WITH ME</span>
                    <strong>{sharedFiles.length}</strong>
                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    ✓
                  </div>

                  <div>
                    <span>ACCOUNT</span>
                    <strong>Secure</strong>
                  </div>

                </div>

              </section>

              <section className="section-heading">

                <div>
                  <span>YOUR SPACE</span>
                  <h2>Recent files</h2>
                </div>

                <button
                  onClick={() => setPage("files")}
                >
                  View all →
                </button>

              </section>

              <FileList
                files={files.slice(0, 4)}
                onDownload={downloadFile}
                onDelete={deleteFile}
                onShare={(filename) => {
                  setSelectedFile(filename);
                  setPage("share");
                }}
              />

            </div>
          )}

          {/* MY FILES */}

          {page === "files" && (
            <div className="content">

              <div className="page-action-row">

                <div>
                  <p>
                    Files belonging to your account.
                  </p>
                </div>

                <label className="upload-button compact">

                  ＋ Upload file

                  <input
                    type="file"
                    onChange={uploadFile}
                    disabled={uploading}
                  />

                </label>

              </div>

              <FileList
                files={files}
                onDownload={downloadFile}
                onDelete={deleteFile}
                onShare={(filename) => {
                  setSelectedFile(filename);
                  setPage("share");
                }}
              />

            </div>
          )}

          {/* SHARED */}

          {page === "shared" && (
            <div className="content">

              <div className="shared-banner">

                <div className="shared-symbol">
                  ⇄
                </div>

                <div>
                  <span>
                    TRUST NETWORK
                  </span>

                  <h2>
                    Files shared with you
                  </h2>

                  <p>
                    Files another TrustShare user
                    has shared with your account.
                  </p>
                </div>

              </div>

              <div className="file-grid">

                {sharedFiles.length === 0 ? (
                  <EmptyState
                    icon="⇄"
                    title="Nothing shared yet"
                    text="Files shared with your account will appear here."
                  />
                ) : (
                  sharedFiles.map((filename, index) => (
                    <div
                      className="file-card shared-file"
                      key={`${filename}-${index}`}
                    >

                      <div className="file-top">

                        <div className="pdf-icon">
                          PDF
                        </div>

                        <span className="shared-tag">
                          SHARED
                        </span>

                      </div>

                      <h3 title={filename}>
                        {filename}
                      </h3>

                      <div className="file-meta">
                        <span>
                          Shared with you
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          TrustShare
                        </span>
                      </div>

                      <button
                        className="download-button"
                        onClick={() =>
                          downloadFile(filename)
                        }
                      >
                        Download file
                        <span>↓</span>
                      </button>

                    </div>
                  ))
                )}

              </div>

            </div>
          )}

          {/* SHARE */}

          {page === "share" && (
            <div className="content">

              <div className="share-layout">

                <div className="share-visual">

                  <div className="share-orbit"></div>

                  <div className="share-core">
                    ⇄
                  </div>

                  <div className="share-copy">

                    <span>
                      TRUSTED TRANSFER
                    </span>

                    <h2>
                      Share without
                      <br />
                      losing control.
                    </h2>

                    <p>
                      Choose who receives your
                      file and send it through
                      your TrustShare workspace.
                    </p>

                  </div>

                </div>

                <div className="share-form-card">

                  <div className="form-heading">

                    <span>
                      SECURE SHARE
                    </span>

                    <h2>
                      Send a file
                    </h2>

                    <p>
                      Select a file and enter
                      the recipient's email.
                    </p>

                  </div>

                  <form onSubmit={shareFile}>

                    <label>
                      FILE
                    </label>

                    <select
                      value={selectedFile || ""}
                      onChange={(e) =>
                        setSelectedFile(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Choose a file
                      </option>

                      {files.map((filename) => (
                        <option
                          key={filename}
                          value={filename}
                        >
                          {filename}
                        </option>
                      ))}
                    </select>

                    <label>
                      RECIPIENT EMAIL
                    </label>

                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) =>
                        setRecipientEmail(
                          e.target.value
                        )
                      }
                      required
                    />

                    <div className="secure-note">

                      <span>✓</span>

                      <div>
                        <strong>
                          Protected transfer
                        </strong>

                        <p>
                          Your session verifies
                          every sharing request.
                        </p>
                      </div>

                    </div>

                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Share securely
                      <span>→</span>
                    </button>

                  </form>

                  <button
                    className="back-button"
                    onClick={() => setPage("files")}
                  >
                    ← Back to My Files
                  </button>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>
    </>
  );
}


// =========================
// FILE LIST
// =========================

function FileList({
  files,
  onDownload,
  onDelete,
  onShare,
}) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon="▣"
        title="Your vault is empty"
        text="Upload your first file to start using TrustShare."
      />
    );
  }

  return (
    <div className="file-grid">

      {files.map((filename, index) => (
        <div
          className="file-card"
          key={`${filename}-${index}`}
        >

          <div className="file-top">

            <div className="pdf-icon">
              PDF
            </div>

            <div className="file-menu">
              SECURE
            </div>

          </div>

          <h3 title={filename}>
            {filename}
          </h3>

          <div className="file-meta">

            <span>
              Your file
            </span>

            <span>•</span>

            <span>
              Protected
            </span>

          </div>

          <div className="file-actions">

            <button
              onClick={() =>
                onDownload(filename)
              }
              className="download-button"
            >
              Download
              <span>↓</span>
            </button>

            <button
              onClick={() =>
                onShare(filename)
              }
              className="icon-action share-action"
              title="Share"
            >
              ⇄
            </button>

            <button
              onClick={() =>
                onDelete(filename)
              }
              className="icon-action delete-action"
              title="Delete"
            >
              ×
            </button>

          </div>

        </div>
      ))}

    </div>
  );
}


// =========================
// EMPTY STATE
// =========================

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div className="empty-state">

      <div className="empty-icon">
        {icon}
      </div>

      <h2>
        {title}
      </h2>

      <p>
        {text}
      </p>

    </div>
  );
}


// =========================
// DESIGN SYSTEM
// =========================

const styles = `
* {
  box-sizing: border-box;
}

:root {
  --trust-950: #061316;
  --trust-900: #091b1e;
  --trust-850: #0d2426;
  --trust-800: #103033;

  --trust-700: #164347;
  --trust-600: #1b5c5e;

  --trust-500: #238486;
  --trust-400: #39aaa5;
  --trust-300: #75d3c7;

  --trust-mint: #b8eee2;

  --paper: #f5faf8;
  --ink: #102628;
  --muted: #708482;

  --danger: #c96060;

  --radius: 22px;
}

body {
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background: var(--paper);
  color: var(--ink);
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}


/* =========================
   AUTH
========================= */

.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background:
    radial-gradient(
      circle at 15% 15%,
      rgba(57,170,165,0.2),
      transparent 32%
    ),
    radial-gradient(
      circle at 85% 80%,
      rgba(117,211,199,0.12),
      transparent 35%
    ),
    var(--trust-950);
  color: white;
  position: relative;
  overflow: hidden;
}

.auth-left {
  padding: 58px 8vw 42px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-shield {
  width: 46px;
  height: 52px;
  border-radius: 15px 15px 19px 19px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: var(--trust-950);
  background:
    linear-gradient(
      145deg,
      var(--trust-mint),
      var(--trust-400)
    );
  box-shadow:
    0 0 35px rgba(57,170,165,0.35);
}

.brand-shield.small {
  width: 38px;
  height: 43px;
  font-size: 18px;
}

.brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.6px;
}

.brand-tagline {
  margin-top: 3px;
  color: #83a6a2;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.hero-copy {
  max-width: 620px;
  margin-top: -30px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--trust-300);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2.5px;
}

.eyebrow span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--trust-300);
  box-shadow:
    0 0 15px var(--trust-300);
}

.hero-copy h1 {
  margin: 24px 0 20px;
  font-size: clamp(52px, 6vw, 86px);
  line-height: 0.96;
  letter-spacing: -5px;
}

.hero-copy h1 span {
  color: var(--trust-300);
}

.hero-copy p {
  max-width: 500px;
  color: #8aa8a6;
  font-size: 17px;
  line-height: 1.7;
}

.trust-pills {
  display: flex;
  gap: 10px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.trust-pills div {
  padding: 11px 15px;
  border: 1px solid rgba(117,211,199,0.15);
  border-radius: 999px;
  background: rgba(255,255,255,0.035);
  color: #b4cbc8;
  font-size: 12px;
}

.trust-pills span {
  color: var(--trust-300);
  margin-right: 7px;
}

.auth-footer {
  color: #486765;
  font-size: 9px;
  letter-spacing: 2px;
}

.auth-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255,255,255,0.025);
  border-left: 1px solid rgba(255,255,255,0.06);
  position: relative;
  z-index: 3;
}

.auth-card {
  width: min(440px, 100%);
  padding: 38px;
  border-radius: 28px;
  background: rgba(245,250,248,0.98);
  color: var(--ink);
  box-shadow:
    0 35px 100px rgba(0,0,0,0.35);
}

.mini-trust {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 42px;
}

.mini-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d8f2ec;
  color: var(--trust-600);
  font-weight: 800;
}

.mini-trust strong,
.mini-trust small {
  display: block;
}

.mini-trust strong {
  font-size: 12px;
}

.mini-trust small {
  color: var(--muted);
  font-size: 10px;
  margin-top: 2px;
}

.form-heading h2 {
  margin: 0;
  font-size: 32px;
  letter-spacing: -1.5px;
}

.form-heading p {
  margin: 8px 0 28px;
  color: var(--muted);
  font-size: 13px;
}

form label {
  display: block;
  margin: 18px 0 8px;
  color: #52706e;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

form input,
form select {
  width: 100%;
  height: 50px;
  border: 1px solid #dce8e5;
  border-radius: 13px;
  padding: 0 15px;
  outline: none;
  background: white;
  color: var(--ink);
  transition: 0.2s;
}

form input:focus,
form select:focus {
  border-color: var(--trust-400);
  box-shadow:
    0 0 0 4px rgba(57,170,165,0.1);
}

.primary-button {
  width: 100%;
  min-height: 53px;
  margin-top: 22px;
  border: 0;
  border-radius: 14px;
  padding: 0 20px;
  background:
    linear-gradient(
      110deg,
      var(--trust-700),
      var(--trust-500)
    );
  color: white;
  font-weight: 800;
  box-shadow:
    0 12px 25px rgba(27,92,94,0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: 0.2s;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 30px rgba(27,92,94,0.28);
}

.primary-button span {
  font-size: 20px;
}

.auth-switch {
  text-align: center;
  margin-top: 25px;
  color: #7c918f;
  font-size: 12px;
}

.auth-switch button {
  border: 0;
  background: transparent;
  color: var(--trust-600);
  font-weight: 800;
  margin-left: 5px;
}

.error-box,
.success-box {
  margin-top: 15px;
  padding: 11px 13px;
  border-radius: 10px;
  font-size: 12px;
}

.error-box {
  background: #fff0f0;
  color: #a44747;
}

.success-box {
  background: #e8f8f3;
  color: #23715f;
}

.auth-orbit {
  position: absolute;
  border: 1px solid rgba(117,211,199,0.08);
  border-radius: 50%;
}

.orbit-one {
  width: 600px;
  height: 600px;
  left: -330px;
  bottom: -350px;
}

.orbit-two {
  width: 900px;
  height: 900px;
  right: -600px;
  top: -550px;
}


/* =========================
   APP
========================= */

.app-shell {
  min-height: 100vh;
  display: flex;
  background: var(--paper);
}

.sidebar {
  width: 255px;
  min-height: 100vh;
  padding: 30px 18px;
  background: var(--trust-950);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 10px 35px;
}

.sidebar-brand strong,
.sidebar-brand small {
  display: block;
}

.sidebar-brand strong {
  font-size: 17px;
}

.sidebar-brand small {
  color: #587572;
  font-size: 9px;
  margin-top: 3px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  border: 0;
  background: transparent;
  color: #7c9996;
  padding: 14px 13px;
  border-radius: 12px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  transition: 0.2s;
}

.nav-item span {
  width: 18px;
  text-align: center;
  font-size: 16px;
}

.nav-item b {
  margin-left: auto;
  font-size: 9px;
  color: #5c7774;
}

.nav-item:hover {
  color: white;
  background: rgba(255,255,255,0.04);
}

.nav-item.active {
  color: var(--trust-mint);
  background:
    linear-gradient(
      90deg,
      rgba(57,170,165,0.15),
      transparent
    );
}

.nav-item.active span {
  color: var(--trust-300);
}

.sidebar-trust {
  margin-top: auto;
  padding: 16px 12px;
  border: 1px solid rgba(117,211,199,0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: rgba(255,255,255,0.025);
}

.sidebar-trust-ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--trust-300);
  background: rgba(57,170,165,0.12);
}

.sidebar-trust strong,
.sidebar-trust span {
  display: block;
}

.sidebar-trust strong {
  font-size: 11px;
}

.sidebar-trust span {
  margin-top: 3px;
  color: #587572;
  font-size: 8px;
}

.logout-button {
  margin-top: 13px;
  border: 0;
  background: transparent;
  color: #5e7774;
  padding: 12px;
  text-align: left;
  font-size: 11px;
}

.logout-button:hover {
  color: #d98c8c;
}


/* =========================
   MAIN
========================= */

.main-content {
  margin-left: 255px;
  width: calc(100% - 255px);
  min-height: 100vh;
}

.topbar {
  height: 145px;
  padding: 36px 5vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2ece9;
  background: rgba(245,250,248,0.9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 5;
}

.topbar-label {
  color: var(--trust-500);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 2px;
}

.topbar h1 {
  margin: 8px 0 0;
  font-size: 31px;
  letter-spacing: -1.5px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--trust-800);
  color: var(--trust-mint);
  font-weight: 800;
}

.profile strong,
.profile span {
  display: block;
}

.profile strong {
  font-size: 11px;
}

.profile span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 9px;
}

.content {
  padding: 38px 5vw 70px;
  max-width: 1400px;
}


/* =========================
   ALERTS
========================= */

.global-error,
.global-success {
  margin: 20px 5vw 0;
  padding: 13px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.global-error {
  background: #fff0f0;
  color: #a44747;
}

.global-success {
  background: #e7f7f1;
  color: #23715f;
}

.global-error button,
.global-success button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 18px;
}


/* =========================
   WELCOME
========================= */

.welcome-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 18px;
}

.welcome-card {
  min-height: 300px;
  padding: 38px;
  border-radius: var(--radius);
  color: white;
  background:
    radial-gradient(
      circle at 90% 20%,
      rgba(117,211,199,0.18),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      var(--trust-950),
      var(--trust-800)
    );
  position: relative;
  overflow: hidden;
}

.welcome-card::after {
  content: "";
  position: absolute;
  width: 270px;
  height: 270px;
  border-radius: 50%;
  border: 1px solid rgba(117,211,199,0.1);
  right: -100px;
  bottom: -130px;
}

.welcome-eyebrow {
  color: var(--trust-300);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 2px;
}

.welcome-card h2 {
  max-width: 650px;
  margin: 16px 0 12px;
  font-size: 38px;
  letter-spacing: -2px;
  line-height: 1.05;
}

.welcome-card h2 span {
  color: var(--trust-300);
}

.welcome-card p {
  max-width: 520px;
  color: #91aaa7;
  font-size: 12px;
  line-height: 1.7;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 13px 17px;
  border-radius: 11px;
  background: var(--trust-mint);
  color: var(--trust-950);
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s;
}

.upload-button:hover {
  transform: translateY(-2px);
}

.upload-button input {
  display: none;
}

.upload-button.compact {
  margin-top: 0;
}


/* =========================
   TRUST CARD
========================= */

.trust-card {
  min-height: 300px;
  padding: 30px;
  border-radius: var(--radius);
  border: 1px solid #dce9e6;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.trust-ring-large {
  width: 145px;
  height: 145px;
  border-radius: 50%;
  padding: 9px;
  background:
    conic-gradient(
      var(--trust-400) 0deg,
      var(--trust-300) 290deg,
      #e5efec 290deg
    );
  display: grid;
  place-items: center;
}

.ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--trust-950);
  display: grid;
  place-content: center;
}

.ring-inner strong {
  color: white;
  font-size: 25px;
}

.ring-inner span {
  margin-top: 3px;
  color: var(--trust-300);
  font-size: 7px;
  letter-spacing: 2px;
}

.trust-card-copy {
  margin-top: 18px;
}

.trust-card-copy > span {
  color: var(--trust-500);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 2px;
}

.trust-card-copy h3 {
  margin: 6px 0 3px;
  font-size: 14px;
}

.trust-card-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
}


/* =========================
   STATS
========================= */

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 18px 0 38px;
}

.stat-card {
  padding: 19px;
  border-radius: 17px;
  background: white;
  border: 1px solid #e0ebe8;
  display: flex;
  align-items: center;
  gap: 13px;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #e8f6f2;
  color: var(--trust-600);
  font-size: 16px;
}

.stat-card span,
.stat-card strong {
  display: block;
}

.stat-card span {
  color: var(--muted);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 1.3px;
}

.stat-card strong {
  margin-top: 4px;
  font-size: 17px;
}


/* =========================
   SECTION
========================= */

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 15px;
}

.section-heading span {
  color: var(--trust-500);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 2px;
}

.section-heading h2 {
  margin: 5px 0 0;
  font-size: 21px;
  letter-spacing: -0.7px;
}

.section-heading button {
  border: 0;
  background: transparent;
  color: var(--trust-600);
  font-size: 11px;
  font-weight: 800;
}


/* =========================
   FILES
========================= */

.file-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.file-card {
  padding: 21px;
  border-radius: 18px;
  background: white;
  border: 1px solid #e0ebe8;
  transition: 0.2s;
}

.file-card:hover {
  transform: translateY(-3px);
  border-color: #b9d9d3;
  box-shadow:
    0 14px 30px rgba(16,38,40,0.07);
}

.file-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pdf-icon {
  width: 43px;
  height: 50px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(
      145deg,
      #e9f7f3,
      #d4eee8
    );
  color: var(--trust-600);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 1px;
}

.file-menu {
  color: var(--trust-500);
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 1.5px;
}

.file-card h3 {
  margin: 20px 0 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.file-meta {
  display: flex;
  gap: 7px;
  color: #91a3a1;
  font-size: 9px;
}

.file-actions {
  display: flex;
  gap: 7px;
  margin-top: 20px;
}

.download-button {
  flex: 1;
  min-height: 38px;
  border: 0;
  border-radius: 9px;
  background: var(--trust-950);
  color: white;
  padding: 0 12px;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.download-button span {
  color: var(--trust-300);
  font-size: 14px;
}

.icon-action {
  width: 39px;
  border: 0;
  border-radius: 9px;
  font-size: 15px;
}

.share-action {
  color: var(--trust-600);
  background: #e8f6f2;
}

.delete-action {
  color: #a95151;
  background: #fff0f0;
}


/* =========================
   PAGE ACTION
========================= */

.page-action-row {
  min-height: 70px;
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-action-row p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}


/* =========================
   SHARED
========================= */

.shared-banner {
  margin-bottom: 22px;
  padding: 25px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 18px;
  background:
    linear-gradient(
      110deg,
      #e3f6f1,
      #f9fcfb
    );
  border: 1px solid #d2eae4;
}

.shared-symbol {
  width: 55px;
  height: 55px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  color: white;
  background: var(--trust-800);
  font-size: 23px;
}

.shared-banner span {
  color: var(--trust-500);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 2px;
}

.shared-banner h2 {
  margin: 5px 0;
  font-size: 20px;
}

.shared-banner p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
}

.shared-tag {
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--trust-600);
  background: #e7f6f1;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 1px;
}

.shared-file .download-button {
  margin-top: 19px;
}


/* =========================
   SHARE
========================= */

.share-layout {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  gap: 20px;
}

.share-visual {
  min-height: 560px;
  border-radius: 25px;
  padding: 45px;
  color: white;
  background:
    radial-gradient(
      circle at 50% 28%,
      rgba(117,211,199,0.2),
      transparent 27%
    ),
    var(--trust-950);
  position: relative;
  overflow: hidden;
}

.share-orbit {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  border: 1px solid rgba(117,211,199,0.13);
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
}

.share-orbit::after {
  content: "";
  position: absolute;
  inset: 38px;
  border-radius: 50%;
  border: 1px dashed rgba(117,211,199,0.12);
}

.share-core {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: absolute;
  top: 185px;
  left: 50%;
  transform: translateX(-50%);
  background:
    linear-gradient(
      145deg,
      var(--trust-300),
      var(--trust-500)
    );
  color: var(--trust-950);
  font-size: 34px;
  font-weight: 900;
  box-shadow:
    0 0 55px rgba(117,211,199,0.25);
}

.share-copy {
  position: absolute;
  bottom: 45px;
  left: 45px;
  right: 45px;
}

.share-copy span {
  color: var(--trust-300);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 2px;
}

.share-copy h2 {
  margin: 10px 0;
  font-size: 37px;
  line-height: 1;
  letter-spacing: -2px;
}

.share-copy p {
  max-width: 420px;
  color: #7e9c99;
  font-size: 11px;
  line-height: 1.7;
}

.share-form-card {
  padding: 38px;
  border-radius: 25px;
  background: white;
  border: 1px solid #e0ebe8;
}

.form-heading > span {
  color: var(--trust-500);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 2px;
}

.secure-note {
  display: flex;
  gap: 11px;
  margin-top: 22px;
  padding: 13px;
  border-radius: 12px;
  background: #eff9f6;
}

.secure-note > span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #d7f1ea;
  color: var(--trust-600);
  font-weight: 900;
}

.secure-note strong {
  font-size: 10px;
}

.secure-note p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 8px;
}

.back-button {
  width: 100%;
  margin-top: 13px;
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 10px;
  font-size: 10px;
}


/* =========================
   EMPTY
========================= */

.empty-state {
  grid-column: 1 / -1;
  min-height: 280px;
  border: 1px dashed #cbdeda;
  border-radius: 20px;
  background: rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  color: var(--trust-600);
  background: #e8f6f2;
  font-size: 25px;
}

.empty-state h2 {
  margin: 15px 0 6px;
  font-size: 17px;
}

.empty-state p {
  max-width: 350px;
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}


/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1050px) {

  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-left {
    display: none;
  }

  .auth-right {
    min-height: 100vh;
    border: 0;
  }

  .welcome-grid,
  .share-layout {
    grid-template-columns: 1fr;
  }

  .file-grid {
    grid-template-columns: repeat(2, 1fr);
  }

}

@media (max-width: 750px) {

  .sidebar {
    width: 72px;
    padding: 20px 10px;
  }

  .sidebar-brand > div:last-child,
  .nav-item:not(.active)::after,
  .sidebar-trust,
  .logout-button {
    font-size: 0;
  }

  .sidebar-brand {
    justify-content: center;
    padding: 0 0 25px;
  }

  .sidebar-brand small,
  .sidebar-brand strong {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 14px 5px;
  }

  .nav-item b {
    display: none;
  }

  .main-content {
    margin-left: 72px;
    width: calc(100% - 72px);
  }

  .topbar {
    height: auto;
    min-height: 110px;
    padding: 25px 22px;
  }

  .topbar h1 {
    font-size: 23px;
  }

  .profile > div:last-child {
    display: none;
  }

  .content {
    padding: 25px 18px 50px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .file-grid {
    grid-template-columns: 1fr;
  }

  .welcome-card h2 {
    font-size: 30px;
  }

  .share-visual {
    min-height: 450px;
  }

  .share-form-card {
    padding: 25px;
  }

  .page-action-row {
    align-items: flex-start;
    gap: 15px;
  }

  .auth-card {
    padding: 27px;
  }

}
`;

export default App;