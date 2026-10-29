import { useLocation } from "react-router-dom";

import { useState } from "react";

import { ensureAuthenticatedUser, functions } from "../firebase";

import { httpsCallable } from "firebase/functions";

type CartItem = { tagUID: string; name: string; price: number };
type FinalBillRouteState = {
  success?: boolean;
  orderId?: string | null;
  items?: CartItem[];
};

export default function FinalBill() {
  const loc = useLocation();
  const navState = (loc.state as FinalBillRouteState | null) || {};
  const {
    success = false,
    orderId = null,
    items: initialItems = [],
  } = navState;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const items = initialItems;
  const [step, setStep] = useState<"phone" | "done">("phone");
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const now = new Date();
  const formattedDate =
    now.toLocaleDateString() + ", " + now.toLocaleTimeString();

  const sendSMS = async () => {
    setError(null);
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }
    if (!orderId) {
      setError("The order ID is missing. Please return to checkout.");
      return;
    }
    // Accept 10-digit Indian numbers and format as +91...
    let formattedPhone = phone;
    if (!phone.startsWith("+")) {
      if (phone.length === 10) {
        formattedPhone = `+91${phone}`;
      } else {
        formattedPhone = `+${phone}`;
      }
    }
    setSending(true);
    try {
      await ensureAuthenticatedUser();
      const sendTwilioCall = httpsCallable(functions, "sendTwilio");
      const result = (await sendTwilioCall({
        orderId,
        name: name || "Customer",
        phone: formattedPhone,
      })) as { data: { ok?: boolean } };
      if (result.data && result.data.ok) {
        setStep("done");
      } else {
        setError("SMS send attempted, but no confirmation received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  if (!success)
    return (
      <div style={{ color: "white", padding: "50px" }}>Checkout Incomplete</div>
    );

  // --- UI ---
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: 40,
          }}
        >
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
              fontSize: 28,
              color: "#fff",
              marginRight: 16,
              boxShadow: "0 2px 8px 0 #6c4cff44",
            }}
          >
            BE
          </div>
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 1,
              textShadow: "0 2px 8px #6c4cff22",
            }}
          >
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
        }}
      >
        <div
          style={{
            background: "#181824",
            borderRadius: 32,
            boxShadow: "0 8px 40px 0 #0006",
            padding: "40px 32px 32px 32px",
            maxWidth: 480,
            width: "calc(100% - 32px)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {step === "phone" && (
            <>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ marginBottom: 18 }}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                    <rect
                      x="8"
                      y="8"
                      width="32"
                      height="32"
                      rx="8"
                      fill="#23233a"
                    />
                    <rect
                      x="16"
                      y="12"
                      width="16"
                      height="24"
                      rx="4"
                      fill="#00baff"
                      fillOpacity="0.7"
                    />
                    <rect
                      x="20"
                      y="36"
                      width="8"
                      height="2"
                      rx="1"
                      fill="#181824"
                    />
                  </svg>
                </div>
                <h2
                  style={{
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 28,
                    margin: 0,
                    letterSpacing: 1,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  What's your number?
                </h2>
                <p
                  style={{
                    color: "#bbaaff",
                    margin: 0,
                    fontWeight: 500,
                    fontSize: 15,
                    marginBottom: 18,
                    textAlign: "center",
                  }}
                >
                  We'll send your bill receipt on this number
                </p>
                <div style={{ width: "100%", marginBottom: 18 }}>
                  <input
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#23233a",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: 18,
                      padding: "18px 16px",
                      borderRadius: 16,
                      marginBottom: 12,
                    }}
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={32}
                  />
                  <input
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#23233a",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: 18,
                      padding: "18px 16px",
                      borderRadius: 16,
                    }}
                    placeholder="Enter mobile number"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    maxLength={10}
                  />
                </div>
                {error && (
                  <div
                    style={{
                      color: "#ff4c6c",
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <button
                    style={{
                      background: "#23233a",
                      color: "#bbaaff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 28px",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px 0 #0002",
                    }}
                    onClick={() => (window.location.href = "/")}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      background:
                        phone.length === 10
                          ? "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)"
                          : "#23233a",
                      color: phone.length === 10 ? "#fff" : "#888",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 28px",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor:
                        phone.length === 10 && !sending
                          ? "pointer"
                          : "not-allowed",
                      boxShadow: "0 2px 8px 0 #0002",
                      transition: "background 0.2s",
                    }}
                    disabled={phone.length !== 10 || sending}
                    onClick={sendSMS}
                  >
                    {sending ? "Sending..." : "Next →"}
                  </button>
                </div>
              </div>
            </>
          )}
          {step === "done" && (
            <>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ marginBottom: 18 }}>
                  <svg width="64" height="64" fill="none" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="32" fill="#23233a" />
                    <path
                      d="M20 34l8 8 16-16"
                      stroke="#00ff88"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  style={{
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 28,
                    margin: 0,
                    letterSpacing: 1,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  PAYMENT COMPLETE!
                </h2>
                <p
                  style={{
                    color: "#bbaaff",
                    margin: 0,
                    fontWeight: 500,
                    fontSize: 15,
                    marginBottom: 18,
                    textAlign: "center",
                  }}
                >
                  THANK YOU FOR SHOPPING!
                </p>
                <div
                  style={{
                    width: "100%",
                    background: "#181824",
                    borderRadius: 18,
                    padding: "24px 24px 12px 24px",
                    marginBottom: 18,
                    boxShadow: "0 2px 8px 0 #0002",
                  }}
                >
                  <div
                    style={{
                      color: "#bbaaff",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 12,
                      textAlign: "center",
                      letterSpacing: 1,
                    }}
                  >
                    TRANSACTION DETAILS
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#bbaaff", fontWeight: 600 }}>
                      Transaction ID
                    </span>
                    <span style={{ color: "#bbaaff", fontWeight: 700 }}>
                      #{orderId}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#bbaaff", fontWeight: 600 }}>
                      Amount Paid
                    </span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#bbaaff", fontWeight: 600 }}>
                      Payment Method
                    </span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>
                      Razorpay
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#bbaaff", fontWeight: 600 }}>
                      Mobile
                    </span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>
                      +91 {phone}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#bbaaff", fontWeight: 600 }}>
                      Date & Time
                    </span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>
                      {formattedDate}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    color: "#bbaaff",
                    fontWeight: 500,
                    fontSize: 15,
                    marginBottom: 18,
                    textAlign: "center",
                  }}
                >
                  A receipt has been sent to your mobile number.
                  <br />
                  Please collect your items and have a great day! 🛍️
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "18px 0",
                    background:
                      "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 16,
                    fontWeight: 700,
                    fontSize: 20,
                    marginTop: 8,
                    boxShadow: "0 2px 16px 0 #6c4cff44",
                    cursor: "pointer",
                    letterSpacing: 1,
                    transition: "background 0.2s",
                  }}
                  onClick={() => (window.location.href = "/")}
                >
                  Start New Transaction
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
