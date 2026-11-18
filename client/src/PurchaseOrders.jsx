
import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:3000/api/assessment/purchase-orders";

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const styles = {
  page: { color: "#e7edf8", width: "100%" },
  heading: { marginBottom: 25 },
  muted: { color: "#8da5c5", fontSize: 13 },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 16,
    margin: "24px 0"
  },
  card: {
    background: "#111e32",
    border: "1px solid #263750",
    borderRadius: 12,
    padding: 20
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18
  },
  input: {
    background: "#111e32",
    color: "#e7edf8",
    border: "1px solid #293b55",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 14,
    flex: 1,
    minWidth: 180
  },
  tableWrap: {
    overflowX: "auto",
    background: "#111e32",
    border: "1px solid #263750",
    borderRadius: 12
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
    minWidth: 850
  },
  th: {
    padding: "16px 13px",
    color: "#8da5c5",
    borderBottom: "1px solid #293b55",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "15px 13px",
    borderBottom: "1px solid #263750"
  },
  button: {
    background: "#173c42",
    color: "#36d6b0",
    border: "1px solid #23645c",
    borderRadius: 7,
    padding: "7px 12px",
    cursor: "pointer"
  }
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [route, setRoute] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const response = await fetch(API);

        if (!response.ok) {
          throw new Error("Unable to load purchase orders.");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Purchase order API failed.");
        }

        if (!cancelled) {
          setOrders(data.purchase_orders || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;

    const handleEscape = event => {
      if (event.key === "Escape") setSelected(null);
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [selected]);

  const filteredOrders = useMemo(() => {
    return orders.filter(po => {
      const text = [
        po.po_number,
        po.supplier_name,
        po.supplier_id,
        po.plant,
        po.route,
        ...(po.pr_numbers || [])
      ].join(" ").toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesRoute = route === "All" || po.route === route;

      return matchesSearch && matchesRoute;
    });
  }, [orders, search, route]);

  const totalValue = orders.reduce(
    (sum, po) => sum + Number(po.total_value || 0),
    0
  );

  const routeOptions = [
    ...new Set(orders.map(po => po.route).filter(Boolean))
  ];

  if (loading) {
    return (
      <div style={{ color: "#8da5c5", padding: 30 }}>
        Loading purchase orders...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 25, color: "#ff7777" }}>
        <h2>Unable to load purchase orders</h2>
        <p>{error}</p>
        <button
          style={styles.button}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div style={{
          ...styles.muted,
          color: "#35d8b3",
          letterSpacing: 2
        }}>
          PROCUREMENT INTELLIGENCE
        </div>

        <h1 style={{ fontSize: 30, margin: "12px 0" }}>
          Purchase Orders
        </h1>

        <p style={styles.muted}>
          View and manage consolidated draft purchase orders.
        </p>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.muted}>Total Draft POs</div>
          <h2>{orders.length}</h2>
        </div>

        <div style={styles.card}>
          <div style={styles.muted}>Total PO Value</div>
          <h2>{money(totalValue)}</h2>
        </div>

        <div style={styles.card}>
          <div style={styles.muted}>Total PR References</div>
          <h2>
            {orders.reduce(
              (sum, po) => sum + Number(po.pr_count || 0),
              0
            )}
          </h2>
        </div>

        <div style={styles.card}>
          <div style={styles.muted}>Suppliers</div>
          <h2>
            {new Set(orders.map(po => po.supplier_id)).size}
          </h2>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          style={styles.input}
          placeholder="Search PO, supplier, plant or PR number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          style={{ ...styles.input, flex: "0 1 220px" }}
          value={route}
          onChange={e => setRoute(e.target.value)}
        >
          <option value="All">All procurement routes</option>
          {routeOptions.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {[
                "PO Number",
                "Supplier",
                "Plant",
                "Route",
                "PR Count",
                "Quantity",
                "Total Value",
                "Details"
              ].map(h => (
                <th style={styles.th} key={h}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map(po => (
              <tr key={po.po_number}>
                <td style={styles.td}>
                  <strong style={{ color: "#60a5fa" }}>
                    {po.po_number}
                  </strong>
                </td>

                <td style={styles.td}>
                  <strong>{po.supplier_name || po.supplier_id}</strong>
                  <div style={styles.muted}>{po.supplier_id}</div>
                </td>

                <td style={styles.td}>{po.plant}</td>

                <td style={styles.td}>
                  <span style={{
                    color: "#36d6b0",
                    background: "#173c42",
                    padding: "5px 8px",
                    borderRadius: 5
                  }}>
                    {po.route}
                  </span>
                </td>

                <td style={styles.td}>{po.pr_count}</td>
                <td style={styles.td}>{po.total_quantity}</td>

                <td style={styles.td}>
                  <strong>{money(po.total_value)}</strong>
                </td>

                <td style={styles.td}>
                  <button
                    style={styles.button}
                    onClick={() => setSelected(po)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  style={{ ...styles.td, textAlign: "center" }}
                >
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ ...styles.muted, marginTop: 18 }}>
        Showing {filteredOrders.length} of {orders.length} consolidated
        purchase orders. These records represent draft purchase orders,
        not confirmed issued orders.
      </p>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 1100,
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#0b1729",
              border: "1px solid #293e5c",
              borderRadius: 16,
              padding: 26,
              color: "#e7edf8",
              boxShadow: "0 25px 80px rgba(0,0,0,0.55)"
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12
            }}>
              <div>
                <div style={{
                  ...styles.muted,
                  color: "#36d6b0",
                  letterSpacing: 2
                }}>
                  PURCHASE ORDER DETAILS
                </div>
                <h2 style={{ margin: "8px 0" }}>
                  {selected.po_number}
                </h2>
              </div>

              <button
                style={styles.button}
                onClick={() => setSelected(null)}
              >
                ✕ Close
              </button>
            </div>

            <div style={styles.cards}>
              <div style={styles.card}>
                <div style={styles.muted}>Supplier</div>
                <strong>
                  {selected.supplier_name || selected.supplier_id}
                </strong>
                <div style={styles.muted}>{selected.supplier_id}</div>
              </div>

              <div style={styles.card}>
                <div style={styles.muted}>Contract</div>
                <strong>{selected.contract_id || "No contract"}</strong>
              </div>

              <div style={styles.card}>
                <div style={styles.muted}>Total Value</div>
                <strong>{money(selected.total_value)}</strong>
              </div>

              <div style={styles.card}>
                <div style={styles.muted}>Plant</div>
                <strong>{selected.plant || "N/A"}</strong>
              </div>
            </div>

            <p style={styles.muted}>
              Purchase Request References:{" "}
              {(selected.pr_numbers || []).join(", ") || "N/A"}
            </p>

            <h3 style={{ marginTop: 25 }}>
              Purchase Order Line Items
            </h3>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Requirement",
                      "PR Number",
                      "Item Code",
                      "Description",
                      "Quantity",
                      "Unit Price",
                      "Line Value"
                    ].map(h => (
                      <th style={styles.th} key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {(selected.lines || []).map((line, index) => (
                    <tr key={`${line.group_id}-${index}`}>
                      <td style={styles.td}>{line.group_id}</td>
                      <td style={styles.td}>{line.pr_no}</td>
                      <td style={styles.td}>{line.item_code}</td>
                      <td style={styles.td}>{line.description}</td>
                      <td style={styles.td}>{line.quantity}</td>
                      <td style={styles.td}>
                        {money(line.unit_price)}
                      </td>
                      <td style={styles.td}>
                        {money(
                          line.line_value ??
                          line.total_value ??
                          (
                            Number(line.quantity || 0) *
                            Number(line.unit_price || 0)
                          )
                        )}
                      </td>
                    </tr>
                  ))}

                  {(!selected.lines || selected.lines.length === 0) && (
                    <tr>
                      <td colSpan="7" style={styles.td}>
                        No line item details available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 22
            }}>
              <button
                style={styles.button}
                onClick={() => setSelected(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
