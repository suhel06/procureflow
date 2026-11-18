
import { useEffect, useMemo, useState } from "react";
import "./AIDecisions.css";

const PAGE_SIZE = 10;

const formatCurrency = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function AIDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("All");
  const [routeFilter, setRouteFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/assessment/decisions"
        );

        if (!response.ok) {
          throw new Error("Unable to load procurement decisions");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Decision loading failed");
        }

        setDecisions(result.decisions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDecisions();
  }, []);

  const routes = useMemo(
    () => [
      "All",
      ...new Set(decisions.map(d => d.route).filter(Boolean))
    ],
    [decisions]
  );

  const filtered = useMemo(() => {
    return decisions.filter(d => {
      const term = search.toLowerCase();

      const matchesSearch = [
        d.group_id,
        d.item_code,
        d.plant,
        d.supplier_id,
        d.supplier_name,
        d.contract_id,
        d.route,
        d.policy_clause
      ].some(value =>
        String(value || "").toLowerCase().includes(term)
      );

      const matchesDecision =
        decisionFilter === "All" ||
        d.decision === decisionFilter;

      const matchesRoute =
        routeFilter === "All" || d.route === routeFilter;

      return matchesSearch && matchesDecision && matchesRoute;
    });
  }, [decisions, search, decisionFilter, routeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, decisionFilter, routeFilter]);

  const poCount = decisions.filter(d => d.decision === "PO").length;
  const sourcingCount = decisions.filter(
    d => d.decision === "SOURCING"
  ).length;
  const reviewCount = decisions.filter(
    d => d.decision === "MANUAL_REVIEW"
  ).length;

  return (
    <section className="ai-page">
      <div className="ai-heading">
        <div>
          <span className="ai-eyebrow">PROCUREMENT INTELLIGENCE</span>
          <h2>AI Decisions</h2>
          <p>
            Explore policy-driven procurement decisions and
            explainable sourcing recommendations.
          </p>
        </div>
      </div>

      <div className="ai-stats">
        <div className="ai-stat">
          <span>Total Decisions</span>
          <strong>{decisions.length}</strong>
        </div>

        <div className="ai-stat">
          <span>Purchase Orders</span>
          <strong>{poCount}</strong>
        </div>

        <div className="ai-stat">
          <span>Sourcing</span>
          <strong>{sourcingCount}</strong>
        </div>

        <div className="ai-stat">
          <span>Manual Review</span>
          <strong>{reviewCount}</strong>
        </div>
      </div>

      <div className="ai-toolbar">
        <input
          placeholder="Search item, supplier, group ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={decisionFilter}
          onChange={e => setDecisionFilter(e.target.value)}
        >
          <option value="All">All decisions</option>
          <option value="PO">Purchase Order</option>
          <option value="SOURCING">Sourcing</option>
          <option value="MANUAL_REVIEW">Manual Review</option>
        </select>

        <select
          value={routeFilter}
          onChange={e => setRouteFilter(e.target.value)}
        >
          {routes.map(route => (
            <option key={route} value={route}>
              {route === "All" ? "All routes" : route}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="ai-message">Loading AI decisions...</div>
      ) : error ? (
        <div className="ai-error">{error}</div>
      ) : (
        <>
          <div className="ai-table-wrap">
            <table className="ai-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Item Code</th>
                  <th>Plant</th>
                  <th>Quantity</th>
                  <th>Value</th>
                  <th>Decision</th>
                  <th>Route</th>
                  <th>Supplier</th>
                  <th>Policy</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((d, index) => (
                  <tr key={d.group_id || index}>
                    <td className="ai-group">{d.group_id || "—"}</td>
                    <td>{d.item_code || "—"}</td>
                    <td>{d.plant || "—"}</td>
                    <td>{d.total_quantity ?? "—"}</td>
                    <td>{formatCurrency(d.requirement_value)}</td>
                    <td>
                      <span className={`ai-decision ${
                        d.decision === "PO"
                          ? "ai-po"
                          : d.decision === "SOURCING"
                          ? "ai-sourcing"
                          : "ai-review"
                      }`}>
                        {d.decision || "—"}
                      </span>
                    </td>
                    <td>{d.route || "—"}</td>
                    <td>
                      {d.supplier_name ||
                        d.suppliers?.[0]?.supplier_name ||
                        "—"}
                    </td>
                    <td>{d.policy_clause || "—"}</td>
                  </tr>
                ))}

                {visible.length === 0 && (
                  <tr>
                    <td colSpan="9" className="ai-empty">
                      No matching decisions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ai-pagination">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
              {" - "}
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
              {" of "}
              {filtered.length} decisions
            </span>

            <div>
              <button
                disabled={safePage === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>

              <span>Page {safePage} of {totalPages}</span>

              <button
                disabled={safePage === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
