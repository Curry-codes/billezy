import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          to="/"
          style={{ fontWeight: 700, color: "#111", textDecoration: "none" }}
        >
          BillEzy
        </Link>
        <Link to="/cart" style={{ color: "#555" }}>
          Cart
        </Link>
        <Link to="/inventory/login" style={{ color: "#555" }}>
          Inventory
        </Link>
      </div>
    </div>
  );
}
