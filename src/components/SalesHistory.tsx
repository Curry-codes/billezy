import { useEffect, useState } from "react";
import { rtdb } from "../firebase";
import { ref } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function SalesHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const ordersRef = ref(rtdb, "/orders");
    const handleValue = (snap: any) => {
      const arr: any[] = [];
      if (snap.exists()) {
        const data = snap.val();
        Object.entries(data).forEach(([orderId, order]: any) => {
          if (order.billSent) {
            arr.push({ orderId, ...order });
          }
        });
      }
      setOrders(arr);
    };
    import("firebase/database").then(({ onValue, off }) => {
      onValue(ordersRef, handleValue);
      // Cleanup
      return () => off(ordersRef, "value", handleValue);
    });
  }, []);

  const filteredOrders = orders
    .filter(
      (o) =>
        o.orderId.toLowerCase().includes(search.toLowerCase()) ||
        (o.items &&
          o.items.some((item: any) =>
            item.tagUID?.toLowerCase().includes(search.toLowerCase()),
          )),
    )
    .sort((a, b) => {
      // Sort by billSentAt descending, fallback to orderId
      const aTime = a.billSentAt ? new Date(a.billSentAt).getTime() : 0;
      const bTime = b.billSentAt ? new Date(b.billSentAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      // Fallback: sort by orderId (string, descending)
      return b.orderId.localeCompare(a.orderId);
    });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#11111a",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 0, height: "100vh" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 260,
            background: "#181824",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 32,
            boxShadow: "0 2px 16px 0 #0002",
            minHeight: "100vh",
          }}
        >
          <div style={{ textAlign: "center", width: "100%" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: "#23233a",
                margin: "8px auto 16px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: "#bbaaff",
                boxShadow: "0 2px 8px 0 #6c4cff22",
              }}
            >
              <span role="img" aria-label="user">
                👤
              </span>
            </div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                marginTop: 8,
              }}
            >
              Administrator
            </div>
            <div style={{ color: "#bbaaff", fontSize: 14, marginBottom: 16 }}>
              Role: Admin
            </div>
            <div style={{ width: "100%", marginBottom: 24 }}>
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 12,
                  margin: "8px 0",
                  padding: "12px 0 12px 24px",
                  color: "#bbaaff",
                  fontWeight: 600,
                  fontSize: 16,
                  textAlign: "left",
                  boxShadow: "0 2px 8px 0 #0002",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => nav("/inventory/dashboard")}
              >
                <span style={{ color: "#bbaaff" }}>Inventory</span>
              </div>
              <div
                style={{
                  background: "#6c4cff",
                  borderRadius: 12,
                  margin: "8px 0",
                  padding: "12px 0 12px 24px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  textAlign: "left",
                  boxShadow: "0 2px 8px 0 #6c4cff44",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => nav("/inventory/sales-history")}
              >
                Sales History
              </div>
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 12,
                  margin: "8px 0",
                  padding: "12px 0 12px 24px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  textAlign: "left",
                  boxShadow: "0 2px 8px 0 #0002",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => nav("/inventory/reports-analytics")}
              >
                Reports & Analytics
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: "32px 0 0 0",
            overflowY: "auto",
            maxHeight: "100vh",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <h2
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 32,
                  marginBottom: 8,
                }}
              >
                Sales History & Receipts
              </h2>
              <div style={{ color: "#bbaaff", fontSize: 16, fontWeight: 500 }}>
                {orders.length} transactions recorded
              </div>
            </div>
            <div
              style={{
                background: "#181824",
                borderRadius: 24,
                boxShadow: "0 8px 40px 0 #0006",
                padding: "32px 32px 24px 32px",
                marginBottom: 32,
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 24,
                }}
              >
                <input
                  type="text"
                  placeholder="Search by Receipt ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: "#23233a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 16,
                    fontWeight: 500,
                    outline: "none",
                    boxShadow: "0 2px 8px 0 #0002",
                    width: 320,
                  }}
                />
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                }}
              >
                <thead>
                  <tr style={{ background: "#23233a" }}>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                        borderTopLeftRadius: 12,
                      }}
                    >
                      Receipt ID
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Items
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Total
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Razorpay ID
                    </th>
                    {/* Action column removed */}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr
                      key={o.orderId}
                      style={{
                        background: "#181824",
                        borderBottom: "1px solid #23233a",
                      }}
                    >
                      <td
                        style={{
                          color: "#bbaaff",
                          fontWeight: 600,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {o.orderId}
                      </td>
                      <td
                        style={{
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {o.billSentAt
                          ? new Date(o.billSentAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td
                        style={{
                          color: "#fff",
                          fontWeight: 500,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {o.items &&
                          o.items.map((item: any, idx: number) => (
                            <span key={idx} style={{ display: "block" }}>
                              {item.name} ({item.tagUID})
                            </span>
                          ))}
                      </td>
                      <td
                        style={{
                          color: "#bbaaff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        ₹{o.total}
                      </td>
                      <td
                        style={{
                          color: "#bbaaff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {o.razorpay_id || "-"}
                      </td>
                      {/* Action cell removed */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
