import { useState, useEffect } from "react";
import { ensureAuthenticatedUser, rtdb } from "../firebase";
import {
  equalTo,
  get,
  limitToFirst,
  onChildAdded,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { useNavigate } from "react-router-dom";

type CartItem = { tagUID: string; name: string; price: number; qty?: number };

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [scanStatus, setScanStatus] = useState(
    rtdb
      ? "Connecting to RFID scans..."
      : "RFID scan error: Realtime Database is not configured.",
  );
  const nav = useNavigate();

  // subscribe to realtime database path for Arduino scans
  useEffect(() => {
    if (!rtdb) {
      console.warn("Realtime DB not initialized");
      return;
    }
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    ensureAuthenticatedUser()
      .then(() => {
        if (cancelled) return;
        const scansRef = ref(rtdb, "/scannedItems");
        setScanStatus("Waiting for RFID scans...");
        cleanup = onChildAdded(scansRef, async (snap) => {
          const value = snap.val();
          const rawTag = value?.tagId ?? value?.tagUID;
          const tag = typeof rawTag === "string" ? rawTag.trim() : "";
          if (!/^[A-Za-z0-9_:-]{1,128}$/.test(tag)) {
            setScanStatus(
              "RFID scan error: received a scan record without a valid tag ID.",
            );
            return;
          }

          try {
            const directProduct = await get(ref(rtdb, `/products/${tag}`));
            let data = directProduct.val();
            if (!directProduct.exists()) {
              let productSnapshot = await get(
                query(
                  ref(rtdb, "/products"),
                  orderByChild("tagId"),
                  equalTo(tag),
                  limitToFirst(1),
                ),
              );
              if (!productSnapshot.exists()) {
                productSnapshot = await get(
                  query(
                    ref(rtdb, "/products"),
                    orderByChild("tagUID"),
                    equalTo(tag),
                    limitToFirst(1),
                  ),
                );
              }
              if (!productSnapshot.exists()) {
                setScanStatus(
                  `Tag ${tag} was scanned, but it does not match an inventory product.`,
                );
                return;
              }
              const entries = Object.entries(productSnapshot.val());
              if (!entries.length) {
                setScanStatus(
                  `Tag ${tag} was scanned, but it does not match an inventory product.`,
                );
                return;
              }
              data = entries[0][1];
            }

            if (!data) {
              setScanStatus(
                `Tag ${tag} was scanned, but it does not match an inventory product.`,
              );
              return;
            }
            const newItem: CartItem = {
              tagUID: tag,
              name: data.productName || data.name || tag,
              price: Number(data.price) || 0,
            };
            setItems((prev) => {
              if (prev.some((item) => item.tagUID === tag)) return prev;
              return [...prev, newItem];
            });
            setScanStatus(`Scanned ${newItem.name}.`);
          } catch (err) {
            console.error("RTDB product lookup failed", err);
            setScanStatus(
              "RFID scan error: could not look up the scanned tag in Realtime Database.",
            );
          }
        },
        (err) => {
          console.error(
            "Unable to read RFID scans from Realtime Database",
            err,
          );
          setScanStatus(
            "RFID scan error: unable to read scannedItems. Check Firebase Authentication and Realtime Database rules.",
          );
        },
      );
      })
      .catch((err) => {
        console.error("Unable to authenticate for RFID scans", err);
        setScanStatus(
          "RFID scan error: unable to sign in to Firebase. Check that Anonymous Authentication is enabled.",
        );
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const restart = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#11111a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100vw",
          background: "#181824",
          display: "flex",
          alignItems: "center",
          height: 80,
          boxShadow: "0 2px 16px 0 #0002",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginLeft: 40 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "#6c4cff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
              color: "#fff",
              marginRight: 16,
            }}
          >
            BE
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 28 }}>
            BILL<span style={{ color: "#bbaaff" }}>EZY</span>
          </span>
        </div>
      </div>

      {/* Center Card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#181824",
            borderRadius: 32,
            boxShadow: "0 8px 40px 0 #0006",
            padding: "32px",
            maxWidth: 480,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: "#fff", margin: 0, fontSize: 24 }}>
              ORDER SUMMARY
            </h2>
            <button
              onClick={restart}
              style={{
                background: "#23233a",
                color: "#bbaaff",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ↻ Restart
            </button>
          </div>

          <div
            role="status"
            aria-live="polite"
            style={{
              color: scanStatus.startsWith("RFID scan error:")
                ? "#ff8297"
                : "#bbaaff",
              textAlign: "center",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {scanStatus}
          </div>

          {/* Items List */}
          <div
            style={{
              width: "100%",
              marginBottom: 20,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {items.length === 0 ? (
              <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
                Scan items with RFID...
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.tagUID}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#23233a",
                    borderRadius: 16,
                    marginBottom: 12,
                    padding: "12px 16px",
                    borderLeft: "4px solid #6c4cff",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 600 }}>
                      {it.name}
                    </div>
                    <div style={{ color: "#bbaaff", fontSize: 12 }}>1 item</div>
                  </div>
                  <div
                    style={{ color: "#fff", fontWeight: 700, marginRight: 15 }}
                  >
                    ₹{it.price.toLocaleString()}
                  </div>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 5,
                    }}
                    onClick={() =>
                      setItems((prev) =>
                        prev.filter((item) => item.tagUID !== it.tagUID),
                      )
                    }
                  >
                    {/* Delete Icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ff4c6c"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#bbaaff",
                marginBottom: 10,
              }}
            >
              <span>Total Items</span>
              <span>{items.length}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#fff",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              <span>Grand Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Buttons */}
          <button
            onClick={() => nav("/checkout", { state: { items } })}
            disabled={items.length === 0}
            style={{
              width: "100%",
              padding: "16px",
              background:
                items.length === 0
                  ? "#444"
                  : "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 18,
              cursor: items.length === 0 ? "default" : "pointer",
            }}
          >
            PLACE ORDER
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 15,
            }}
          >
            <button
              onClick={() => nav(-1)}
              style={{
                background: "transparent",
                color: "#bbaaff",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
