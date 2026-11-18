
import { useEffect, useMemo, useState } from "react";
import "./PurchaseRequests.css";

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN");
}

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [plant, setPlant] = useState("All");
  const [urgency, setUrgency] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/purchase-requests"
        );

        if (!response.ok) {
          throw new Error("Unable to fetch purchase requests");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Purchase request loading failed"
          );
        }

        setRequests(result.requests || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const plants = useMemo(
    () => [
      "All",
      ...new Set(requests.map(item => item.plant).filter(Boolean))
    ],
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const searchText = search.toLowerCase();

      const matchesSearch = [
        request.pr_no,
        request.item_code,
        request.description,
        request.requester,
        request.department
      ].some(value =>
        String(value || "").toLowerCase().includes(searchText)
      );

      const matchesPlant =
        plant === "All" || request.plant === plant;

      const matchesUrgency =
        urgency === "All" ||
        String(request.urgency || "").toLowerCase() ===
          urgency.toLowerCase();

      return matchesSearch && matchesPlant && matchesUrgency;
    });
  }, [requests, search, plant, urgency]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;

  const visibleRequests = filteredRequests.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, plant, urgency]);

  return (
    <section className="pr-page">
      <div className="pr-heading">
        <div>
          <h2>Purchase Requests</h2>
          <p>
            Review and manage incoming purchase request lines.
          </p>
        </div>

        <div className="pr-total">
          <strong>{requests.length}</strong>
          <span>Total PR lines</span>
        </div>
      </div>

      <div className="pr-toolbar">
        <input
          type="text"
          placeholder="Search PR number, item, requester..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={plant}
          onChange={e => setPlant(e.target.value)}
        >
          {plants.map(value => (
            <option key={value} value={value}>
              {value === "All" ? "All plants" : value}
            </option>
          ))}
        </select>

        <select
          value={urgency}
          onChange={e => setUrgency(e.target.value)}
        >
          <option value="All">All urgency</option>
          <option value="Normal">Normal</option>
          <option value="Emergency">Emergency</option>
        </select>
      </div>

      {loading ? (
        <div className="pr-message">Loading purchase requests...</div>
      ) : error ? (
        <div className="pr-error">{error}</div>
      ) : (
        <>
          <div className="pr-table-wrapper">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>PR Number</th>
                  <th>Line</th>
                  <th>Requester</th>
                  <th>Plant</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Need By</th>
                  <th>Urgency</th>
                </tr>
              </thead>

              <tbody>
                {visibleRequests.map((request, index) => (
                  <tr
                    key={`${request.pr_no}-${request.pr_line}-${index}`}
                  >
                    <td className="pr-id">{request.pr_no}</td>
                    <td>{request.pr_line}</td>
                    <td>{request.requester || "—"}</td>
                    <td>{request.plant || "—"}</td>
                    <td>{request.item_code || "—"}</td>
                    <td className="pr-description">
                      {request.description || "—"}
                    </td>
                    <td>
                      {request.quantity ?? "—"}{" "}
                      {request.uom || ""}
                    </td>
                    <td>{formatDate(request.need_by_date)}</td>
                    <td>
                      <span
                        className={`pr-urgency ${
                          String(request.urgency).toLowerCase() ===
                          "emergency"
                            ? "pr-emergency"
                            : "pr-normal"
                        }`}
                      >
                        {request.urgency || "—"}
                      </span>
                    </td>
                  </tr>
                ))}

                {visibleRequests.length === 0 && (
                  <tr>
                    <td colSpan="9" className="pr-empty">
                      No matching purchase requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pr-pagination">
            <span>
              Showing{" "}
              {filteredRequests.length === 0
                ? 0
                : startIndex + 1}
              {" - "}
              {Math.min(
                startIndex + PAGE_SIZE,
                filteredRequests.length
              )}{" "}
              of {filteredRequests.length} records
            </span>

            <div>
              <button
                disabled={safePage === 1}
                onClick={() =>
                  setCurrentPage(page => page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {safePage} of {totalPages}
              </span>

              <button
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage(page => page + 1)
                }
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
