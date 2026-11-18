
import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  workspaceName: "Corvo Engineering",
  assessmentAlerts: true,
  procurementAlerts: true,
  weeklySummary: false
};

function loadSettings() {
  try {
    const saved = localStorage.getItem("procureflow-settings");
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then(response => {
        setBackendStatus(response.ok ? "Connected" : "Unavailable");
      })
      .catch(() => setBackendStatus("Unavailable"));
  }, []);

  const updateSetting = (key, value) => {
    setSettings(previous => ({
      ...previous,
      [key]: value
    }));
    setSavedMessage("");
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(
        "procureflow-settings",
        JSON.stringify(settings)
      );
      setSavedMessage("Preferences saved successfully in this browser.");
    } catch {
      setSavedMessage("Unable to save preferences in this browser.");
    }
  };

  const card = {
    background: "#111e32",
    border: "1px solid #263750",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    color: "#e7edf8"
  };

  const muted = {
    color: "#8da5c5",
    fontSize: 13
  };

  const toggleRow = (label, description, key) => (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      padding: "17px 0",
      borderBottom: "1px solid #263750"
    }}>
      <div>
        <strong>{label}</strong>
        <p style={muted}>{description}</p>
      </div>

      <input
        type="checkbox"
        checked={settings[key]}
        onChange={e => updateSetting(key, e.target.checked)}
        style={{
          width: 19,
          height: 19,
          accentColor: "#14b8a6",
          cursor: "pointer"
        }}
      />
    </div>
  );

  return (
    <div style={{ color: "#e7edf8", marginTop: 25 }}>

      <div style={{ marginBottom: 25 }}>
        <span style={{
          color: "#14b8a6",
          fontSize: 12,
          letterSpacing: 2
        }}>
          SYSTEM CONFIGURATION
        </span>
        <h2 style={{ fontSize: 25, margin: "10px 0" }}>
          Application Settings
        </h2>
        <p style={muted}>
          Manage workspace information, preferences and system status.
        </p>
      </div>

      {/* Workspace */}
      <section style={card}>
        <h3>Workspace Information</h3>
        <p style={muted}>
          Basic information for your procurement workspace.
        </p>

        <label style={{ display: "block", marginTop: 20 }}>
          <span style={muted}>Workspace Name</span>
          <input
            value={settings.workspaceName}
            onChange={e =>
              updateSetting("workspaceName", e.target.value)
            }
            style={{
              display: "block",
              width: "100%",
              maxWidth: 450,
              marginTop: 9,
              padding: 12,
              color: "#e7edf8",
              background: "#1a2940",
              border: "1px solid #344861",
              borderRadius: 8,
              boxSizing: "border-box"
            }}
          />
        </label>

        <div style={{ marginTop: 20 }}>
          <p style={muted}>Administrator</p>
          <strong>Procurement Admin</strong>
        </div>
      </section>

      {/* Policy */}
      <section style={card}>
        <h3>Procurement Policy</h3>
        <p style={muted}>
          Currently active assessment policy.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
          marginTop: 22
        }}>
          <div>
            <p style={muted}>Policy ID</p>
            <strong>CORVO-PROC-POL-04</strong>
          </div>
          <div>
            <p style={muted}>Version</p>
            <strong>5.0</strong>
          </div>
          <div>
            <p style={muted}>Status</p>
            <strong style={{ color: "#2dd4bf" }}>Active</strong>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section style={card}>
        <h3>Interface Preferences</h3>
        <p style={muted}>
          Choose which application notices you prefer to see.
          These preferences are saved locally in this browser.
        </p>

        {toggleRow(
          "Assessment completion",
          "Show your preference for assessment completion notices.",
          "assessmentAlerts"
        )}

        {toggleRow(
          "Procurement alerts",
          "Show your preference for procurement-related alerts.",
          "procurementAlerts"
        )}

        {toggleRow(
          "Weekly summary",
          "Enable your preference for a weekly activity summary.",
          "weeklySummary"
        )}

        <button
          onClick={saveSettings}
          style={{
            marginTop: 22,
            background: "#0f9f89",
            color: "#041b18",
            border: "none",
            borderRadius: 8,
            padding: "12px 22px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Save Preferences
        </button>

        {savedMessage && (
          <p style={{
            color: savedMessage.startsWith("Unable")
              ? "#f87171"
              : "#2dd4bf",
            fontSize: 13,
            marginTop: 12
          }}>
            {savedMessage}
          </p>
        )}
      </section>

      {/* System status */}
      <section style={card}>
        <h3>System Information</h3>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0",
          borderBottom: "1px solid #263750"
        }}>
          <span>Backend API</span>
          <strong style={{
            color: backendStatus === "Connected"
              ? "#2dd4bf"
              : "#fbbf24"
          }}>
            {backendStatus}
          </strong>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 0"
        }}>
          <span>Application</span>
          <strong>ProcureFlow v1.0.0</strong>
        </div>
      </section>

    </div>
  );
}
