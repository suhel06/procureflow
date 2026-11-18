import { apiUrl } from "./api";

import { useEffect, useMemo, useState } from "react";

const API = apiUrl("/api/suppliers");

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Fetch suppliers from backend
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await fetch(API);

        if (!response.ok) {
          throw new Error("Unable to fetch suppliers");
        }

        const result = await response.json();

        setSuppliers(
          Array.isArray(result.suppliers)
            ? result.suppliers
            : []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Search suppliers
  const filtered = useMemo(() => {
    return suppliers.filter((supplier) =>
      [
        supplier.supplier_id,
        supplier.name,
        supplier.city,
        supplier.categories,
        supplier.status
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [suppliers, search]);

  // Dashboard metrics
  const activeCount = suppliers.filter(
    (s) => String(s.status || "").toUpperCase() === "ACTIVE"
  ).length;

  const averageOnTime = suppliers.length
    ? suppliers.reduce(
        (sum, s) => sum + Number(s.on_time_pct || 0),
        0
      ) / suppliers.length
    : 0;

  const averageQuality = suppliers.length
    ? suppliers.reduce(
        (sum, s) => sum + Number(s.quality_rating || 0),
        0
      ) / suppliers.length
    : 0;

  const categoriesText = (categories) => {
    if (Array.isArray(categories)) {
      return categories.join(", ");
    }
    return categories || "-";
  };

  // Styles
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
      boxSizing: "border-box",
      outline: "none"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 750
    },
    cell: {
      padding: "17px 14px",
      borderBottom: "1px solid #263750",
      textAlign: "left",
      fontSize: 13
    },
    button: {
      background: "#0f766e",
      color: "white",
      border: "1px solid #14b8a6",
      borderRadius: 7,
      padding: "9px 17px",
      cursor: "pointer",
      fontWeight: 600
    },
    closeButton: {
      background: "#263750",
      color: "#e7edf8",
      border: "1px solid #425570",
      borderRadius: 7,
      padding: "9px 17px",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.page}>

      {/* Page heading */}
      <div style={{ marginBottom: 25 }}>
        <p style={{
          color: "#14b8a6",
          fontSize: 12,
          letterSpacing: 2
        }}>
          PROCUREMENT INTELLIGENCE
        </p>

        <h1 style={{ fontSize: 30, margin: "10px 0" }}>
          Suppliers
        </h1>

        <p style={styles.muted}>
          Monitor supplier performance, quality and delivery reliability.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          ...styles.card,
          color: "#f87171",
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {/* Dashboard metrics */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 16,
        marginBottom: 25
      }}>
        {[
          ["Total Suppliers", suppliers.length],
          ["Active Suppliers", activeCount],
          ["Average On-time Delivery", `${averageOnTime.toFixed(1)}%`],
          ["Average Quality Rating", `${averageQuality.toFixed(1)} / 5`]
        ].map(([label, value]) => (
          <div key={label} style={styles.card}>
            <p style={styles.muted}>{label}</p>
            <h2 style={{ fontSize: 24, marginBottom: 0 }}>
              {value}
            </h2>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <input
          style={styles.input}
          placeholder="Search supplier, ID, city or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Supplier table */}
      <div style={{
        ...styles.card,
        padding: 0,
        overflowX: "auto"
      }}>
        {loading ? (
          <p style={{ padding: 25 }}>Loading suppliers...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 25 }}>No suppliers found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={{ background: "#1a2940" }}>
                {[
                  "Supplier ID",
                  "Supplier Name",
                  "City",
                  "Categories",
                  "Status",
                  "On-time %",
                  "Quality Rating",
                  "Details"
                ].map((item) => (
                  <th key={item} style={styles.cell}>
                    {item}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((supplier) => (
                <tr key={supplier.supplier_id}>
                  <td style={styles.cell}>
                    <strong style={{ color: "#60a5fa" }}>
                      {supplier.supplier_id}
                    </strong>
                  </td>

                  <td style={styles.cell}>
                    {supplier.name}
                  </td>

                  <td style={styles.cell}>
                    {supplier.city || "-"}
                  </td>

                  <td style={styles.cell}>
                    {categoriesText(supplier.categories)}
                  </td>

                  <td style={styles.cell}>
                    <span style={{
                      color:
                        String(supplier.status).toUpperCase() === "ACTIVE"
                          ? "#2dd4bf"
                          : "#fbbf24"
                    }}>
                      {supplier.status || "Unknown"}
                    </span>
                  </td>

                  <td style={styles.cell}>
                    {Number(supplier.on_time_pct || 0)}%
                  </td>

                  <td style={styles.cell}>
                    {Number(supplier.quality_rating || 0).toFixed(1)} / 5
                  </td>

                  <td style={styles.cell}>
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => setSelected(supplier)}
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
          Showing {filtered.length} of {suppliers.length} suppliers
        </p>
      </div>

      {/* Supplier details modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111e32",
              border: "1px solid #344861",
              borderRadius: 15,
              padding: 28,
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              boxSizing: "border-box"
            }}
          >
            {/* Modal heading */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 15,
              marginBottom: 25
            }}>
              <div>
                <p style={{
                  color: "#14b8a6",
                  fontSize: 11,
                  letterSpacing: 2
                }}>
                  SUPPLIER PROFILE
                </p>

                <h2 style={{
                  fontSize: 23,
                  margin: "8px 0"
                }}>
                  {selected.name}
                </h2>

                <p style={styles.muted}>
                  Supplier ID: {selected.supplier_id}
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setSelected(null)}
              >
                âœ•
              </button>
            </div>

            {/* Supplier information */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14
            }}>
              {[
                ["Supplier ID", selected.supplier_id],
                ["Supplier Name", selected.name],
                ["City", selected.city],
                ["Status", selected.status],
                ["Categories", categoriesText(selected.categories)],
                ["On-time Delivery", `${selected.on_time_pct ?? 0}%`],
                ["Quality Rating", `${selected.quality_rating ?? 0} / 5`]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "#1a2940",
                    border: "1px solid #263750",
                    borderRadius: 9,
                    padding: 16
                  }}
                >
                  <p style={styles.muted}>{label}</p>
                  <strong style={{
                    fontSize: 14,
                    overflowWrap: "anywhere"
                  }}>
                    {value || "-"}
                  </strong>
                </div>
              ))}
            </div>

            {/* Performance section */}
            <div style={{
              marginTop: 22,
              padding: 18,
              background: "#1a2940",
              borderRadius: 10
            }}>
              <h3 style={{ marginTop: 0 }}>
                Performance Overview
              </h3>

              <p style={styles.muted}>
                On-time delivery
              </p>

              <div style={{
                height: 8,
                background: "#263750",
                borderRadius: 10,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, Number(selected.on_time_pct || 0)))}%`,
                  background: "#14b8a6",
                  borderRadius: 10
                }} />
              </div>

              <p style={{
                textAlign: "right",
                color: "#2dd4bf",
                fontWeight: 600
              }}>
                {selected.on_time_pct || 0}%
              </p>
            </div>

            {/* Close button */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 25
            }}>
              <button
                type="button"
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

