import { useState } from "react";
import { auth } from "../firebase";
import { getIdTokenResult, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function InventoryLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const token = await getIdTokenResult(credential.user, true);
      if (token.claims.role !== "admin" && token.claims.role !== "staff") {
        await signOut(auth);
        throw new Error("This account is not authorized for inventory access.");
      }
      nav("/inventory/dashboard");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Login failed. Check your credentials.",
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#11111a",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <div
          style={{
            background: "#181824",
            borderRadius: 16,
            boxShadow: "0 8px 40px 0 #0006",
            padding: "40px 32px 32px 32px",
            maxWidth: 420,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "2px solid #bbaaff22",
          }}
        >
          <h2
            style={{
              color: "#bbaaff",
              fontWeight: 800,
              fontSize: 32,
              textAlign: "center",
              margin: 0,
              letterSpacing: 1,
              marginBottom: 24,
              textShadow: "0 2px 8px #6c4cff22",
            }}
          >
            Inventory Login
          </h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              width: "100%",
              marginBottom: 16,
            }}
          >
            <input
              style={{
                flex: 1,
                background: "#23233a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 500,
                outline: "none",
                boxShadow: "0 2px 8px 0 #0002",
              }}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={{
                flex: 1,
                background: "#23233a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 500,
                outline: "none",
                boxShadow: "0 2px 8px 0 #0002",
              }}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            style={{
              width: "100%",
              padding: "14px 0",
              background: "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              marginTop: 8,
              boxShadow: "0 2px 16px 0 #6c4cff44",
              cursor: "pointer",
              letterSpacing: 1,
              transition: "background 0.2s",
            }}
            onClick={login}
          >
            Login
          </button>
          <button
            style={{
              width: "100%",
              padding: "12px 0",
              background: "#23233a",
              color: "#bbaaff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              marginTop: 12,
              boxShadow: "0 2px 8px 0 #0002",
              cursor: "pointer",
              letterSpacing: 1,
              transition: "background 0.2s",
            }}
            onClick={() => nav("/")}
          >
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
}
