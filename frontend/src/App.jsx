import { useEffect, useRef, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function AuthLayout({ children, theme, toggleTheme }) {
  return (
    <div className={`auth-page ${theme === "dark" ? "dark-mode" : ""}`}>
      <div className="auth-decoration">
        <div className="auth-circle circle-one"></div>
        <div className="auth-circle circle-two"></div>
      </div>

      <div className="auth-theme-position">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          type="button"
        >
          <span className="theme-icon">
            {theme === "light" ? "☾" : "☀"}
          </span>

          <span>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </span>
        </button>
      </div>

      <div className="auth-container">
        <div className="auth-brand">
          <div className="large-brand-icon">✓</div>

          <h1>TrustShare</h1>

          <p>Your files. Your control.</p>
        </div>

        {children}

        <div className="auth-footer">
          🔒 Your connection to TrustShare is protected
        </div>
      </div>
    </div>
  );
}

function App() {
  // =========================================================
  // PAGE / AUTH STATE
  // =========================================================

  const [page, setPage] = useState(
    window.location.pathname === "/reset-password"
      ? "reset-password"
      : "login"
  );
  

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifications = notifications.filter(
    (notification) => notification.is_read === false
  ).length;

  const [activities, setActivities] = useState([]);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reportFilter, setReportFilter] = useState("ALL");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  // =========================================================
  // FILE STATE
  // =========================================================

  const [selectedFile, setSelectedFile] = useState(null);

  // My uploaded files
  const [myFiles, setMyFiles] = useState([]);

  // Files shared with me
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState([]);

  // Files shared by me
  const [sharedByMeFiles, setSharedByMeFiles] = useState([]);

  // Selected file for sharing
  const [shareFile, setShareFile] = useState("");

  // Current email input
  const [recipientEmail, setRecipientEmail] = useState("");
  


  

  

   

  

  // Multiple recipient emails
  const [recipientEmails, setRecipientEmails] = useState([]);

  // Permission for shared file
  const [permission, setPermission] = useState("read");
  // Update shared file state
  const [updateShareId, setUpdateShareId] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  // Temporary share state
  const [temporaryShareFile, setTemporaryShareFile] = useState("");
  const [temporaryExpiryHours, setTemporaryExpiryHours] = useState(1);
  const [temporaryShareResult, setTemporaryShareResult] = useState(null);

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [showProfile, setShowProfile] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    user_id: "",
    email: "",
    username: "",
  });

  const profileRef = useRef(null);

  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = useState(
    localStorage.getItem("trustshare_theme") || "dark"
  );

  const token = localStorage.getItem("access_token");

  const resetToken = new URLSearchParams(
    window.location.search
  ).get("token");

  // =========================================================
  // LOAD MY FILES
  // =========================================================

  const loadFiles = async (authToken = token) => {
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(`${API}/files`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMyFiles(data.files || []);
      } else {
        console.error(
          data.detail || "Could not load files."
        );
      }
    } catch (error) {
      console.error(
        "Unable to load files:",
        error
      );
    }
  };
  // =========================================================
// MILESTONE 3 - LOAD NOTIFICATIONS
// =========================================================

const loadNotifications = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    const response = await fetch(
      `${API}/notifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    const normalizedNotifications = (
      data.notifications || []
    ).map((notification) => ({
      ...notification,
      is_read:
        notification.is_read === true ||
        notification.is_read === "true",
    }));

    setNotifications(normalizedNotifications);
    console.log(
      "UNREAD COUNT:",
      normalizedNotifications.filter(
        (notification) => notification.is_read === false
      ).length
    );
  } catch (error) {
    console.error(
      "Failed to load notifications:",
      error
    );
  }
};
// =========================================================
// MILESTONE 3 - LOAD ACTIVITY
// =========================================================

const loadActivities = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    const response = await fetch(
      `${API}/activity?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    setActivities(
      data.activities || []
    );

  } catch (error) {
    console.error(
      "Failed to load activities:",
      error
    );
  }
};
// =========================================================
// AI SECURITY ANALYSIS
// =========================================================

const runAiSecurityAnalysis = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    setAiLoading(true);
    setAiAnalysis("");
    setMessage("");

    const response = await fetch(
      `${API}/ai/security-analyze`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "AI security analysis failed"
      );
    }

    setAiAnalysis(
      data.analysis || "No analysis returned."
    );

  } catch (error) {
    console.error(
      "AI security analysis failed:",
      error
    );

    setMessage(
      error.message ||
      "Failed to run AI security analysis."
    );

  } finally {
    setAiLoading(false);
  }
};
const runAiSecurityInsights = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    setAiInsightsLoading(true);
    setAiInsights("");
    setMessage("");

    const response = await fetch(
      `${API}/ai/security-insights`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        "AI security insights failed"
      );
    }

    setAiInsights(
      data.insights ||
      "No security insights returned."
    );

  } catch (error) {
    console.error(
      "AI security insights failed:",
      error
    );

    setMessage(
      error.message ||
      "Failed to generate AI security insights."
    );

  } finally {
    setAiInsightsLoading(false);
  }
};
// =========================================================
// AI SECURITY RESULT PARSER
// =========================================================

const getAiSection = (label) => {
  if (!aiAnalysis) return "";

  const pattern = new RegExp(
    `${label}:\\s*([\\s\\S]*?)(?=\\n(?:Risk Level|Risk Score|Reason|Recommendation):|$)`,
    "i"
  );

  const match = aiAnalysis.match(pattern);

  return match
    ? match[1].trim()
    : "";
};
const getAiInsightSection = (label) => {
  if (!aiInsights) return "";

  const pattern = new RegExp(
    `${label}:\\s*([\\s\\S]*?)(?=\\n(?:Security Summary|Activity Insights|Storage and File Usage|Suspicious Patterns|Recommendations):|$)`,
    "i"
  );

  const match = aiInsights.match(pattern);

  return match
    ? match[1].trim()
    : "";
};
// =========================================================
// MILESTONE 3 - SECURITY MONITORING
// =========================================================
const loadSecurityStatus = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    const response = await fetch(
      `${API}/security/check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    setSecurityStatus(data);

    // Refresh notifications after security check
    await loadNotifications();

  } catch (error) {
    console.error(
      "Failed to load security status:",
      error
    );
  }
};
   
// =========================================================
// MILESTONE 3 - LOAD ANALYTICS
// =========================================================

const loadAnalytics = async () => {
  try {
    const token =
      localStorage.getItem("access_token");

    if (!token) return;

    const response = await fetch(
      `${API}/analytics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    setAnalytics(data);

  } catch (error) {
    console.error(
      "Failed to load analytics:",
      error
    );
  }
};

  // =========================================================
  // LOAD SHARED WITH ME FILES
  // =========================================================

  const loadSharedWithMeFiles = async (
    authToken = token
  ) => {
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/shared-files`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSharedWithMeFiles(
          data.files || []
        );
      } else {
        console.error(
          data.detail ||
            "Could not load shared files."
        );
      }
    } catch (error) {
      console.error(
        "Unable to load shared files:",
        error
      );
    }
  };

  // =========================================================
  // LOAD SHARED BY ME FILES
  // =========================================================

  const loadSharedByMeFiles = async (
    authToken = token
  ) => {
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/shared-by-me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSharedByMeFiles(
          data.files || []
        );
      } else {
        console.error(
          data.detail ||
            "Could not load shared-by-me files."
        );
      }
    } catch (error) {
      console.error(
        "Unable to load shared-by-me files:",
        error
      );
    }
  };

  // =========================================================
  // LOAD DATA WHEN DASHBOARD OPENS
  // =========================================================

  useEffect(() => {
  if (
  (page === "dashboard" || page === "activity") &&
  token
) {
    loadFiles(token);
    loadSharedWithMeFiles(token);
    loadSharedByMeFiles(token);
    loadActivities();
    loadAnalytics();

    const refreshSecurityAndNotifications = async () => {
      await loadSecurityStatus();
      await loadNotifications();
    };

    // Check immediately when dashboard opens
    refreshSecurityAndNotifications();

    // Check for new security events and notifications every 3 seconds
    const notificationInterval = setInterval(
      refreshSecurityAndNotifications,
      3000
    );

    return () => {
      clearInterval(notificationInterval);
    };
  }
}, [page, token]);

  // =========================================================
  // CLOSE PROFILE OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // THEME
  // =========================================================

  const toggleTheme = () => {
    const newTheme =
      theme === "light" ? "dark" : "light";

    setTheme(newTheme);

    localStorage.setItem(
      "trustshare_theme",
      newTheme
    );
  };

  const ThemeButton = () => (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-icon">
        {theme === "light" ? "☾" : "☀"}
      </span>

      <span>
        {theme === "light"
          ? "Dark mode"
          : "Light mode"}
      </span>
    </button>
  );

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(
          "access_token",
          data.access_token
        );
        setUsername(data.username);

        setPassword("");
        setMessage("");

        await loadFiles(
          data.access_token
        );

        await loadSharedWithMeFiles(
          data.access_token
        );

        await loadSharedByMeFiles(
          data.access_token
        );

        setPage("dashboard");
      } else {
        setMessage(
          data.detail ||
            data.message ||
            "Invalid email or password."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setMessage(
        "Please fill in all fields."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Account created successfully. Please sign in."
        );

        setUsername("");
        setPassword("");

        setPage("login");
      } else {
        setMessage(
          data.detail ||
            data.message ||
            "Registration failed."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage(
        "Please enter your email address."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          data.message ||
            "Password reset instructions have been sent."
        );
      } else {
        setMessage(
          data.detail ||
            data.message ||
            "Unable to process your request."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const handleResetPassword = async () => {
    if (!resetToken) {
      setMessage(
        "Invalid or missing reset link."
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setMessage(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token: resetToken,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Password reset successfully. You can now sign in."
        );

        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          window.history.replaceState(
            {},
            "",
            "/"
          );

          setPage("login");
          setMessage("");
        }, 2000);
      } else {
        setMessage(
          data.detail ||
            data.message ||
            "Unable to reset your password."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  const handleMe = async () => {
    if (!token) {
      setPage("login");
      return null;
    }

    try {
      const response = await fetch(
        `${API}/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCurrentUser({
          user_id:
            data.user_id || "",
          email:
            data.email || "",
          username:
            data.username ||
            data.name ||
            data.full_name ||
            "",
        });

        return data;
      }

      setMessage(
        data.detail ||
          "Authentication failed."
      );

      return null;
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );

      return null;
    }
  };

  // =========================================================
  // PROFILE
  // =========================================================

  const handleProfileClick = async () => {
    const nextState =
      !showProfile;

    setShowProfile(nextState);

    if (nextState) {
      await handleMe();
    }
  };

  // =========================================================
  // UPLOAD
  // =========================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage(
        "Please choose a file first."
      );
      return;
    }

    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API}/upload`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          `"${data.filename}" uploaded successfully.`
        );

        setSelectedFile(null);

        await loadFiles(token);
      } else {
        setMessage(
          data.detail ||
            "File upload failed."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // MY FILES
  // =========================================================

  const handleFiles = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await loadFiles(token);

      setPage("files");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN SHARE PAGE
  // =========================================================

  const openSharePage = async (
    filename = ""
  ) => {
    if (!token) {
      setPage("login");
      return;
    }

    setMessage("");

    await loadFiles(token);

    setShareFile(filename);

    setRecipientEmail("");

    setRecipientEmails([]);

    setPermission("read");
    setTemporaryShareFile(filename);

    setTemporaryExpiryHours(1);

    setTemporaryShareResult(null);

    setPage("share");
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = async (
    filename
  ) => {
    if (!token) {
      setPage("login");
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `${API}/download/${encodeURIComponent(
          filename
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to download this file.";

        try {
          const data =
            await response.json();

          errorMessage =
            data.detail ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error
        }

        setMessage(errorMessage);

        return;
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      window.URL.revokeObjectURL(
        url
      );

      setMessage(
        `"${filename}" downloaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to download the file."
      );
    }
  };
  // =========================================================
// UPDATE SHARED FILE
// =========================================================

const handleUpdateSharedFile = async (
  shareId,
  filename
) => {
  if (!token) {
    setPage("login");
    return;
  }

  if (!updateFile) {
    setMessage(
      "Please choose a file to upload."
    );
    return;
  }

  if (updateFile.name !== filename) {
    setMessage(
      `Please upload a file named "${filename}".`
    );
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const formData = new FormData();

    formData.append(
      "file",
      updateFile
    );

    const response = await fetch(
      `${API}/shared-files/${shareId}/update`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setMessage(
        `"${filename}" updated successfully.`
      );

      setUpdateFile(null);
      setUpdateShareId(null);

      await loadSharedWithMeFiles(
        token
      );
    } else {
      setMessage(
        data.detail ||
          "Unable to update the shared file."
      );
    }
  } catch (error) {
    console.error(error);

    setMessage(
      "Unable to connect to TrustShare server."
    );
  } finally {
    setLoading(false);
  }
};
  // =========================================================
  // DOWNLOAD TEMPORARY SHARED FILE
  // =========================================================

  const handleTemporaryDownload = async () => {
    if (!temporaryShareResult?.share_token) {
      setMessage(
        "Temporary share link is not available."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    console.log(
      "Temporary token:",
      temporaryShareResult.share_token
    );

    try {
      const response = await fetch(
        `${API}/download/shared/${encodeURIComponent(
          temporaryShareResult.share_token
        )}`
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to download the temporary file.";

        try {
          const data = await response.json();

          errorMessage =
            data.detail ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error
        }

        setMessage(errorMessage);
        return;
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        temporaryShareResult.filename ||
        "temporary-file";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      setMessage(
        `"${temporaryShareResult.filename}" downloaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to download the temporary file."
      );
    } finally {
      setLoading(false);
    }
  };
  // =========================================================
// COPY TEMPORARY SHARE LINK
// =========================================================

const handleCopyTemporaryLink = async () => {
  if (!temporaryShareResult?.share_token) {
    setMessage("Temporary share link is not available.");
    return;
  }

  const temporaryLink =
    `${API}/download/shared/${encodeURIComponent(
      temporaryShareResult.share_token
    )}`;

  try {
    await navigator.clipboard.writeText(temporaryLink);

    setMessage("Temporary link copied to clipboard.");
  } catch (error) {
    console.error(error);

    setMessage("Unable to copy the temporary link.");
  }
};

  // =========================================================
  // DELETE MY OWN FILE
  // =========================================================

  const handleDelete = async (
    filename
  ) => {
    if (!token) {
      setPage("login");
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${filename}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `${API}/delete/${encodeURIComponent(
          filename
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          `"${filename}" deleted successfully.`
        );

        await loadFiles(token);
        await loadSharedWithMeFiles(
          token
        );
        await loadSharedByMeFiles(
          token
        );
      } else {
        setMessage(
          data.detail ||
            "Delete failed."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    }
  };

  // =========================================================
  // REMOVE FROM SHARED WITH ME
  // =========================================================

  const handleRemoveSharedWithMe = async (
    shareId,
    filename
  ) => {
    if (!token) {
      setPage("login");
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${filename}" from Shared With Me?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `${API}/shared-files/${shareId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          `"${filename}" was removed from Shared With Me.`
        );

        await loadSharedWithMeFiles(
          token
        );
      } else {
        setMessage(
          data.detail ||
            "Unable to remove this shared file."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    }
  };

  // =========================================================
  // REMOVE FROM SHARED BY ME
  // =========================================================

  const handleRemoveSharedByMe = async (
    shareId,
    filename
  ) => {
    if (!token) {
      setPage("login");
      return;
    }

    const confirmed =
      window.confirm(
        `Stop sharing "${filename}" with this user?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `${API}/shared-by-me/${shareId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          `Sharing for "${filename}" was removed successfully.`
        );

        await loadSharedByMeFiles(
          token
        );
      } else {
        setMessage(
          data.detail ||
            "Unable to remove sharing."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to TrustShare server."
      );
    }
  };

  // =========================================================
  // ADD EMAIL
  // =========================================================

  const handleAddEmail = () => {
    const cleanEmail =
      recipientEmail.trim();

    if (!cleanEmail) {
      setMessage(
        "Please enter an email address."
      );
      return;
    }

    if (
      !cleanEmail.includes("@")
    ) {
      setMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      recipientEmails.includes(
        cleanEmail
      )
    ) {
      setMessage(
        "This email has already been added."
      );
      return;
    }

    setRecipientEmails(
      (currentEmails) => [
        ...currentEmails,
        cleanEmail,
      ]
    );

    setRecipientEmail("");
    setMessage("");
  };

  // =========================================================
  // REMOVE EMAIL
  // =========================================================

  const handleRemoveEmail = (
    emailToRemove
  ) => {
    setRecipientEmails(
      (currentEmails) =>
        currentEmails.filter(
          (emailItem) =>
            emailItem !==
            emailToRemove
        )
    );
  };

  // =========================================================
  // SHARE FILE WITH MULTIPLE EMAILS
  // =========================================================

  const handleShare = async () => {
    if (!shareFile) {
      setMessage(
        "Please select a file."
      );
      return;
    }

    let emailsToShare =
      [...recipientEmails];

    const typedEmail =
      recipientEmail.trim();

    if (
      typedEmail &&
      !emailsToShare.includes(
        typedEmail
      )
    ) {
      emailsToShare.push(
        typedEmail
      );
    }

    if (
      emailsToShare.length === 0
    ) {
      setMessage(
        "Please add at least one recipient email."
      );
      return;
    }

    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let successfulShares = 0;

      for (
        const recipient of emailsToShare
      ) {
        const response =
          await fetch(
            `${API}/share`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                filename:
                  shareFile,
                recipient_email:
                  recipient,
                permission:
                  permission,
              }),
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          successfulShares++;
        } else {
          throw new Error(
            data.detail ||
              "File sharing failed."
          );
        }
      }

      setMessage(
        `"${shareFile}" was securely shared with ${successfulShares} recipient${
          successfulShares > 1
            ? "s"
            : ""
        }.`
      );

      setRecipientEmail("");
      setRecipientEmails([]);

      await loadSharedByMeFiles(
        token
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Unable to share the file."
      );
    } finally {
      setLoading(false);
    }
  };
    // =========================================================
  // TEMPORARY SECURE SHARE
  // =========================================================

  const handleTemporaryShare = async () => {
    if (!temporaryShareFile) {
      setMessage("Please select a file.");
      return;
    }
    if (!temporaryExpiryHours || temporaryExpiryHours <= 0) {
      setMessage("Please enter a valid expiry time.");
      return;
    }

    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");
    setTemporaryShareResult(null);

    try {
        const response = await fetch(
            `${API}/share/temporary?filename=${encodeURIComponent(
              temporaryShareFile
            )}&recipient_email=${encodeURIComponent(
              recipientEmail.trim()
            )}&expires_in_minutes=${Number(
              temporaryExpiryHours
            ) * 60}`,
            {
              method: "POST",

              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(
                data.detail ||
                  data ||
                  "Unable to create temporary share link."
              )
        );
      }

      setTemporaryShareResult(data);

      setMessage(
        `"${temporaryShareFile}" temporary share link created successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        typeof error.message === "string"
          ? error.message
          : "Unable to create temporary share link."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SHARED WITH ME
  // =========================================================

  const handleSharedFiles = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await loadSharedWithMeFiles(
        token
      );

      setPage(
        "shared-files"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SHARED BY ME
  // =========================================================

  const handleSharedByMe = async () => {
    if (!token) {
      setPage("login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await loadSharedByMeFiles(
        token
      );

      setPage(
        "shared-by-me"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setPage("login");
    setMessage("");

    setEmail("");
    setPassword("");

    setMyFiles([]);

    setSharedWithMeFiles([]);

    setSharedByMeFiles([]);

    setRecipientEmails([]);

    setCurrentUser({
      user_id: "",
      email: "",
      username: "",
    });

    setShowProfile(false);
  };

  // =========================================================
  // SIDEBAR
  // =========================================================

    const Sidebar = () => (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={
          mobileMenuOpen
            ? "sidebar mobile-sidebar-open"
            : "sidebar"
        }
      >
        <div className="brand">
          <div className="brand-icon">
            ✓
          </div>

          <div>
            <div className="brand-name">
              TrustShare
            </div>

            <div className="brand-tagline">
              Secure file sharing
            </div>
          </div>

          {/* Mobile close button */}
          <button
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="nav-section">
          <span className="nav-title">
            WORKSPACE
          </span>

          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("dashboard");
              setMessage("");
              setMobileMenuOpen(false);
            }}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              page === "files"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              handleFiles();
              setMobileMenuOpen(false);
            }}
          >
            <span>▣</span>
            My Files
          </button>

          <button
            className={
              page === "upload"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("upload");
              setMessage("");
              setMobileMenuOpen(false);
            }}
          >
            <span>↑</span>
            Upload
          </button>

          <button
            className={
              page === "shared-files"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              handleSharedFiles();
              setMobileMenuOpen(false);
            }}
          >
            <span>⇄</span>
            Shared With Me
          </button>

          <button
            className={
              page === "shared-by-me"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              handleSharedByMe();
              setMobileMenuOpen(false);
            }}
          >
            <span>↗</span>
            Shared By Me
          </button>

          <button
            className={
              page === "activity"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("activity");
              setMessage("");
              setMobileMenuOpen(false);
            }}
          >
            <span>◷</span>
            Activity
          </button>

          <button
            className={
              page === "analytics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("analytics");
              setMessage("");
              setMobileMenuOpen(false);
            }}
          >
            <span>▥</span>
            Analytics
          </button>

          <button
            className={
              page === "ai-security"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setPage("ai-security");
              setMessage("");
              setMobileMenuOpen(false);
            }}
          >
            <span>🤖</span>
            AI Security
          </button>
        </div>

        <div className="nav-section account-section">
          <span className="nav-title">
            ACCOUNT
          </span>

          <button
            className="nav-item"
            onClick={() => {
              setShowProfile(true);
              handleMe();
              setMobileMenuOpen(false);
            }}
          >
            <span>◯</span>
            My Account
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            className="logout-button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );


      
      


  // =========================================================
  // HEADER
  // =========================================================

  const Header = () => {
    const displayName =
      currentUser.username ||
      "Purneswari";

    const displayEmail =
      currentUser.email ||
      "Personal account";

    return (
      <header className="topbar">
        <div className="mobile-header-left">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <span className="secure-label">
            SECURE WORKSPACE
          </span>
        </div>

        <div className="topbar-right">
          <div className="theme-wrapper">
            <ThemeButton />
          </div>
          <div className="notification-wrapper">

  <button
  type="button"
  className="notification-button"
  onClick={() =>
    setShowNotifications(!showNotifications)
  }
>
  <span style={{ position: "relative", display: "inline-flex" }}>
    🔔

    {unreadNotifications > 0 && (
      <span
        style={{
          position: "absolute",
          top: "-8px",
          right: "-10px",
          minWidth: "18px",
          height: "18px",
          padding: "0 5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#e53935",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
          lineHeight: "1",
          border: "2px solid #ffffff",
          zIndex: 99999,
        }}
      >
        {unreadNotifications}
      </span>
    )}
  </span>
</button>
  {showNotifications && (
    <div className="notification-panel">

      <div className="notification-panel-header">
        <div>
          <strong>Notifications</strong>
          <span className="notification-count">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""}
          </span>
        </div>

        {unreadNotifications > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              const token =
                localStorage.getItem("access_token");

              await fetch(
                `${API}/notifications/read-all`,
                {
                  method: "PUT",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

              loadNotifications();
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-list">

        {notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              ✓
            </div>

            <strong>No notifications</strong>

            <span>
              You're all caught up.
            </span>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={
                notification.is_read
                  ? "notification-item read"
                  : "notification-item"
              }
              key={notification.id}
            >

              <div className="notification-item-top">

                <div
                  className={
                    notification.notification_type ===
                    "SECURITY_ALERT"
                      ? "notification-icon security"
                      : "notification-icon"
                  }
                >
                  {notification.notification_type ===
                  "SECURITY_ALERT"
                    ? "!"
                    : "✓"}
                </div>

                <div className="notification-content">

                  <strong>
                    {notification.title}
                  </strong>

                  <p>
                    {notification.message}
                  </p>

                  <small>
                  {notification.created_at
                    ? (() => {
                        const timestamp = notification.created_at;

                        const utcTimestamp = timestamp.endsWith("Z")
                          ? timestamp
                          : timestamp + "Z";

                        const date = new Date(utcTimestamp);

                        return new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }).format(date);
                      })()
                    : ""}
                </small>

                </div>

              </div>

              {!notification.is_read && (
                <button
                  type="button"
                  className="notification-read-button"
                  onClick={async () => {
                    const token =
                      localStorage.getItem(
                        "access_token"
                      );

                    await fetch(
                      `${API}/notifications/${notification.id}/read`,
                      {
                        method: "PUT",
                        headers: {
                          Authorization:
                            `Bearer ${token}`,
                        },
                      }
                    );

                    loadNotifications();
                  }}
                >
                  Mark as read
                </button>
              )}

            </div>
          ))
        )}

      </div>
    </div>
  )}

</div>
            


      

          <div
            className="profile-wrapper"
            ref={profileRef}
          >
            <button
              type="button"
              className={`user-area ${
                showProfile
                  ? "user-area-active"
                  : ""
              }`}
              onClick={
                handleProfileClick
              }
            >
              <div className="online-dot"></div>

              <div className="avatar">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-info">
                <strong>
                  {displayName}
                </strong>

                <span>
                  {displayEmail}
                </span>
              </div>

              <span className="profile-arrow">
                {showProfile
                  ? "⌃"
                  : "⌄"}
              </span>
            </button>

            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-large-avatar">
                    {displayName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {displayName}
                    </strong>

                    <span>
                      {displayEmail}
                    </span>
                  </div>
                </div>

                <div className="profile-divider"></div>

                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span>
                      Account ID
                    </span>

                    <strong>
                      {currentUser.user_id ||
                        "Loading..."}
                    </strong>
                  </div>

                  <div className="profile-detail-row">
                    <span>
                      Email
                    </span>

                    <strong>
                      {currentUser.email ||
                        "Loading..."}
                    </strong>
                  </div>

                  <div className="profile-detail-row">
                    <span>
                      Status
                    </span>

                    <strong className="profile-status">
                      <span></span>
                      Active
                    </strong>
                  </div>
                </div>

                <div className="profile-divider"></div>

                <button
                  type="button"
                  className="profile-account-button"
                  onClick={() => {
                    setShowProfile(
                      false
                    );
                    setPage(
                      "dashboard"
                    );
                  }}
                >
                  <span>◯</span>
                  My Account
                </button>

                <button
                  type="button"
                  className="profile-logout-button"
                  onClick={
                    handleLogout
                  }
                >
                  <span>↪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  const Dashboard = () => (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h1>
           
            Welcome back {username || "User"} 👋

            
          </h1>

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
          <div className="stat-icon">
            ▣
          </div>

          <div>
            <span>
              Total files
            </span>

            <strong>
              {myFiles.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ⇄
          </div>

          <div>
            <span>
              Shared with me
            </span>

            <strong>
              {sharedWithMeFiles.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ↗
          </div>

          <div>
            <span>
              Shared by me
            </span>

            <strong>
              {sharedByMeFiles.length}
            </strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                QUICK ACTIONS
              </span>

              <h2>
                What would you like to do?
              </h2>
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
              <div className="quick-icon">
                ↑
              </div>

              <strong>
                Upload a file
              </strong>

              <span>
                Add a new document to your workspace.
              </span>
            </button>

            <button
              className="quick-card"
              onClick={handleFiles}
            >
              <div className="quick-icon">
                ▣
              </div>

              <strong>
                View my files
              </strong>

              <span>
                Manage your uploaded documents.
              </span>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                openSharePage()
              }
            >
              <div className="quick-icon">
                ⇄
              </div>

              <strong>
                Share securely
              </strong>

              <span>
                Send a file to someone you trust.
              </span>
            </button>
          </div>
        </div>

        <div className="security-card">
          <div className="security-shield">
            ✓
          </div>

          <span className="eyebrow">
            TRUSTSHARE SECURITY
          </span>

          <h2>
            Your workspace is protected.
          </h2>

          <p>
            Your account uses authenticated access
            so your files remain available only to
            authorized users.
          </p>

          <div className="security-status">
            <span></span>
            Authentication active
          </div>
        </div>
      </div>

      {message && (
        <div className="dashboard-message">
          {message}
        </div>
      )}
    </div>
  );

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  if (page === "reset-password") {
    return (
      <AuthLayout
        theme={theme}
        toggleTheme={toggleTheme}
      >
        <div className="auth-card">
          <div className="forgot-icon">
            🔐
          </div>

          <span className="eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h2>
            Create a new password
          </h2>

          <p className="auth-description">
            Choose a strong new password for your
            TrustShare account.
          </p>

          <label>
            New password
          </label>

          <div className="password-wrapper">
            <input
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          <label>
            Confirm new password
          </label>

          <input
            className="input"
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Enter your password again"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            className="auth-button"
            onClick={
              handleResetPassword
            }
            disabled={loading}
          >
            {loading
              ? "Updating password..."
              : "Update password"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (page === "login") {
    return (
      <AuthLayout
        theme={theme}
        toggleTheme={toggleTheme}
      >
        <div className="auth-card">
          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h2>
            Sign in to your workspace
          </h2>

          <p className="auth-description">
            Access your files and share them securely.
          </p>

          <label>
            Email address
          </label>

          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          <div className="password-label-row">
            <label>
              Password
            </label>

            <button
              className="forgot-link"
              type="button"
              onClick={() => {
                setPage("forgot");
                setMessage("");
              }}
            >
              Forgot password?
            </button>
          </div>

          <div className="password-wrapper">
            <input
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
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
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <div className="register-prompt">
            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() => {
                setPage("register");
                setMessage("");
              }}
            >
              Register
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  if (page === "forgot") {
    return (
      <AuthLayout
        theme={theme}
        toggleTheme={toggleTheme}
      >
        <div className="auth-card">
          <div className="forgot-icon">
            🔐
          </div>

          <span className="eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h2>
            Forgot your password?
          </h2>

          <p className="auth-description">
            Enter the email address associated
            with your TrustShare account.
          </p>

          <label>
            Email address
          </label>

          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            className="auth-button"
            onClick={
              handleForgotPassword
            }
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send reset instructions"}
          </button>

          <button
            className="back-login-button"
            type="button"
            onClick={() => {
              setPage("login");
              setMessage("");
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  // =========================================================
  // REGISTER
  // =========================================================

  if (page === "register") {
    return (
      <AuthLayout
        theme={theme}
        toggleTheme={toggleTheme}
      >
        <div className="auth-card">
          <span className="eyebrow">
            GET STARTED
          </span>

          <h2>
            Create your account
          </h2>

          <p className="auth-description">
            Set up your secure TrustShare workspace.
          </p>

          <label>
            Username
          </label>

          <input
            className="input"
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

          <label>
            Email address
          </label>

          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          <label>
            Password
          </label>

          <div className="password-wrapper">
            <input
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            className="auth-button"
            onClick={
              handleRegister
            }
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>

          <button
            className="back-login-button"
            type="button"
            onClick={() => {
              setPage("login");
              setMessage("");
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  // =========================================================
  // APPLICATION
  // =========================================================

  return (
    <div
      className={`application ${
        theme === "dark"
          ? "dark-mode"
          : ""
      }`}
    >
      <Sidebar />

      <main className="main-content">
        <Header />

        {/* DASHBOARD */}

        {page === "dashboard" && (
          <Dashboard />
        )}
                {/* ===================================================
            AI SECURITY
            =================================================== */}
                  {page === "ai-security" && (
          <div className="content-page">

            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  AI SECURITY
                </span>

                <h1>
                  AI Security Analyzer
                </h1>

                <p>
                  Analyze your recent TrustShare activity using local AI.
                </p>
              </div>
            </div>

            <div className="dashboard-grid">

              <div className="panel">

                <div className="panel-header">
                  <h2>
                    🤖 Security Analysis
                  </h2>
                </div>

                <p className="ai-description">
                  Run an AI-powered security analysis of your recent
                  account and file activity.
                </p>

                <button
                  className="primary-button"
                  onClick={runAiSecurityAnalysis}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? "Analyzing..."
                    : "Run Security Analysis"}
                </button>
                <button
                  className="primary-button"
                  onClick={runAiSecurityInsights}
                  disabled={aiInsightsLoading}
                  style={{ marginLeft: "10px" }}
                >
                  {aiInsightsLoading
                    ? "Generating..."
                    : "Generate Security Insights"}
                </button>

              </div>

              <div className="security-card">

                <div className="security-shield">
                  ✓
                </div>

                <h2>
                  AI Security Monitoring
                </h2>

                <p>
                  Gemma 3 analyzes recent activity and identifies
                  potentially suspicious security patterns.
                </p>

              </div>

            </div>

            {aiAnalysis && (
              <div
                className="panel ai-result-panel"
                style={{ marginTop: "18px" }}
              >
                

                <div className="panel-header">
                  <h2>
                    🤖 AI Security Assessment
                  </h2>
                </div>

                                <div
                  className="stats-grid"
                  style={{ marginTop: "18px" }}
                >

                  <div className="stat-card">
                    <div className="stat-icon">
                      !
                    </div>

                    <div>
                      <span>Risk Level</span>
                      <strong>
                        {getAiSection("Risk Level")}
                      </strong>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      #
                    </div>

                    <div>
                      <span>Risk Score</span>
                      <strong>
                        {getAiSection("Risk Score")}
                        <small>/100</small>
                      </strong>
                    </div>
                  </div>

                </div>

                <div style={{ marginTop: "20px" }}>

                  <span
                    style={{
                      display: "block",
                      color: "var(--text)",
                      fontSize: "11px",
                      fontWeight: "900",
                      marginBottom: "6px",
                    }}
                  >
                    REASON
                  </span>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--muted)",
                      fontSize: "13px",
                      lineHeight: "1.7",
                    }}
                  >
                    {getAiSection("Reason")}
                  </p>

                </div>

                <div style={{ marginTop: "20px" }}>

                  <span
                    style={{
                      display: "block",
                      color: "var(--text)",
                      fontSize: "11px",
                      fontWeight: "900",
                      marginBottom: "6px",
                    }}
                  >
                    RECOMMENDATION
                  </span>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--text)",
                      fontSize: "13px",
                      lineHeight: "1.7",
                    }}
                  >
                    {getAiSection("Recommendation")}
                  </p>

                </div>

              </div>
            )}
            {aiInsights && (
  <div
    className="panel ai-result-panel"
    style={{ marginTop: "18px" }}
  >

    <div className="panel-header">
      <h2>
        📊 AI Security Insights
      </h2>
    </div>

    <div style={{ marginTop: "20px" }}>

      <span
        style={{
          display: "block",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: "900",
          marginBottom: "6px",
        }}
      >
        SECURITY SUMMARY
      </span>

      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        {getAiInsightSection("Security Summary")}
      </p>

    </div>

    <div style={{ marginTop: "20px" }}>

      <span
        style={{
          display: "block",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: "900",
          marginBottom: "6px",
        }}
      >
        ACTIVITY INSIGHTS
      </span>

      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        {getAiInsightSection("Activity Insights")}
      </p>

    </div>

    <div style={{ marginTop: "20px" }}>

      <span
        style={{
          display: "block",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: "900",
          marginBottom: "6px",
        }}
      >
        STORAGE AND FILE USAGE
      </span>

      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        {getAiInsightSection("Storage and File Usage")}
      </p>

    </div>

    <div style={{ marginTop: "20px" }}>

      <span
        style={{
          display: "block",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: "900",
          marginBottom: "6px",
        }}
      >
        SUSPICIOUS PATTERNS
      </span>

      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        {getAiInsightSection("Suspicious Patterns")}
      </p>

    </div>

    <div style={{ marginTop: "20px" }}>

      <span
        style={{
          display: "block",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: "900",
          marginBottom: "6px",
        }}
      >
        RECOMMENDATIONS
      </span>

      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        {getAiInsightSection("Recommendations")}
      </p>

    </div>

  </div>
)}

          </div>
        )}
        
        

            
        {/* ===================================================
    ACTIVITY / AUDIT LOG
    =================================================== */}

{page === "activity" && (
  <div className="content-page">

    <div className="page-heading">
      <div>
        <span className="eyebrow">
          SECURITY & AUDIT
        </span>

        <h1>
          Activity
        </h1>

        <p>
          View your recent account and file activity.
        </p>
      </div>
    </div>


    <div className="security-card activity-security-card">

      <div className="security-shield">
        {securityStatus?.suspicious
          ? "!"
          : "✓"}
      </div>

      <span className="eyebrow">
        SECURITY MONITORING
      </span>

      <h2>
        {securityStatus?.suspicious
          ? "Suspicious activity detected"
          : "No suspicious activity detected"}
      </h2>

      <p>
        {securityStatus
          ? securityStatus.message
          : "Checking your recent account activity..."}
      </p>

      {securityStatus && (
        <div className="security-status">
          <span></span>

          {securityStatus.failed_login_count} failed login attempt(s)
          in the last{" "}
          {securityStatus.time_window_minutes} minutes
        </div>
      )}

    </div>


    <div className="activity-filters">

      {[
        "ALL",
        "UPLOADS",
        "DOWNLOADS",
        "SHARES",
        "SECURITY",
      ].map((filter) => (
        <button
          key={filter}
          className={
            reportFilter === filter
              ? "activity-filter-button active"
              : "activity-filter-button"
          }
          onClick={() =>
            setReportFilter(filter)
          }
        >
          {filter}
        </button>
      ))}

    </div>


    <div className="activity-list">

      {(() => {
        console.log(
              "ACTIVITY ACTIONS:",
              activities.map((activity) => activity.action)
            );

        const filteredActivities =
          activities.filter((activity) => {
            

            if (reportFilter === "ALL") {
              return true;
            }

            if (reportFilter === "UPLOADS") {
              return (
                activity.action ===
                "FILE_UPLOADED"
              );
            }

            if (reportFilter === "DOWNLOADS") {
              return (
                activity.action ===
                  "FILE_DOWNLOADED" ||
                activity.action ===
                  "TEMPORARY_LINK_DOWNLOADED"
              );
            }

            if (reportFilter === "SHARES") {
              return (
                activity.action === "FILE_SHARED" ||
                activity.action === "PERMISSION_CHANGED" ||
                activity.action === "SHARE_REVOKED" ||
                activity.action === "TEMPORARY_LINK_CREATED"
              );
            }

            if (reportFilter === "SECURITY") {
              return (
                activity.action ===
                  "LOGIN_SUCCESS" ||
                activity.action ===
                  "LOGIN_FAILED"
              );
            }

            return true;
          });

        if (filteredActivities.length === 0) {
          return (
            <div className="empty-state">
              <div className="empty-icon">
                ◷
              </div>

              <h3>
                No activity found
              </h3>

              <p>
                No activity matches the selected report filter.
              </p>
            </div>
          );
        }

        return filteredActivities.map(
          (activity) => (
            <div
              className="activity-item"
              key={activity.id}
            >

              <div className="activity-icon">
                ◷
              </div>

              <div className="activity-details">

                <strong>
                  {activity.action}
                </strong>

                {activity.filename && (
                  <p>
                    File: {activity.filename}
                  </p>
                )}

                {activity.details && (
                  <p>
                    {activity.details}
                  </p>
                )}

                <small>
                  {activity.created_at
                    ? (() => {
                        const timestamp = activity.created_at;

                        const utcTimestamp = timestamp.endsWith("Z")
                          ? timestamp
                          : timestamp + "Z";

                        const date = new Date(utcTimestamp);

                        return new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }).format(date);
                      })()
                    : ""}
                </small>
                     

              </div>

            </div>
          )
        );

      })()}

    </div>

  </div>
)}
      



{page === "analytics" && (
  <div className="content-page">
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          REPORTING
        </span>

        <h1>
          Analytics
        </h1>

        <p>
          Monitor your TrustShare usage and activity.
        </p>
      </div>
    </div>

    {!analytics ? (
      <div className="empty-state">
        <h3>
          Loading analytics...
        </h3>
      </div>
    ) : (
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            ▣
          </div>

          <div>
            <span>
              File uploads
            </span>

            <strong>
              {analytics.total_uploads}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ↓
          </div>

          <div>
            <span>
              Downloads
            </span>

            <strong>
              {analytics.total_downloads}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ⇄
          </div>

          <div>
            <span>
              Shares
            </span>

            <strong>
              {analytics.total_shares}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ×
          </div>

          <div>
            <span>
              Deletes
            </span>

            <strong>
              {analytics.total_deletes}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ◷
          </div>

          <div>
            <span>
              Total activity
            </span>

            <strong>
              {analytics.total_activities}
            </strong>
          </div>
        </div>
        <div className="stat-card">
  <div className="stat-icon">▤</div>
  <div>
    <span>Storage used</span>
    <strong>
      {analytics.storage_used_bytes
        ? `${(
            analytics.storage_used_bytes /
            (1024 * 1024)
          ).toFixed(2)} MB`
        : "0 MB"}
    </strong>
  </div>
</div>

<div className="stat-card">
  <div className="stat-icon">▣</div>
  <div>
    <span>Stored files</span>
    <strong>
      {analytics.stored_file_count}
    </strong>
  </div>
</div>

      </div>
    )}
  </div>
)}
      
            
        


        {/* MY FILES */}

        {page === "files" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  WORKSPACE
                </span>

                <h1>
                  My Files
                </h1>

                <p>
                  Manage the files stored in your workspace.
                </p>
              </div>

              <button
                className="primary-action"
                onClick={() =>
                  setPage("upload")
                }
              >
                + Upload file
              </button>
            </div>

            <div className="files-container">
              {myFiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    ▣
                  </div>

                  <h2>
                    No files yet
                  </h2>

                  <p>
                    Upload your first file to get started.
                  </p>
                </div>
              ) : (
                myFiles.map(
                  (file, index) => (
                    <div
                      className="real-file-card"
                      key={index}
                    >
                      <div className="file-type-icon">
                        FILE
                      </div>

                      <div className="file-details">
                        <strong>
                          {file}
                        </strong>

                        <span>
                          Stored securely in your workspace
                        </span>
                      </div>

                      <div className="file-actions">
                        <button
                          className="small-button"
                          onClick={() =>
                            openSharePage(
                              file
                            )
                          }
                        >
                          Share
                        </button>
                        {["write", "read_write"].includes(
                          file.permission
                        ) && (
                          <label
                            className="small-button"
                            style={{ cursor: "pointer" }}
                          >
                            Update

                            <input
                              type="file"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const selected =
                                  e.target.files?.[0];

                                if (!selected) return;

                                setUpdateShareId(file.id);
                                setUpdateFile(selected);

                                handleUpdateSharedFile(
                                  file.id,
                                  filename
                                );
                              }}
                            />
                          </label>
                        )}

                        <button
                          className="small-button"
                          onClick={() =>
                            handleDownload(
                              file
                            )
                          }
                        >
                          Download
                        </button>

                        <button
                          className="small-delete"
                          onClick={() =>
                            handleDelete(
                              file
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {message && (
              <div className="dashboard-message">
                {message}
              </div>
            )}
          </div>
        )}

        {/* UPLOAD */}

        {page === "upload" && (
          <div className="content-page narrow-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  WORKSPACE
                </span>

                <h1>
                  Upload a file
                </h1>

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
                    if (
                      e.target.files?.length
                    ) {
                      setSelectedFile(
                        e.target.files[0]
                      );
                    }
                  }}
                />

                <div className="upload-icon-large">
                  ↑
                </div>

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
                onClick={
                  handleUpload
                }
                disabled={loading}
              >
                {loading
                  ? "Uploading..."
                  : "Upload securely"}
              </button>

              <button
                className="text-button"
                onClick={() => {
                  setPage(
                    "dashboard"
                  );
                  setMessage("");
                }}
              >
                ← Back to dashboard
              </button>
            </div>
          </div>
        )}

        {/* SHARE */}

        {page === "share" && (
          <div className="content-page narrow-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  COLLABORATION
                </span>

                <h1>
                  Share a file
                </h1>

                <p>
                  Send a file securely to one or more people.
                </p>
              </div>
            </div>

            <div className="share-card">
              {/* STEP 1 */}

              <div className="share-step">
                <span className="step-number">
                  1
                </span>

                <div>
                  <strong>
                    Select a file
                  </strong>

                  <p>
                    Choose the document you want to share.
                  </p>
                </div>
              </div>

              <select
                className="input"
                value={shareFile}
                onChange={(e) =>
                  setShareFile(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select a file
                </option>

                {myFiles.map(
                  (file, index) => (
                    <option
                      key={index}
                      value={file}
                    >
                      {file}
                    </option>
                  )
                )}
              </select>

              {/* STEP 2 */}

              <div className="share-step">
                <span className="step-number">
                  2
                </span>

                <div>
                  <strong>
                    Add recipients
                  </strong>

                  <p>
                    You can add multiple TrustShare email addresses.
                  </p>
                </div>
              </div>

              {/* EMAIL INPUT */}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <input
                  className="input"
                  type="email"
                  placeholder="recipient@example.com"
                  value={
                    recipientEmail
                  }
                  onChange={(e) =>
                    setRecipientEmail(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />

                <button
                  type="button"
                  className="small-button"
                  onClick={
                    handleAddEmail
                  }
                >
                  + Add email
                </button>
              </div>

              {/* ADDED EMAIL BOXES */}

              {recipientEmails.length >
                0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop:
                      "16px",
                    marginBottom:
                      "16px",
                  }}
                >
                  {recipientEmails.map(
                    (
                      addedEmail,
                      index
                    ) => (
                      <div
                        key={index}
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "8px",
                          padding:
                            "8px 12px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #d1d5db",
                        }}
                      >
                        <span>
                          {
                            addedEmail
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveEmail(
                              addedEmail
                            )
                          }
                          style={{
                            border:
                              "none",
                            background:
                              "transparent",
                            cursor:
                              "pointer",
                            fontWeight:
                              "bold",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
              {/* PERMISSION */}

              <label style={{ marginTop: "16px" }}>
                Permission
              </label>

              <select
                className="input"
                value={permission}
                onChange={(e) =>
                  setPermission(e.target.value)
                }
              >
                <option value="read">
                  Read
                </option>

                <option value="write">
                  Write
                </option>

                <option value="read_write">
                  Read & Write
                </option>
              </select>

              <div className="trust-note">
                <span>
                  ✓
                </span>

                <div>
                  <strong>
                    Share with confidence
                  </strong>

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
                onClick={
                  handleShare
                }
                disabled={loading}
              >
                {loading
                  ? "Sharing..."
                  : "Share securely"}
              </button>
              {/* TEMPORARY SECURE LINK */}

              <div className="temporary-share-section">
                <div className="temporary-share-header">
                  <h3>Temporary Secure Link</h3>

                  <p>
                    Create a secure link that automatically expires.
                  </p>
                </div>

                <label>
                  File
                </label>

                <select
                  className="input"
                  value={temporaryShareFile}
                  onChange={(e) =>
                    setTemporaryShareFile(e.target.value)
                  }
                >
                  <option value="">
                    Select a file
                  </option>

                  {myFiles.map((file, index) => {
                    const filename =
                      file.filename || file;

                    return (
                      <option
                        key={file.id || index}
                        value={filename}
                      >
                        {filename}
                      </option>
                    );
                  })}
                </select>

                <label>
                    Expires in (hours)
                  </label>

                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={temporaryExpiryHours}
                    onChange={(e) =>
                      setTemporaryExpiryHours(e.target.value)
                    }
                  />

                <button
                  className="auth-button"
                  onClick={handleTemporaryShare}
                  disabled={loading}
                >
                  {loading
                    ? "Creating..."
                    : "Create temporary link"}
                </button>

                {temporaryShareResult && (
                  <div className="temporary-share-result">
                    <div className="temporary-result-title">
                      <span>✓</span>

                      <div>
                        <strong>
                          Temporary link created
                        </strong>

                        <p>
                          Your secure temporary link is ready.
                        </p>
                      </div>
                    </div>

                    <div className="temporary-result-details">
                      <div className="temporary-detail-row">
                        <span>Expires</span>

                        <strong>
                          {temporaryShareResult.expires_at}
                        </strong>
                      </div>

                      <div className="temporary-detail-row">
                        <span>Token</span>

                        <strong className="temporary-token">
                          {temporaryShareResult.share_token}
                        </strong>
                      </div>

                      <div className="temporary-detail-row">
                        <span>Link</span>

                        <a
                          href={`${API}/download/shared/${encodeURIComponent(
                            temporaryShareResult.share_token
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open temporary link
                        </a>
                      </div>
                    </div>

                    <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "12px",
  }}
>
  <button
    type="button"
    className="auth-button"
    onClick={handleCopyTemporaryLink}
  >
    Copy link
  </button>

  <button
    className="auth-button"
    onClick={handleTemporaryDownload}
    disabled={loading}
  >
    {loading
      ? "Downloading..."
      : "Download Temporary File"}
  </button>
</div>
                  </div>
                )}
              </div>

              <button
                className="text-button"
                onClick={() => {
                  setPage(
                    "dashboard"
                  );
                  setMessage("");
                }}
              >
                ← Back to dashboard
              </button>
            </div>
          </div>
        )}

        {/* SHARED WITH ME */}

        {page === "shared-files" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  COLLABORATION
                </span>

                <h1>
                  Shared With Me
                </h1>

                <p>
                  Files that other TrustShare users have shared with you.
                </p>
              </div>
            </div>

            <div className="files-container">
              {sharedWithMeFiles.length ===
              0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    ⇄
                  </div>

                  <h2>
                    Nothing shared yet
                  </h2>

                  <p>
                    Files shared with your account will appear here.
                  </p>
                </div>
              ) : (
                sharedWithMeFiles.map(
                  (file, index) => {
                    const filename =
                      file.filename ||
                      file;

                    return (
                      <div
                        className="real-file-card"
                        key={
                          file.id ||
                          index
                        }
                      >
                        <div className="file-type-icon">
                          FILE
                        </div>

                        <div className="file-details">
                          <strong>
                            {filename}
                          </strong>

                          <span>
                            Shared with your TrustShare account
                          </span>
                        </div>
                        <div className="file-actions">
                        <button
                          className="small-button"
                          onClick={() =>
                            openSharePage()
                          }
                        >
                          Share
                        </button>

                        {["write", "read_write"].includes(
                          file.permission
                        ) && (
                          <label
                            className="small-button"
                            style={{
                              cursor: "pointer"
                            }}
                          >
                            Update

                            <input
                              type="file"
                              style={{
                                display: "none"
                              }}
                              onChange={(e) => {
                                const selected =
                                  e.target.files?.[0];

                                if (!selected) return;

                                setUpdateShareId(
                                  file.id
                                );

                                setUpdateFile(
                                  selected
                                );

                                handleUpdateSharedFile(
                                  file.id,
                                  filename
                                );
                              }}
                            />
                          </label>
                        )}

                        {["read", "read_write"].includes(
                          file.permission
                        ) && (
                          <button
                            className="small-button"
                            onClick={() =>
                              handleDownload(
                                filename
                              )
                            }
                          >
                            Download
                          </button>
                        )}

                        <button
                          className="small-delete"
                          onClick={() =>
                            handleRemoveSharedWithMe(
                              file.id,
                              filename
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                        
                           
                      </div>
                    );
                  }
                )
              )}
            </div>

            {message && (
              <div className="dashboard-message">
                {message}
              </div>
            )}
          </div>
        )}

        {/* SHARED BY ME */}

        {page === "shared-by-me" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  COLLABORATION
                </span>

                <h1>
                  Shared By Me
                </h1>

                <p>
                  Files that you have shared with other TrustShare users.
                </p>
              </div>
            </div>

            <div className="files-container">
              {sharedByMeFiles.length ===
              0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    ↗
                  </div>

                  <h2>
                    No files shared yet
                  </h2>

                  <p>
                    Files you share with other users will appear here.
                  </p>
                </div>
              ) : (
                sharedByMeFiles.map(
                  (file, index) => {
                    const filename =
                      file.filename ||
                      file;

                    return (
                      <div
                        className="real-file-card"
                        key={
                          file.id ||
                          index
                        }
                      >
                        <div className="file-type-icon">
                          FILE
                        </div>

                        <div className="file-details">
                          <strong>
                            {filename}
                          </strong>

                          <span>
                            Shared with:{" "}
                            {
                              file.recipient_email ||
                              "Recipient"
                            }
                          </span>
                        </div>

                        <div className="file-actions">
                          <button
                            className="small-button"
                            onClick={() =>
                              openSharePage(
                                filename
                              )
                            }
                          >
                            Share
                          </button>

                          <button
                            className="small-button"
                            onClick={() =>
                              handleDownload(
                                filename
                              )
                            }
                          >
                            Download
                          </button>

                          <button
                            className="small-delete"
                            onClick={() =>
                              handleRemoveSharedByMe(
                                file.id,
                                filename
                              )
                            }
                          >
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {message && (
              <div className="dashboard-message">
                {message}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;