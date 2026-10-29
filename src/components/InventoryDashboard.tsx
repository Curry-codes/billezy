import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, rtdb } from "../firebase";
import { getIdTokenResult, signOut } from "firebase/auth";
import {
  ref,
  get,
  set,
  remove as rtdbRemove,
  update,
} from "firebase/database";

type Product = {
  id: string;
  tagUID: string;
  name: string;
  active_status: string;
  price: number;
  stock_qty: number;
};

export default function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [assigning, setAssigning] = useState<Product | null>(null);
  const [deletedProduct, setDeletedProduct] = useState<Product | null>(null);
  const [undoTimer, setUndoTimer] = useState<any>(null);
  const [search, setSearch] = useState("");
  const nav = useNavigate();
  // Logout handler
  const handleLogout = async () => {
    await signOut(auth);
    nav("/inventory/login");
  };

  useEffect(() => {
    let active = true;
    const user = auth.currentUser;
    if (!user) {
      nav("/inventory/login");
      return;
    }

    getIdTokenResult(user)
      .then(({ claims }) => {
        if (claims.role !== "admin" && claims.role !== "staff") {
          nav("/inventory/login");
          return;
        }
        if (active) setRole(claims.role);
      })
      .catch((error) => {
        console.error("Unable to verify inventory role", error);
        nav("/inventory/login");
      });

    return () => {
      active = false;
    };
  }, [nav]);

  // Load products from RTDB
  const load = async () => {
    const productsRef = ref(rtdb, "/products");
    const snap = await get(productsRef);
    const arr: Product[] = [];
    if (snap.exists()) {
      const data = snap.val();
      Object.entries(data).forEach(([id, d]: any) => {
        arr.push({
          id,
          tagUID: d.tagId || id,
          name: d.productName || d.name || "",
          active_status: d.active_status || "Active",
          price: d.price || 0,
          stock_qty: d.stockQty || d.stock_qty || 0,
        });
      });
    }
    setProducts(arr);
  };

  useEffect(() => {
    load();
  }, []);

  const removeProduct = async (p: Product) => {
    if (!confirm("Delete product?")) return;
    setDeletedProduct(p);
    await rtdbRemove(ref(rtdb, `/products/${p.id}`));
    setProducts((ps) => ps.filter((x) => x.id !== p.id));
    const t = setTimeout(() => {
      setDeletedProduct(null);
      setUndoTimer(null);
    }, 8000);
    setUndoTimer(t);
  };

  const undoDelete = async () => {
    if (!deletedProduct) return;
    await set(ref(rtdb, `/products/${deletedProduct.id}`), {
      tagId: deletedProduct.tagUID,
      productName: deletedProduct.name,
      active_status: deletedProduct.active_status,
      price: deletedProduct.price,
      stockQty: deletedProduct.stock_qty,
    });
    clearTimeout(undoTimer);
    setDeletedProduct(null);
    setUndoTimer(null);
    load();
  };

  const toggleActive = async (p: Product) => {
    await update(ref(rtdb, `/products/${p.id}`), {
      active_status: p.active_status === "Active" ? "Deactivated" : "Active",
    });
    load();
  };

  const saveProduct = async (payload: any) => {
    // Ensure tagId is set for RTDB
    const dbPayload = {
      tagId: payload.tagUID,
      productName: payload.name,
      price: payload.price,
      stockQty: payload.stock_qty,
      active_status: payload.active_status,
    };
    if (editing) {
      // If tagUID changed, remove old entry and create new one
      if (editing.tagUID !== payload.tagUID) {
        await set(ref(rtdb, `/products/${payload.tagUID}`), dbPayload);
        await rtdbRemove(ref(rtdb, `/products/${editing.id}`));
      } else {
        await update(ref(rtdb, `/products/${editing.id}`), dbPayload);
      }
    } else {
      // Set product id as tagUID
      await set(ref(rtdb, `/products/${payload.tagUID}`), dbPayload);
    }
    setEditing(null);
    setShowAdd(false);
    load();
  };

  const assignTag = async (p: Product, newTag: string) => {
    const data = {
      productName: p.name,
      price: p.price,
      active_status: p.active_status,
      stockQty: p.stock_qty,
      tagId: newTag,
    };
    await set(ref(rtdb, `/products/${newTag}`), data);
    await rtdbRemove(ref(rtdb, `/products/${p.id}`));
    setAssigning(null);
    load();
  };

  const addSample = () => setShowAdd(true);

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tagUID.toLowerCase().includes(search.toLowerCase()),
  );

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
                onClick={() => nav("/inventory/dashboard")}
              >
                Inventory
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
            <button
              style={{
                width: "90%",
                padding: "14px 0",
                background: "#7c2c2c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 18,
                marginTop: 32,
                boxShadow: "0 2px 16px 0 #6c4cff22",
                cursor: "pointer",
                letterSpacing: 1,
                transition: "background 0.2s",
              }}
              onClick={handleLogout}
            >
              <span role="img" aria-label="exit">
                📕
              </span>{" "}
              Exit Inventory
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "32px 0 0 0" }}>
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
                Inventory
              </h2>
              <div style={{ color: "#bbaaff", fontSize: 16, fontWeight: 500 }}>
                Manage your store products and stock
              </div>
            </div>
            <div
              style={{
                background: "#181824",
                borderRadius: 24,
                boxShadow: "0 8px 40px 0 #0006",
                padding: "32px 32px 24px 32px",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  <strong>Total products:</strong> {filteredProducts.length}
                </div>
                <input
                  type="text"
                  placeholder="Search by name or tagUID"
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
                    marginRight: 12,
                  }}
                />
                {role === "admin" && (
                  <button
                    style={{
                      padding: "12px 32px",
                      background:
                        "linear-gradient(90deg, #6c4cff 0%, #bbaaff 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 18,
                      boxShadow: "0 2px 16px 0 #6c4cff44",
                      cursor: "pointer",
                      letterSpacing: 1,
                      transition: "background 0.2s",
                    }}
                    onClick={addSample}
                  >
                    + Add Product
                  </button>
                )}
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
                      Tag UID
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        color: "#bbaaff",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "16px 8px",
                      }}
                    >
                      Qty
                    </th>
                    {role === "admin" && (
                      <th
                        style={{
                          color: "#bbaaff",
                          fontWeight: 700,
                          fontSize: 16,
                          padding: "16px 8px",
                          borderTopRightRadius: 12,
                        }}
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr
                      key={p.id}
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
                        {p.tagUID}
                      </td>
                      <td
                        style={{
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {p.name}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span
                          style={{
                            background:
                              p.active_status === "Active"
                                ? "#1ed76022"
                                : "#ff4c4c22",
                            color:
                              p.active_status === "Active"
                                ? "#1ed760"
                                : "#ff4c4c",
                            borderRadius: 8,
                            padding: "4px 12px",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {p.active_status.toLowerCase()}
                        </span>
                      </td>
                      <td
                        style={{
                          color: "#bbaaff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        ₹{p.price}
                      </td>
                      <td
                        style={{
                          color: p.stock_qty <= 6 ? "#ff4c4c" : "#fff",
                          fontWeight: 700,
                          fontSize: 15,
                          padding: "14px 8px",
                        }}
                      >
                        {p.stock_qty}
                      </td>
                      {role === "admin" && (
                        <td style={{ padding: "14px 8px" }}>
                          <button
                            style={{
                              background: "#23233a",
                              color: "#bbaaff",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                              marginRight: 8,
                            }}
                            onClick={() => {
                              setEditing(p);
                              setShowAdd(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              background: "#23233a",
                              color: "#ff4c4c",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                              marginRight: 8,
                            }}
                            onClick={() => removeProduct(p)}
                          >
                            Delete
                          </button>
                          <button
                            style={{
                              background: "#23233a",
                              color: "#00baff",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                              marginRight: 8,
                            }}
                            onClick={() => setAssigning(p)}
                          >
                            Assign Tag
                          </button>
                          <button
                            style={{
                              background: "#23233a",
                              color:
                                p.active_status === "Active"
                                  ? "#ff4c4c"
                                  : "#1ed760",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                            onClick={() => toggleActive(p)}
                          >
                            {p.active_status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {deletedProduct && (
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 16,
                  boxShadow: "0 2px 8px 0 #6c4cff22",
                  padding: "24px 32px",
                  marginTop: 24,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Product <strong>{deletedProduct.name}</strong> deleted.{" "}
                <button
                  style={{
                    background: "#6c4cff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    marginLeft: 12,
                  }}
                  onClick={undoDelete}
                >
                  Undo
                </button>
              </div>
            )}
            {showAdd && (
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 16,
                  boxShadow: "0 2px 8px 0 #6c4cff22",
                  padding: "24px 32px",
                  marginTop: 24,
                  color: "#fff",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
              >
                <h4 style={{ color: "#bbaaff", fontWeight: 700, fontSize: 22 }}>
                  {editing ? "Edit Product" : "Add Product"}
                </h4>
                <ProductForm
                  initial={editing}
                  onCancel={() => {
                    setShowAdd(false);
                    setEditing(null);
                  }}
                  onSave={saveProduct}
                  products={products}
                />
              </div>
            )}
            {assigning && (
              <div
                style={{
                  background: "#23233a",
                  borderRadius: 16,
                  boxShadow: "0 2px 8px 0 #6c4cff22",
                  padding: "24px 32px",
                  marginTop: 24,
                  color: "#fff",
                }}
              >
                <h4 style={{ color: "#bbaaff", fontWeight: 700, fontSize: 22 }}>
                  Assign Tag UID to {assigning.name}
                </h4>
                <AssignTagForm
                  product={assigning}
                  onCancel={() => setAssigning(null)}
                  onAssign={(tag) => assignTag(assigning, tag)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  onCancel,
  onSave,
  products,
}: {
  initial: Product | null;
  onCancel: () => void;
  onSave: (p: any) => void;
  products: Product[];
}) {
  const [tagUID, setTagUID] = useState(initial?.tagUID || "");
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || 0);
  const [qty, setQty] = useState(initial?.stock_qty || 0);
  const [status, setStatus] = useState(initial?.active_status || "Active");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Scan Tag handler
  const handleScanTag = async () => {
    setScanning(true);
    try {
      // Fetch latest scanned tag from /scannedItems
      const { ref, get } = await import("firebase/database");
      const scansRef = ref(rtdb, "/scannedItems");
      const snap = await get(scansRef);
      if (snap.exists()) {
        const data = snap.val();
        // Find latest tagId (last child)
        let latestTag = "";
        if (typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const lastKey = keys[keys.length - 1];
            latestTag = data[lastKey].tagId || data[lastKey].tagUID || "";
          }
        }
        if (latestTag) {
          setTagUID(latestTag);
        } else {
          alert("No scanned tag found. Please scan a tag.");
        }
      } else {
        alert("No scanned tag found. Please scan a tag.");
      }
    } catch (err) {
      alert("Failed to fetch scanned tag UID.");
    } finally {
      setScanning(false);
    }
  };

  // Check for duplicate tagUID
  const isDuplicateTagUID = () => {
    const normalizedTag = tagUID.trim();
    if (!normalizedTag) return false;
    return products.some(
      (p) =>
        p.tagUID === normalizedTag &&
        (!initial || initial.tagUID !== normalizedTag),
    );
  };

  const handleSave = () => {
    if (isDuplicateTagUID()) {
      setError("Tag UID already exists. Please use a unique tag.");
      return;
    }
    setError("");
    onSave({ tagUID, name, price, stock_qty: qty, active_status: status });
  };

  return (
    <div>
      <div>
        <label>Tag UID</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={tagUID} onChange={(e) => setTagUID(e.target.value)} />
          <button
            type="button"
            style={{
              background: scanning ? "#444" : "#6c4cff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontWeight: 600,
              fontSize: 14,
              cursor: scanning ? "not-allowed" : "pointer",
            }}
            disabled={scanning}
            onClick={handleScanTag}
          >
            {scanning ? "Scanning..." : "Scan Tag"}
          </button>
        </div>
      </div>
      {error && (
        <div style={{ color: "#ff4c4c", fontWeight: 600, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div>
        <label>Product name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Price</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Qty</label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Active</option>
          <option>Deactivated</option>
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={handleSave}>
          Save
        </button>
        <button style={{ marginLeft: 8 }} onClick={onCancel}>
          Discard
        </button>
      </div>
    </div>
  );
}

function AssignTagForm({
  product,
  onCancel,
  onAssign,
}: {
  product: Product;
  onCancel: () => void;
  onAssign: (tag: string) => void;
}) {
  const [tag, setTag] = useState("");
  return (
    <div>
      <p>
        Place the RFID tag on the machine for {product.name}, then paste the UID
        below.
      </p>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Tag UID"
      />
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => onAssign(tag)}>
          Assign
        </button>
        <button style={{ marginLeft: 8 }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
