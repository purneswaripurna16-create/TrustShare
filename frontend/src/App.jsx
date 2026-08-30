import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);

  const [shareFile, setShareFile] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = localStorage.getItem("access_token");

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);

        setMessage("");
        setPage("dashboard");
        setPassword("");
      } else {
        setMessage(data.detail || data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async () => {
    if (!username || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully. Please sign in.");

        setUsername("");
        setPassword("");

        setPage("login");
      } else {
        setMessage(
          data.detail || data.message || "Registration failed."
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CURRENT USER
  // =========================
  const handleMe = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    try {
      const response = await fetch(`${API}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Account ID: ${data.user_id} • ${data.email}`
        );
      } else {
        setMessage(data.detail || "Authentication failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    }
  };

  // =========================
  // UPLOAD
  // =========================
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please choose a file first.");
      return;
    }

    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`"${data.filename}" uploaded successfully.`);
        setSelectedFile(null);
      } else {
        setMessage(data.detail || "File upload failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET MY FILES
  // =========================
  const handleFiles = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
        setPage("files");
      } else {
        setMessage(data.detail || "Could not load files.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DOWNLOAD
  // =========================
  const handleDownload = (filename) => {
    window.open(
      `${API}/download/${encodeURIComponent(filename)}`,
      "_blank"
    );
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (filename) => {
    if (!token) {
      setPage("login");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${filename}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/delete/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`"${filename}" deleted.`);
        handleFiles();
      } else {
        setMessage(data.detail || "Delete failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    }
  };

  // =========================
  // SHARE
  // =========================
  const handleShare = async () => {
    if (!shareFile || !recipientEmail) {
      setMessage("Please select a file and enter a recipient email.");
      return;
    }

    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: shareFile,
          recipient_email: recipientEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `"${shareFile}" was securely shared with ${recipientEmail}.`
        );

        setRecipientEmail("");
        setShareFile("");
      } else {
        setMessage(data.detail || "File sharing failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SHARED FILES
  // =========================
  const handleSharedFiles = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/shared-files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
        setPage("shared-files");
      } else {
        setMessage(
          data.detail || "Could not load shared files."
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to TrustShare server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setPage("login");
    setMessage("");

    setEmail("");
    setPassword("");
    setFiles([]);
  };

  // =========================
  // SIDEBAR
  // =========================
  const Sidebar = () => (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">✓</div>

        <div>
          <div className="brand-name">TrustShare</div>
          <div className="brand-tagline">
            Secure file sharing
          </div>
        </div>
      </div>

      <div className="nav-section">
        <span className="nav-title">WORKSPACE</span>

        <button
          className={page === "dashboard" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setPage("dashboard");
            setMessage("");
          }}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className={page === "files" ? "nav-item active" : "nav-item"}
          onClick={handleFiles}
        >
          <span>▣</span>
          My Files
        </button>

        <button
          className={page === "upload" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setPage("upload");
            setMessage("");
          }}
        >
          <span>↑</span>
          Upload
        </button>

        <button
          className={page === "shared-files" ? "nav-item active" : "nav-item"}
          onClick={handleSharedFiles}
        >
          <span>⇄</span>
          Shared With Me
        </button>
      </div>

      <div className="nav-section account-section">
        <span className="nav-title">ACCOUNT</span>

        <button className="nav-item" onClick={handleMe}>
          <span>◯</span>
          My Account
        </button>
      </div>

      <div className="sidebar-bottom">
        <button className="logout-button" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );

  // =========================
  // HEADER
  // =========================
  const Header = () => (
    <header className="topbar">
      <div>
        <span className="secure-label">SECURE WORKSPACE</span>
      </div>

      <div className="user-area">
        <div className="online-dot"></div>

        <div className="avatar">P</div>

        <div className="user-info">
          <strong>Purneswari</strong>
          <span>Personal account</span>
        </div>
      </div>
    </header>
  );

  // =========================
  // DASHBOARD
  // =========================
  const Dashboard = () => (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">WELCOME BACK</span>

          <h1>Good morning, Purneswari 👋</h1>

          <p>
            Your files are safe, organized and ready to share.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={() => {
            setPage("upload");
            setMessage("");
          }}
        >
          + Upload file
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">▣</div>

          <div>
            <span>Total files</span>
            <strong>{files.length || "—"}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⇄</div>

          <div>
            <span>Shared files</span>
            <strong>—</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>

          <div>
            <span>Security</span>
            <strong>Active</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">QUICK ACTIONS</span>
              <h2>What would you like to do?</h2>
            </div>
          </div>

          <div className="quick-actions">
            <button
              className="quick-card"
              onClick={() => {
                setPage("upload");
                setMessage("");
              }}
            >
              <div className="quick-icon upload-icon">↑</div>
              <strong>Upload a file</strong>
              <span>Add a new document to your workspace.</span>
            </button>

            <button
              className="quick-card"
              onClick={handleFiles}
            >
              <div className="quick-icon file-icon">▣</div>
              <strong>View my files</strong>
              <span>Manage your uploaded documents.</span>
            </button>

            <button
              className="quick-card"
              onClick={() => {
                setPage("share");
                setMessage("");
                handleFiles();
              }}
            >
              <div className="quick-icon share-icon">⇄</div>
              <strong>Share securely</strong>
              <span>Send a file to someone you trust.</span>
            </button>
          </div>
        </div>

        <div className="security-card">
          <div className="security-shield">✓</div>

          <span className="eyebrow">TRUSTSHARE SECURITY</span>

          <h2>Your workspace is protected.</h2>

          <p>
            Your account uses authenticated access so your
            files remain available only to authorized users.
          </p>

          <div className="security-status">
            <span></span>
            Authentication active
          </div>
        </div>
      </div>

      {message && <div className="dashboard-message">{message}</div>}
    </div>
  );

  // =========================
  // LOGIN
  // =========================
  if (page === "login") {
    return (
      <div className="auth-page">
        <div className="auth-decoration">
          <div className="auth-circle circle-one"></div>
          <div className="auth-circle circle-two"></div>
        </div>

        <div className="auth-container">
          <div className="auth-brand">
            <div className="large-brand-icon">✓</div>

            <h1>TrustShare</h1>

            <p>
              Your files. Your control.
            </p>
          </div>

          <div className="auth-card">
            <span className="eyebrow">WELCOME BACK</span>

            <h2>Sign in to your workspace</h2>

            <p className="auth-description">
              Access your files and share them securely.
            </p>

            <label>Email address</label>

            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>

            <div className="password-wrapper">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <button
              className="auth-button"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="auth-divider">
              <span></span>
              <small>NEW TO TRUSTSHARE?</small>
              <span></span>
            </div>

            <button
              className="outline-button"
              onClick={() => {
                setPage("register");
                setMessage("");
              }}
            >
              Create an account
            </button>
          </div>

          <div className="auth-footer">
            🔒 Your connection to TrustShare is protected
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // REGISTER
  // =========================
  if (page === "register") {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="large-brand-icon">✓</div>

            <h1>TrustShare</h1>

            <p>
              A safer way to share your files.
            </p>
          </div>

          <div className="auth-card">
            <span className="eyebrow">GET STARTED</span>

            <h2>Create your account</h2>

            <p className="auth-description">
              Set up your secure TrustShare workspace.
            </p>

            <label>Username</label>

            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Email address</label>

            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>

            <div className="password-wrapper">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <button
              className="auth-button"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <button
              className="text-button"
              onClick={() => {
                setPage("login");
                setMessage("");
              }}
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // APPLICATION
  // =========================
  return (
    <div className="application">
      <Sidebar />

      <main className="main-content">
        <Header />

        {page === "dashboard" && <Dashboard />}

        {/* =========================
            MY FILES
        ========================= */}
        {page === "files" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">WORKSPACE</span>
                <h1>My Files</h1>
                <p>Manage the files stored in your workspace.</p>
              </div>

              <button
                className="primary-action"
                onClick={() => setPage("upload")}
              >
                + Upload file
              </button>
            </div>

            <div className="files-container">
              {files.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▣</div>

                  <h2>No files yet</h2>

                  <p>
                    Upload your first file to get started.
                  </p>

                  <button
                    className="primary-action"
                    onClick={() => setPage("upload")}
                  >
                    Upload your first file
                  </button>
                </div>
              ) : (
                files.map((file, index) => (
                  <div className="real-file-card" key={index}>
                    <div className="file-type-icon">
                      PDF
                    </div>

                    <div className="file-details">
                      <strong>{file}</strong>

                      <span>
                        Stored securely in your workspace
                      </span>
                    </div>

                    <div className="file-actions">
                      <button
                        className="small-button"
                        onClick={() => {
                          setShareFile(file);
                          setRecipientEmail("");
                          setPage("share");
                        }}
                      >
                        Share
                      </button>

                      <button
                        className="small-button"
                        onClick={() => handleDownload(file)}
                      >
                        Download
                      </button>

                      <button
                        className="small-delete"
                        onClick={() => handleDelete(file)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {message && (
              <div className="dashboard-message">{message}</div>
            )}
          </div>
        )}

        {/* =========================
            UPLOAD
        ========================= */}
        {page === "upload" && (
          <div className="content-page narrow-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">WORKSPACE</span>

                <h1>Upload a file</h1>

                <p>
                  Add a document to your secure workspace.
                </p>
              </div>
            </div>

            <div className="upload-card">
              <label className="upload-zone">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="upload-icon-large">↑</div>

                <strong>
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a file"}
                </strong>

                <span>
                  {selectedFile
                    ? `${(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)} MB`
                    : "Click here to browse files from your computer"}
                </span>
              </label>

              {message && (
                <div className="dashboard-message">
                  {message}
                </div>
              )}

              <button
                className="auth-button"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload securely"}
              </button>

              <button
                className="text-button"
                onClick={() => {
                  setPage("dashboard");
                  setMessage("");
                }}
              >
                ← Back to dashboard
              </button>
            </div>
          </div>
        )}

        {/* =========================
            SHARE
        ========================= */}
        {page === "share" && (
          <div className="content-page narrow-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">COLLABORATION</span>

                <h1>Share a file</h1>

                <p>
                  Send a file securely to someone you trust.
                </p>
              </div>
            </div>

            <div className="share-card">
              <div className="share-step">
                <span className="step-number">1</span>

                <div>
                  <strong>Select a file</strong>
                  <p>Choose the document you want to share.</p>
                </div>
              </div>

              <select
                className="input"
                value={shareFile}
                onChange={(e) => setShareFile(e.target.value)}
              >
                <option value="">Select a file</option>

                {files.map((file, index) => (
                  <option key={index} value={file}>
                    {file}
                  </option>
                ))}
              </select>

              <div className="share-step">
                <span className="step-number">2</span>

                <div>
                  <strong>Who should receive it?</strong>
                  <p>
                    Enter the recipient's TrustShare email.
                  </p>
                </div>
              </div>

              <input
                className="input"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) =>
                  setRecipientEmail(e.target.value)
                }
              />

              <div className="trust-note">
                <span>✓</span>

                <div>
                  <strong>Share with confidence</strong>

                  <p>
                    TrustShare uses authenticated access
                    to protect your files.
                  </p>
                </div>
              </div>

              {message && (
                <div className="dashboard-message">
                  {message}
                </div>
              )}

              <button
                className="auth-button"
                onClick={handleShare}
                disabled={loading}
              >
                {loading ? "Sharing..." : "Share securely"}
              </button>

              <button
                className="text-button"
                onClick={() => {
                  setPage("dashboard");
                  setMessage("");
                }}
              >
                ← Back to dashboard
              </button>
            </div>
          </div>
        )}

        {/* =========================
            SHARED WITH ME
        ========================= */}
        {page === "shared-files" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">COLLABORATION</span>

                <h1>Shared With Me</h1>

                <p>
                  Files that other TrustShare users have shared with you.
                </p>
              </div>
            </div>

            <div className="files-container">
              {files.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⇄</div>

                  <h2>Nothing shared yet</h2>

                  <p>
                    Files shared with your account will appear here.
                  </p>
                </div>
              ) : (
                files.map((file, index) => (
                  <div className="real-file-card" key={index}>
                    <div className="file-type-icon">
                      FILE
                    </div>

                    <div className="file-details">
                      <strong>{file}</strong>

                      <span>
                        Shared with your TrustShare account
                      </span>
                    </div>

                    <div className="file-actions">
                      <button
                        className="small-button"
                        onClick={() => handleDownload(file)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;