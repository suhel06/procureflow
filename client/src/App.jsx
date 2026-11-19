import { apiUrl } from "./api";
import { useState, useEffect } from "react";
import PurchaseRequests from "./components/PurchaseRequests";
import AIDecisions from "./components/AIDecisions";
import PurchaseOrders from "./PurchaseOrders";
import Contracts from "./Contracts";
import Suppliers from "./Suppliers";
import SettingsPage from "./SettingsPage";

import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  FileCheck,
  Users,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Menu,
  X,
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  Activity
} from "lucide-react";

import "./App.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Purchase Requests", icon: FileText },
  { label: "AI Decisions", icon: Activity },
  { label: "Purchase Orders", icon: ShoppingCart },
  { label: "Contracts", icon: FileCheck },
  { label: "Suppliers", icon: Users },
];



const decisions = [
  {
    id: "REQ-1",
    item: "ITM-1033",
    plant: "PUN1",
    decision: "PO",
    route: "SPOT_PO",
    supplier: "S020",
    value: "\u20B91,31,675.78",
    status: "Approved"
  },
  {
    id: "REQ-2",
    item: "ITM-1038",
    plant: "CHK1",
    decision: "PO",
    route: "SPOT_PO",
    supplier: "S023",
    value: "\u20B91,39,672.80",
    status: "Approved"
  },
  {
    id: "REQ-3",
    item: "ITM-1006",
    plant: "PUN1",
    decision: "SOURCING",
    route: "RFQ",
    supplier: "â€”",
    value: "\u20B980,300.00",
    status: "Sourcing"
  },
  {
    id: "REQ-4",
    item: "ITM-1033",
    plant: "CHK1",
    decision: "SOURCING",
    route: "RFQ",
    supplier: "â€”",
    value: "\u20B93,95,027.34",
    status: "Sourcing"
  },
  {
    id: "REQ-5",
    item: "ITM-1044",
    plant: "PUN1",
    decision: "PO",
    route: "SPOT_PO",
    supplier: "S027",
    value: "\u20B91,59,118.30",
    status: "Approved"
  }
];

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
const [assessmentRunning, setAssessmentRunning] = useState(false);
 
  // API states
  const [dashboardData, setDashboardData] = useState(null);
  const [decisionsData, setDecisionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard and decisions from backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryResponse, decisionsResponse] =
          await Promise.all([
            fetch(apiUrl("/api/assessment/summary")),
            fetch(apiUrl("/api/assessment/decisions"))
          ]);

        if (!summaryResponse.ok || !decisionsResponse.ok) {
          throw new Error("Failed to fetch assessment data");
        }

        const summaryResult = await summaryResponse.json();
        const decisionsResult = await decisionsResponse.json();

        setDashboardData(summaryResult);
        setDecisionsData(decisionsResult.decisions || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Dynamic dashboard metrics
  const summary = dashboardData?.summary;

const decisionBreakdown = dashboardData?.decision_breakdown || {};

const decisionTotal = Object.values(decisionBreakdown).reduce(
  (sum, count) => sum + Number(count || 0),
  0
);

const poCount = decisionBreakdown.PO || 0;
const sourcingCount = decisionBreakdown.SOURCING || 0;
const reviewCount = decisionBreakdown.MANUAL_REVIEW || 0;

const poPercentage = decisionTotal
  ? (poCount / decisionTotal) * 100
  : 0;

const sourcingPercentage = decisionTotal
  ? ((poCount + sourcingCount) / decisionTotal) * 100
  : 0;

  // Dynamic procurement routes
  const routeColors = {
    SPOT_PO: "#3B82F6",
    RFQ: "#8B5CF6",
    CONTRACT_PO: "#10B981",
    EMERGENCY_PO: "#F59E0B",
    CAPEX_SOURCING: "#EC4899",
    RFP: "#6366F1",
    NEW_ITEM_SOURCING: "#14B8A6",
    INVALID_PLANT: "#EF4444"
  };

  const routeLabels = {
    SPOT_PO: "Spot Purchase Order",
    RFQ: "RFQ",
    CONTRACT_PO: "Contract PO",
    EMERGENCY_PO: "Emergency PO",
    CAPEX_SOURCING: "Capex Sourcing",
    RFP: "RFP",
    NEW_ITEM_SOURCING: "New Item Sourcing",
    INVALID_PLANT: "Invalid Plant"
  };

  const routes = Object.entries(
    dashboardData?.route_breakdown || {}
  ).map(([key, count]) => ({
    name: routeLabels[key] || key,
    count,
    color: routeColors[key] || "#64748B"
  }));

  const formatCrore = (value) =>
    `\u20B9${(value / 10000000).toFixed(2)} Cr`;

  const metrics = [
    {
      label: "Total PR Lines",
      value: "186",
      change: "186 processed",
      icon: FileText,
      color: "blue"
    },
    {
      label: "Requirements",
      value: summary?.total_decisions ?? "â€”",
      change: "Evaluated requirements",
      icon: Package,
      color: "purple"
    },
    {
      label: "Draft Purchase Orders",
      value: summary?.total_purchase_orders ?? "â€”",
      change: `${summary?.total_po_requirements ?? 0} PO requirements`,
      icon: ShoppingCart,
      color: "green"
    },
    {
      label: "Total PO Value",
      value: summary
        ? formatCrore(summary.total_po_value)
        : "â€”",
      change: summary
        ? `\u20B9${summary.total_po_value.toLocaleString("en-IN")}`
        : "Loading...",
      icon: TrendingUp,
      color: "orange"
    }
  ];

  // Convert actual API decisions into dashboard table format
  const filteredDecisions = decisionsData.map(row => ({
    id: row.group_id,
    item: row.item_code,
    plant: row.plant,
    decision: row.decision,
    route: row.route,
    supplier: row.supplier_name || row.supplier_id || "â€”",
    value: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(row.requirement_value || 0),
    status: row.decision === "PO" ? "Approved" :
      row.decision === "SOURCING" ? "Sourcing" : "Review"
  })).filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );




const handleExportReport = async () => {
  try {
    const endpoints = [
      ["summary", apiUrl("/api/assessment/summary")],
      ["decisions", apiUrl("/api/assessment/decisions")],
      ["purchase_orders", apiUrl("/api/assessment/purchase-orders")],
      ["purchase_requests", apiUrl("/api/purchase-requests")],
      ["contracts", apiUrl("/api/contracts")],
      ["suppliers", apiUrl("/api/suppliers")]
    ];

    const report = {};

    for (const [key, url] of endpoints) {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${key}`);
      }

      report[key] = await response.json();
    }

    report.exported_at = new Date().toISOString();
    report.application = "ProcureFlow";

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: "application/json" }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `ProcureFlow_Report_${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    alert("ProcureFlow report exported successfully!");

  } catch (error) {
    console.error("Export error:", error);
    alert(`Export failed: ${error.message}`);
  }
};


// NEW ASSESSMENT FUNCTION
const handleNewAssessment = async () => {
  if (assessmentRunning) return;

  try {
    setAssessmentRunning(true);

    const response = await fetch(
      apiUrl("/api/assessment/run"),
      {
        method: "POST"
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.details || result.message || "Assessment failed"
      );
    }

    alert(
      `Assessment completed successfully!\n\n` +
      `Total decisions: ${result.summary.total_decisions}\n` +
      `Draft purchase orders: ${result.summary.total_purchase_orders}\n` +
      `Decision errors: ${result.summary.decision_errors}`
    );

    window.location.reload();

  } catch (error) {
    console.error("Assessment error:", error);
    alert(`Assessment failed: ${error.message}`);

  } finally {
    setAssessmentRunning(false);
  }
};



  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Package size={23} />
          </div>
          <div>
            <h2>ProcureFlow</h2>
            <span>INTELLIGENT PROCUREMENT</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-label">WORKSPACE</span>
          <button className="workspace-button">
            <div className="workspace-avatar">C</div>
            <span>Corvo Engineering</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <nav className="navigation">
          <span className="nav-label">MAIN MENU</span>

          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Purchase Requests" && (
                <span className="nav-count">186</span>
              )}
            </button>
          ))}

          <span className="nav-label settings-label">PREFERENCES</span>

          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-heading">
              <span className="system-dot" />
              System operational
            </div>
            <p>Assessment engine running normally.</p>
            <span className="system-version">Policy v5.0</span>
          </div>

          <div className="profile">
            <div className="profile-avatar">SK</div>
            <div className="profile-info">
              <strong>Procurement Admin</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                placeholder="Search anything..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <kbd>âŒ˜ K</kbd>
            </div>

            <button className="icon-button notification-button">
              <Bell size={19} />
              <span />
            </button>

            <div className="topbar-profile">SK</div>
          </div>
        </header>

        <div className="page-content">
          {(activePage === "Overview" || activePage === "Settings") && (
  <section className="welcome-section"> 
            <div>
              <div className="eyebrow">
                <span className="live-dot" />
                PROCUREMENT INTELLIGENCE
              </div>
              <h1>{activePage}</h1>
              <p>
                Monitor procurement activity, decisions and sourcing
                performance across your organization.
              </p>
            </div>

            <div className="header-actions">
              <button
  className="secondary-button"
  onClick={handleExportReport}
>
  <Download size={16} />
  Export report
</button>
              
<button
  className="primary-button"
  onClick={handleNewAssessment}
  disabled={assessmentRunning}
>
  <Plus size={17} />
  {assessmentRunning ? "Running assessment..." : "New assessment"}
</button>

            </div>
          </section>
                 )}{activePage === "Purchase Requests" ? (
        <PurchaseRequests />
      ) : activePage === "AI Decisions" ? (
        <AIDecisions />
      ) : activePage === "Purchase Orders" ? (
        <PurchaseOrders />
      ) : activePage === "Contracts" ? (
        <Contracts />
      ) : activePage === "Suppliers" ? (
         <Suppliers />
      ) : activePage === "Settings" ? (
         <SettingsPage />
      ) : (
        <>
          <section className="assessment-banner">
            <div className="banner-icon">
              <CheckCircle2 size={23} />
            </div>
            <div className="banner-text">
              <strong>Latest assessment completed successfully</strong>
              <span>
                186 PR lines processed \u00B7 151 requirements evaluated \u00B7
                Zero decision errors
              </span>
            </div>
            <div className="banner-right">
              <span className="banner-status">ALL SYSTEMS GO</span>
              <span>Policy version 5.0</span>
            </div>
          </section>

          <section className="metrics-grid">
            {metrics.map(({ label, value, change, icon: Icon, color }) => (
              <article className="metric-card" key={label}>
                <div className="metric-top">
                  <span>{label}</span>
                  <div className={`metric-icon ${color}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <h2>{value}</h2>
                <div className="metric-bottom">
                  <span className="metric-change">{change}</span>
                  <ArrowUpRight size={16} />
                </div>
              </article>
            ))}
          </section>

          <section className="analytics-grid">
            
<article className="panel decision-panel">
  <div className="panel-heading">
    <div>
      <h3>Decision overview</h3>
      <p>
        Breakdown of {decisionTotal} procurement requirements
      </p>
    </div>
    <button className="period-button">
      All time <ChevronDown size={15} />
    </button>
  </div>

  <div className="decision-chart">
    <div
      className="donut-chart"
      style={{
        background: `conic-gradient(
          #3B82F6 0% ${poPercentage}%,
          #8B5CF6 ${poPercentage}% ${sourcingPercentage}%,
          #F59E0B ${sourcingPercentage}% 100%
        )`
      }}
    >
      <div className="donut-center">
        <strong>{decisionTotal}</strong>
        <span>Requirements</span>
      </div>
    </div>

    <div className="decision-legend">
      <div>
        <span className="legend-dot po-dot" />
        <span>Purchase Order</span>
        <strong>{poCount}</strong>
      </div>

      <div>
        <span className="legend-dot sourcing-dot" />
        <span>Sourcing</span>
        <strong>{sourcingCount}</strong>
      </div>

      <div>
        <span className="legend-dot review-dot" />
        <span>Manual Review</span>
        <strong>{reviewCount}</strong>
      </div>
    </div>
  </div>
</article>


            <article className="panel route-panel">
              <div className="panel-heading">
                <div>
                  <h3>Procurement routes</h3>
                  <p>How requirements are being processed</p>
                </div>
                <button className="more-button">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="route-list">
                {routes.map(route => (
                  <div className="route-row" key={route.name}>
                    <div className="route-info">
                      <span>{route.name}</span>
                      <strong>{route.count}</strong>
                    </div>
                    <div className="route-track">
                      <div
                        className="route-fill"
                        style={{
                          width: `${(route.count / Math.max(
  1,
  routes.reduce((sum, route) => sum + route.count, 0)
)) * 100}%`,
                          background: route.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel table-panel">
              <div className="panel-heading table-heading">
                <div>
                  <h3>Recent procurement decisions</h3>
                  <p>Latest evaluated requirements</p>
                </div>
                <button className="secondary-button small-button">
                  View all <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Item code</th>
                      <th>Plant</th>
                      <th>Route</th>
                      <th>Supplier</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecisions.map(row => (
                      <tr key={row.id}>
                        <td className="requirement-id">{row.id}</td>
                        <td>{row.item}</td>
                        <td>{row.plant}</td>
                        <td>
                          <span className="route-tag">{row.route}</span>
                        </td>
                        <td>{row.supplier}</td>
                        <td className="value-cell">{row.value}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              row.status === "Approved"
                                ? "status-approved"
                                : "status-sourcing"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredDecisions.length === 0 && (
                  <div className="empty-state">
                    No matching decisions found.
                  </div>
                )}
              </div>

              <div className="table-footer">
                <span>Showing {filteredDecisions.length} sample records</span>
                <button onClick={() => setSearch("")}>Clear search</button>
              </div>
            </article>

            <article className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h3>Assessment health</h3>
                  <p>Latest execution status</p>
                </div>
                <Activity size={19} className="activity-icon" />
              </div>

              <div className="health-score">
                <div className="health-number">
                  <strong>100%</strong>
                  <span>Technical validation</span>
                </div>
                <div className="health-bar">
                  <div />
                </div>
              </div>

              <div className="health-items">
                <div>
                  <CheckCircle2 size={17} />
                  <span>Decision count</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <CheckCircle2 size={17} />
                  <span>PO coverage</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <CheckCircle2 size={17} />
                  <span>Value reconciliation</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <CheckCircle2 size={17} />
                  <span>Unique PO numbers</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <CheckCircle2 size={17} />
                  <span>Decision errors</span>
                  <strong>Zero</strong>
                </div>
              </div>

              <div className="policy-info">
                <div className="policy-icon">
                  <FileCheck size={18} />
                </div>
                <div>
                  <strong>Active procurement policy</strong>
                  <span>CORVO-PROC-POL-04 \u00B7 Version 5.0</span>
                </div>
                <CheckCircle2 size={17} />
              </div>
            </article>
          </section>

          <footer className="footer">
            <span>Â© 2026 ProcureFlow \u00B7 Intelligent Procurement Platform</span>
            <span>Powered by Procurement Decision Engine</span>
          </footer>
            </>
)}
        </div>
      </main>
    </div>
  );
}

export default App;

