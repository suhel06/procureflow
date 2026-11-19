import { apiUrl } from "./api";

import { useEffect, useMemo, useState } from "react";

const API = apiUrl("/api/contracts");

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const date = value =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(API);
        if (!response.ok) throw new Error("Unable to fetch contracts");

        const result = await response.json();
        setContracts(result.contracts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  useEffect(() => {
    if (!selected) return;

    const handleEscape = event => {
      if (event.key === "Escape") setSelected(null);
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [selected]);

  const filtered = useMemo(() => {
    return contracts.filter(contract =>
      [
        contract.contract_id,
        contract.supplier_name,
        contract.supplier_id
      ].some(value =>
        String(value || "").toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [contracts, search]);

  const totalValue = contracts.reduce(
    (sum, c) => sum + Number(c.value_cap || 0), 0
  );

  const consumedValue = contracts.reduce(
    (sum, c) => sum + Number(c.consumed_value || 0), 0
  );

  const openDetails = async contract => {
    setSelected(contract);
    setDetails([]);
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(contract.contract_id)}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch contract details");
      }

      const result = await response.json();
      setDetails(result.lines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelected(null);
    setDetails([]);
    setDetailLoading(false);
  };

  const styles = {
    page: {
      color: "#e7edf8",
      width: "100%"
    },
    card: {
      background: "#111e32",
      border: "1px solid #263750",
      borderRadius: 12,
      padding: 22
    },
    muted: {
      color: "#8da5c5",
      fontSize: 13
    },
    input: {
      width: "100%",
      padding: 15,
      background: "#111e32",
      color: "#e7edf8",
      border: "1px solid #263750",
      borderRadius: 9,
      fontSize: 14,
      boxSizing: "border-box"
    },
    button: {
      background: "#0f766e",
      color: "white",
      border: "1px solid #14b8a6",
      borderRadius: 7,
      padding: "8px 15px",
      cursor: "pointer"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 850
    },
    cell: {
      padding: "17px 14px",
      borderBottom: "1px solid #263750",
      textAlign: "left",
      fontSize: 13
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 25 }}>
        <p style={{
          color: "#14b8a6",
          fontSize: 12,
          letterSpacing: 2
        }}>
          PROCUREMENT INTELLIGENCE
        </p>

        <h1 style={{ fontSize: 30, margin: "10px 0" }}>
          Contracts
        </h1>

        <p style={styles.muted}>
          Monitor supplier contracts, spending and remaining contract value.
        </p>
      </div>

      {error && (
        <p style={{ color: "#f87171" }}>{error}</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 16,
        marginBottom: 25
      }}>
        {[
          ["Total Contracts", contracts.length],
          ["Total Contract Value", money(totalValue)],
          ["Consumed Value", money(consumedValue)],
          ["Remaining Value", money(totalValue - consumedValue)]
        ].map(([label, value]) => (
          <div key={label} style={styles.card}>
            <p style={styles.muted}>{label}</p>
            <h2 style={{ fontSize: 23, marginBottom: 0 }}>
              {value}
            </h2>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 18 }}>
        <input
          style={styles.input}
          placeholder="Search contract ID, supplier or supplier ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{
        ...styles.card,
        padding: 0,
        overflowX: "auto"
      }}>
        {loading ? (
          <p style={{ padding: 25 }}>Loading contracts...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 25 }}>No contracts found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={{ background: "#1a2940" }}>
                {[
                  "Contract ID",
                  "Supplier",
                  "Start Date",
                  "End Date",
                  "Value Cap",
                  "Consumed",
                  "Remaining",
                  "Utilization",
                  "Details"
                ].map(item => (
                  <th key={item} style={styles.cell}>{item}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map(contract => (
                <tr key={contract.contract_id}>
                  <td style={styles.cell}>
                    <strong style={{ color: "#60a5fa" }}>
                      {contract.contract_id}
                    </strong>
                  </td>

                  <td style={styles.cell}>
                    {contract.supplier_name}
                    <div style={styles.muted}>
                      {contract.supplier_id}
                    </div>
                  </td>

                  <td style={styles.cell}>
                    {date(contract.start_date)}
                  </td>

                  <td style={styles.cell}>
                    {date(contract.end_date)}
                  </td>

                  <td style={styles.cell}>
                    {money(contract.value_cap)}
                  </td>

                  <td style={styles.cell}>
                    {money(contract.consumed_value)}
                  </td>

                  <td style={styles.cell}>
                    {money(contract.remaining_value)}
                  </td>

                  <td style={styles.cell}>
                    <strong style={{
                      color: contract.utilization >= 80
                        ? "#fbbf24"
                        : "#2dd4bf"
                    }}>
                      {contract.utilization}%
                    </strong>

                    <div style={{
                      background: "#263750",
                      height: 5,
                      borderRadius: 5,
                      marginTop: 7,
                      width: 85
                    }}>
                      <div style={{
                        height: 5,
                        borderRadius: 5,
                        background: "#14b8a6",
                        width: `${Math.min(
                          contract.utilization || 0, 100
                        )}%`
                      }} />
                    </div>
                  </td>

                  <td style={styles.cell}>
                    <button
                      style={styles.button}
                      onClick={() => openDetails(contract)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ ...styles.muted, padding: 15 }}>
          Showing {filtered.length} of {contracts.length} contracts
        </p>
      </div>

      {selected && (
        <div
          onClick={closeDetails}
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
              maxWidth: 900,
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
                <p style={{
                  ...styles.muted,
                  color: "#14b8a6",
                  letterSpacing: 2
                }}>
                  CONTRACT DETAILS
                </p>

                <h2 style={{ margin: "8px 0" }}>
                  {selected.contract_id}
                </h2>

                <p style={styles.muted}>
                  {selected.supplier_name} \u00B7 {selected.supplier_id}
                </p>
              </div>

              <button
                style={styles.button}
                onClick={closeDetails}
              >
                 Close
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 14,
              margin: "24px 0"
            }}>
              {[
                ["Supplier ID", selected.supplier_id || "-"],
                ["Value Cap", money(selected.value_cap)],
                ["Consumed", money(selected.consumed_value)],
                ["Remaining", money(selected.remaining_value)],
                ["Utilization", `${selected.utilization || 0}%`],
                ["Start Date", date(selected.start_date)],
                ["End Date", date(selected.end_date)]
              ].map(([label, value]) => (
                <div key={label} style={styles.card}>
                  <p style={styles.muted}>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 16 }}>
              Contract Line Items
            </h3>

            {detailLoading ? (
              <p style={styles.muted}>Loading line items...</p>
            ) : details.length === 0 ? (
              <p style={styles.muted}>No line items found.</p>
            ) : (
              <div style={{
                overflowX: "auto",
                border: "1px solid #263750",
                borderRadius: 10
              }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: "#1a2940" }}>
                      {[
                        "Item Code",
                        "Description",
                        "UOM",
                        "Rate"
                      ].map(item => (
                        <th key={item} style={styles.cell}>
                          {item}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {details.map((line, index) => (
                      <tr key={index}>
                        <td style={styles.cell}>
                          {line.item_code}
                        </td>
                        <td style={styles.cell}>
                          {line.description}
                        </td>
                        <td style={styles.cell}>
                          {line.uom}
                        </td>
                        <td style={styles.cell}>
                          {money(line.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 22
            }}>
              <button
                style={styles.button}
                onClick={closeDetails}
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

