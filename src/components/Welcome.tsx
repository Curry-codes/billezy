import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const nav = useNavigate();
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
          padding: "0 0 0 0",
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
            padding: "48px 32px 40px 32px",
            maxWidth: 420,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#23233a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 2px 16px 0 #6c4cff33",
            }}
          >
            <svg width="36" height="36" fill="none" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" stroke="#6c4cff" strokeWidth="2" />
              <circle cx="18" cy="18" r="4" fill="#6c4cff" />
            </svg>
          </div>
          <h2
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: 32,
              textAlign: "center",
              margin: 0,
              letterSpacing: 1,
            }}
          >
            WELCOME TO
            <br />
            BILLEZY
          </h2>
          <p
            style={{
              color: "#bbaaff",
              textAlign: "center",
              margin: "16px 0 0 0",
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: 0.5,
            }}
          >
            PLACE ITEMS INTO THE BILLING BASKET
            <br />
            TO CONTINUE PAYMENT
          </p>
          {/* Steps */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "32px 0 24px 0",
              gap: 32,
            }}
          >
            {/* RFID Scan */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="4"
                    stroke="#6c4cff"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="3" fill="#6c4cff" />
                </svg>
              </div>
              <span style={{ color: "#bbaaff", fontWeight: 600, fontSize: 13 }}>
                RFID Scan
              </span>
            </div>
            {/* Quick Pay */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="4"
                    y="6"
                    width="16"
                    height="12"
                    rx="3"
                    stroke="#6c4cff"
                    strokeWidth="2"
                  />
                  <rect
                    x="8"
                    y="10"
                    width="8"
                    height="4"
                    rx="2"
                    fill="#6c4cff"
                  />
                </svg>
              </div>
              <span style={{ color: "#bbaaff", fontWeight: 600, fontSize: 13 }}>
                Quick Pay
              </span>
            </div>
            {/* Complete */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="4"
                    stroke="#6c4cff"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 12.5l3 3 5-5"
                    stroke="#6c4cff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span style={{ color: "#bbaaff", fontWeight: 600, fontSize: 13 }}>
                Complete
              </span>
            </div>
          </div>
          {/* Start Shopping Button */}
          <button
            onClick={() => nav("/cart")}
            style={{
              width: "100%",
              padding: "18px 0",
              background: "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)",
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
          >
            Start Shopping
          </button>
        </div>
      </div>

      {/* Floating Button (bottom right) */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          background: "#6c4cff",
          borderRadius: 16,
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 16px 0 #6c4cff44",
          zIndex: 100,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onClick={() => nav("/inventory/login")}
        title="Inventory Login"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
          <rect
            x="4"
            y="4"
            width="20"
            height="20"
            rx="6"
            fill="#fff"
            fillOpacity="0.12"
          />
          <rect x="8" y="8" width="4" height="4" rx="2" fill="#fff" />
          <rect x="16" y="8" width="4" height="4" rx="2" fill="#fff" />
          <rect x="8" y="16" width="4" height="4" rx="2" fill="#fff" />
          <rect x="16" y="16" width="4" height="4" rx="2" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
