import { useEffect, useState, type ReactNode } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "./firebase";
import Welcome from "./components/Welcome";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import FinalBill from "./components/FinalBill";
import InventoryLogin from "./components/InventoryLogin";
import InventoryDashboard from "./components/InventoryDashboard";
import SalesHistory from "./components/SalesHistory";
import ReportsAnalytics from "./components/ReportsAnalytics";

function InventoryRoute({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (active) setAccess("denied");
        return;
      }

      getIdTokenResult(user)
        .then(({ claims }) => {
          if (!active) return;
          setAccess(
            claims.role === "admin" || claims.role === "staff"
              ? "allowed"
              : "denied",
          );
        })
        .catch((error) => {
          console.error("Unable to verify inventory access", error);
          if (active) setAccess("denied");
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (access === "checking") {
    return <div style={{ color: "white" }}>Checking access...</div>;
  }
  if (access === "denied") {
    return (
      <Navigate
        to="/inventory/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return children;
}

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          minHeight: "calc(100vh - 40px)",
          // margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // padding: "32px 0",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            // marginBottom: 16,
          }}
        >
          {/* <NavBar /> */}
        </div>
        <div
          style={{
            width: "100%",
            // maxWidth: "700px",
            // minHeight: "600px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            // padding: "5px 0",
          }}
        >
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/final-bill" element={<FinalBill />} />
            <Route path="/inventory/login" element={<InventoryLogin />} />
            <Route
              path="/inventory/dashboard"
              element={
                <InventoryRoute>
                  <InventoryDashboard />
                </InventoryRoute>
              }
            />
            <Route
              path="/inventory/sales-history"
              element={
                <InventoryRoute>
                  <SalesHistory />
                </InventoryRoute>
              }
            />
            <Route
              path="/inventory/reports-analytics"
              element={
                <InventoryRoute>
                  <ReportsAnalytics />
                </InventoryRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
