import { useEffect, useState } from "react";
import { rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("en-IN");

const exportRowsAsFile = (
  rows: Record<string, string | number>[],
  fileName: string,
  format: "csv" | "xls",
) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const text = String(value ?? "").replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(","),
      ),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type:
      format === "csv"
        ? "text/csv;charset=utf-8"
        : "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const exportPdfReport = (
  title: string,
  sections: Array<{ title: string; rows: Record<string, string | number>[] }>,
) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const sectionHtml = sections
    .map(({ title, rows }) => {
      if (!rows.length) return `<h3>${title}</h3><p>No data available.</p>`;
      const headers = Object.keys(rows[0]);
      const body = rows
        .map(
          (row) =>
            `<tr>${headers
              .map((header) => `<td>${row[header]}</td>`)
              .join("")}</tr>`,
        )
        .join("");

      return `
        <h3>${title}</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
          <thead>
            <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      `;
    })
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h2 { margin-bottom: 18px; }
          table { font-size: 12px; }
          th { background: #f3f0ff; text-align: left; }
          td { padding: 8px; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${sectionHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
};

export default function ReportsAnalytics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "all">("30");
  const nav = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          get(ref(rtdb, "/orders")),
          get(ref(rtdb, "/products")),
        ]);

        if (ordersSnap.exists()) {
          const data = ordersSnap.val();
          const arr = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((order) => order.billSent);
          setOrders(arr);
        }

        if (productsSnap.exists()) {
          const data = productsSnap.val();
          const arr = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            stock_qty: Number(data[key].stockQty ?? data[key].stock_qty ?? 0),
            price: Number(data[key].price ?? 0),
          }));
          setProducts(arr);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDateCutoff = (days: number) => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff;
  };

  const filteredOrders = orders.filter((order) => {
    const dateValue = order.createdAt;
    if (!dateValue || dateRange === "all") return true;

    const orderDate = new Date(dateValue);
    if (Number.isNaN(orderDate.getTime())) return true;

    return orderDate >= getDateCutoff(Number(dateRange));
  });

  // --- Analytics Calculations ---

  // --- Analytics Calculations ---
  // 1. Calculate Bestsellers
  const itemCounts: { [key: string]: number } = {};
  filteredOrders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const name = item.name || "Unknown Item";
        itemCounts[name] = (itemCounts[name] || 0) + 1;
      });
    }
  });
  const sortedBestsellers = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  // 2. Calculate Revenue
  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );

  const totalProducts = products.length;
  const lowStockAlert = products.filter(
    (product) => Number(product.stock_qty || 0) <= 6,
  ).length;
  const outOfStock = products.filter(
    (product) => Number(product.stock_qty || 0) === 0,
  ).length;
  const totalInventoryValue = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_qty || 0) * Number(product.price || 0),
    0,
  );
  const totalSales = totalRevenue;
  const totalProfit = Math.round(totalSales * 0.35);
  const totalUnitsSold = filteredOrders.reduce((sum, order) => {
    if (!Array.isArray(order.items)) return sum;
    return (
      sum +
      order.items.reduce(
        (count: number, item: any) => count + (Number(item.qty) || 1),
        0,
      )
    );
  }, 0);
  const totalUnitsInStock = products.reduce(
    (sum, product) => sum + Number(product.stock_qty || 0),
    0,
  );
  const inventoryTurnover =
    totalUnitsSold > 0
      ? (totalUnitsSold / Math.max(totalUnitsInStock || 1, 1)).toFixed(2)
      : "0.00";

  const analyticsSummary = [
    {
      label: "Total Products",
      value: totalProducts.toString(),
      accent: "#6c4cff",
      detail: "Active inventory items",
    },
    {
      label: "Low Stock Alert",
      value: lowStockAlert.toString(),
      accent: "#ff8a4c",
      detail: lowStockAlert > 0 ? "Items need restock" : "All items stocked",
    },
    {
      label: "Out of Stock",
      value: outOfStock.toString(),
      accent: "#ff4d6d",
      detail: outOfStock > 0 ? "Need immediate refill" : "No empty products",
    },
    {
      label: "Total Inventory Value",
      value: formatCurrency(totalInventoryValue),
      accent: "#ffd166",
      detail: "Stock price value",
    },
    {
      label: "Total Sales",
      value: formatCurrency(totalSales),
      accent: "#1ed760",
      detail: "Revenue from all orders",
    },
    {
      label: "Total Profit",
      value: formatCurrency(totalProfit),
      accent: "#32d6ff",
      detail: "Estimated gross profit",
    },
  ];

  const lowStockProducts = products
    .filter((product) => Number(product.stock_qty || 0) <= 6)
    .map((product) => ({
      product: product.name || product.productName || product.id,
      currentStock: Number(product.stock_qty || 0),
      minimum: 6,
      status:
        Number(product.stock_qty || 0) === 0 ? "Out of Stock" : "Low Stock",
    }))
    .sort((a, b) => a.currentStock - b.currentStock);

  const slowStockProducts = products
    .map((product) => {
      const productName = product.name || product.productName || product.id;
      const soldDates = orders
        .filter((order) => Array.isArray(order.items))
        .flatMap((order) => order.items)
        .filter((item) => {
          const itemName = String(item.name || "").toLowerCase();
          const productNameLower = String(productName).toLowerCase();
          return (
            itemName === productNameLower ||
            item.tagUID === product.tagUID ||
            item.tagUID === product.id
          );
        })
        .map((item) => item.soldAt || item.createdAt || item.date)
        .filter(Boolean)
        .map((date: string) => new Date(date).getTime())
        .filter((time) => !Number.isNaN(time));

      const lastSaleTime = soldDates.length ? Math.max(...soldDates) : null;
      const daysSinceSale = lastSaleTime
        ? Math.max(0, Math.floor((Date.now() - lastSaleTime) / 86400000))
        : null;

      return {
        product: productName,
        daysSinceSale: daysSinceSale ?? 0,
        currentStock: Number(product.stock_qty || 0),
      };
    })
    .filter((entry) => entry.daysSinceSale > 0)
    .sort((a, b) => b.daysSinceSale - a.daysSinceSale)
    .slice(0, 10);

  const categoryMap: Record<string, number> = {};
  products.forEach((product) => {
    const category =
      String(product.category || product.type || "General").trim() || "General";
    categoryMap[category] =
      (categoryMap[category] || 0) +
      Number(product.stock_qty || 0) * Number(product.price || 0);
  });

  const categoryValueData = Object.entries(categoryMap)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  const categorySalesMap: Record<string, number> = {};
  filteredOrders.forEach((order) => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach((item: any) => {
      const itemName = String(item.name || "").toLowerCase();
      const productMatch = products.find(
        (product) =>
          String(product.name || product.productName || "").toLowerCase() ===
            itemName ||
          String(product.tagUID || product.id || "") ===
            String(item.tagUID || ""),
      );
      const category =
        String(
          productMatch?.category ||
            productMatch?.type ||
            item.category ||
            "General",
        ).trim() || "General";
      const value = Number(item.price || 0) * (Number(item.qty) || 1);
      categorySalesMap[category] = (categorySalesMap[category] || 0) + value;
    });
  });

  const topCategories = Object.entries(categorySalesMap)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topCategoryTotal = topCategories.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );

  const dailyScanActivity = (() => {
    const scanMap: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const date = order.createdAt?.split("T")[0] || "TODAY";
      const totalItems = Array.isArray(order.items) ? order.items.length : 0;
      scanMap[date] = (scanMap[date] || 0) + totalItems;
    });
    const labels = Object.keys(scanMap).sort().slice(-7);
    return {
      labels,
      values: labels.map((label) => scanMap[label] || 0),
    };
  })();

  const rfidScanChartData = {
    labels: dailyScanActivity.labels,
    datasets: [
      {
        label: "RFID Scan Activity",
        data: dailyScanActivity.values,
        backgroundColor: "#6c4cff",
        borderRadius: 10,
      },
    ],
  };

  const stockInVsOutChartData = {
    labels: ["Stock In", "Stock Out"],
    datasets: [
      {
        label: "Units",
        data: [totalUnitsInStock, totalUnitsSold],
        backgroundColor: ["#ffd166", "#ff4d6d"],
        borderRadius: 10,
      },
    ],
  };

  const inventoryValueChartData = {
    labels: categoryValueData.map((item) => item.category),
    datasets: [
      {
        label: "Inventory Value",
        data: categoryValueData.map((item) => item.value),
        backgroundColor: [
          "#6c4cff",
          "#32d6ff",
          "#1ed760",
          "#ff8a4c",
          "#ff4d6d",
          "#ffd166",
        ],
      },
    ],
  };

  const reportSummaryRows = [
    { Metric: "Total Products", Value: totalProducts },
    { Metric: "Low Stock Alert", Value: lowStockAlert },
    { Metric: "Out of Stock", Value: outOfStock },
    {
      Metric: "Total Inventory Value",
      Value: formatCurrency(totalInventoryValue),
    },
    { Metric: "Total Sales", Value: formatCurrency(totalSales) },
    { Metric: "Total Profit", Value: formatCurrency(totalProfit) },
    { Metric: "Inventory Turnover", Value: inventoryTurnover },
  ];

  const exportSummary = () => {
    exportRowsAsFile(reportSummaryRows, "inventory-report-summary.csv", "csv");
  };

  const exportSummaryXls = () => {
    exportRowsAsFile(reportSummaryRows, "inventory-report-summary.xls", "xls");
  };

  const exportPdf = () => {
    const sections = [
      { title: "Summary", rows: reportSummaryRows },
      {
        title: "Low Stock Products",
        rows: lowStockProducts.map((row) => ({
          Product: row.product,
          "Current Stock": row.currentStock,
          Minimum: row.minimum,
          Status: row.status,
        })),
      },
      {
        title: "Dead / Slow Stock",
        rows: slowStockProducts.map((row) => ({
          Product: row.product,
          "Days Since Sale": row.daysSinceSale,
          "Current Stock": row.currentStock,
        })),
      },
      {
        title: "Inventory Value by Category",
        rows: categoryValueData.map((row) => ({
          Category: row.category,
          Value: formatCurrency(row.value),
        })),
      },
    ];
    exportPdfReport("Smart Billing Inventory Report", sections);
  };

  // 3. Daily Revenue (for line chart)
  const dailyRevenueMap: { [date: string]: number } = {};
  filteredOrders.forEach((order) => {
    const date = order.createdAt?.split("T")[0] || "TODAY";
    dailyRevenueMap[date] =
      (dailyRevenueMap[date] || 0) + (Number(order.total) || 0);
  });
  const dailyLabelsAll = Object.keys(dailyRevenueMap).sort();
  const last7Labels = dailyLabelsAll.slice(-7);
  const dailyRevenue = last7Labels.map((d) => dailyRevenueMap[d]);

  // 4. Simple Avg Daily (based on unique dates in the orders)
  const uniqueDates = new Set(
    filteredOrders.map((o) => o.createdAt?.split("T")[0]),
  );
  const avgDaily =
    uniqueDates.size > 0 ? (totalRevenue / uniqueDates.size).toFixed(2) : 0;

  // --- Chart Data ---
  const bestsellersChartData = {
    labels: sortedBestsellers.map(([name]) => name),
    datasets: [
      {
        label: "Units Sold",
        data: sortedBestsellers.map(([, count]) => count),
        backgroundColor: "#6c4cff",
        borderRadius: 8,
      },
    ],
  };

  const dailyRevenueChartData = {
    labels: last7Labels,
    datasets: [
      {
        label: "Revenue",
        data: dailyRevenue,
        fill: false,
        borderColor: "#1ed760",
        backgroundColor: "#23233a",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#6c4cff",
      },
    ],
  };

  if (loading) {
    return (
      <div
        style={{
          color: "#fff",
          textAlign: "center",
          paddingTop: "100px",
          background: "#11111a",
          height: "100vh",
        }}
      >
        Loading Analytics...
      </div>
    );
  }

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
                onClick={() => nav("/inventory/reports-analytics")}
              >
                Reports & Analytics
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 32,
                      margin: 0,
                    }}
                  >
                    Reports & Analytics
                  </h2>
                  <div style={{ color: "#bbaaff", fontSize: 16, marginTop: 8 }}>
                    Insights derived from {filteredOrders.length} orders in the
                    selected range
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    background: "#181824",
                    borderRadius: 12,
                    padding: 6,
                    border: "1px solid #2d2d3d",
                  }}
                >
                  {[
                    { label: "7D", value: "7" },
                    { label: "30D", value: "30" },
                    { label: "90D", value: "90" },
                    { label: "All", value: "all" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value as any)}
                      style={{
                        background:
                          dateRange === option.value
                            ? "#6c4cff"
                            : "transparent",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        minWidth: 56,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={exportSummary}
                style={{
                  background: "#23233a",
                  color: "#fff",
                  border: "1px solid #6c4cff",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Export CSV
              </button>
              <button
                onClick={exportSummaryXls}
                style={{
                  background: "#23233a",
                  color: "#fff",
                  border: "1px solid #32d6ff",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Export XLS
              </button>
              <button
                onClick={exportPdf}
                style={{
                  background: "#6c4cff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Export PDF
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
                marginBottom: 26,
              }}
            >
              {analyticsSummary.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#181824",
                    borderRadius: 20,
                    padding: "24px 22px",
                    border: `1px solid ${item.accent}33`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    minHeight: 120,
                  }}
                >
                  <div
                    style={{
                      color: item.accent,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: 24,
                      fontWeight: 800,
                      marginTop: 10,
                      marginBottom: 6,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ color: "#bbaaff", fontSize: 12 }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr 0.85fr",
                gap: 24,
                marginBottom: 28,
              }}
            >
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Top Performing Categories</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {topCategories.length > 0 ? (
                    topCategories.map((category, index) => {
                      const share = topCategoryTotal
                        ? (category.revenue / topCategoryTotal) * 100
                        : 0;

                      return (
                        <div key={category.category}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              color: "#fff",
                              marginBottom: 6,
                              fontSize: 14,
                            }}
                          >
                            <span>
                              <span
                                style={{ color: "#bbaaff", marginRight: 8 }}
                              >
                                #{index + 1}
                              </span>
                              {category.category}
                            </span>
                            <strong>{formatCurrency(category.revenue)}</strong>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 8,
                              background: "#23233a",
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.max(share, 10)}%`,
                                height: "100%",
                                background:
                                  index % 2 === 0
                                    ? "linear-gradient(90deg, #6c4cff, #8d7bff)"
                                    : "linear-gradient(90deg, #1ed760, #6be7a0)",
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: "#888" }}>
                      No category revenue yet.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "24px 22px" }}>
                <h3 style={cardTitleStyle}>Executive Snapshot</h3>
                <div style={{ display: "grid", gap: 12, color: "#fff" }}>
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#23233a",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ color: "#bbaaff", fontSize: 12 }}>
                      Revenue
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      {formatCurrency(totalRevenue)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#23233a",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ color: "#bbaaff", fontSize: 12 }}>
                      Avg. daily revenue
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      ₹{avgDaily}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#23233a",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ color: "#bbaaff", fontSize: 12 }}>
                      Inventory health
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      {lowStockAlert} at risk
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ ...cardStyle, minWidth: "320px" }}>
                <h3 style={cardTitleStyle}>Stock In vs Stock Out</h3>
                <div style={{ height: 220 }}>
                  <Bar
                    data={stockInVsOutChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                        y: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                      },
                    }}
                  />
                </div>
                <div style={{ marginTop: 18, color: "#bbaaff", fontSize: 14 }}>
                  Units in stock:{" "}
                  <strong style={{ color: "#fff" }}>
                    {formatNumber(totalUnitsInStock)}
                  </strong>
                  &nbsp; | &nbsp; Units sold:{" "}
                  <strong style={{ color: "#fff" }}>
                    {formatNumber(totalUnitsSold)}
                  </strong>
                </div>
              </div>

              <div style={{ ...cardStyle, minWidth: "320px" }}>
                <h3 style={cardTitleStyle}>Inventory Turnover</h3>
                <div
                  style={{ marginBottom: 12, color: "#bbaaff", fontSize: 14 }}
                >
                  Current turnover ratio
                </div>
                <div style={{ color: "#fff", fontSize: 42, fontWeight: 800 }}>
                  {inventoryTurnover}
                </div>
                <div style={{ marginTop: 18, color: "#bbaaff", fontSize: 14 }}>
                  Based on {formatNumber(totalUnitsSold)} units sold and{" "}
                  {formatNumber(totalUnitsInStock)} units currently stocked.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                marginTop: 28,
              }}
            >
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Low Stock Products</h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#fff",
                  }}
                >
                  <thead>
                    <tr style={{ color: "#bbaaff", textAlign: "left" }}>
                      <th style={tableHeaderStyle}>Product</th>
                      <th style={tableHeaderStyle}>Current Stock</th>
                      <th style={tableHeaderStyle}>Minimum</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map((row) => (
                        <tr
                          key={row.product}
                          style={{ borderBottom: "1px solid #23233a" }}
                        >
                          <td style={tableCellStyle}>{row.product}</td>
                          <td style={tableCellStyle}>{row.currentStock}</td>
                          <td style={tableCellStyle}>{row.minimum}</td>
                          <td
                            style={{
                              ...tableCellStyle,
                              color:
                                row.status === "Out of Stock"
                                  ? "#ff6b81"
                                  : "#ffb86b",
                            }}
                          >
                            {row.status}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ ...tableCellStyle, color: "#888" }}
                        >
                          No low stock items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Dead / Slow Stock</h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#fff",
                  }}
                >
                  <thead>
                    <tr style={{ color: "#bbaaff", textAlign: "left" }}>
                      <th style={tableHeaderStyle}>Product</th>
                      <th style={tableHeaderStyle}>Days Since Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowStockProducts.length > 0 ? (
                      slowStockProducts.map((row) => (
                        <tr
                          key={row.product}
                          style={{ borderBottom: "1px solid #23233a" }}
                        >
                          <td style={tableCellStyle}>{row.product}</td>
                          <td style={tableCellStyle}>
                            {row.daysSinceSale} days
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          style={{ ...tableCellStyle, color: "#888" }}
                        >
                          No slow-moving products
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                marginTop: 28,
              }}
            >
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>RFID Scan Activity</h3>
                <div style={{ height: 240 }}>
                  <Bar
                    data={rfidScanChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                        y: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Inventory Value by Category</h3>
                <div style={{ height: 240 }}>
                  <Bar
                    data={inventoryValueChartData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                        y: {
                          ticks: { color: "#bbaaff" },
                          grid: { color: "#23233a" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                marginTop: 28,
              }}
            >
              {/* Bestsellers Card + Bar Chart */}
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Top Bestsellers</h3>
                <div style={{ marginBottom: 24 }}>
                  <Bar
                    data={bestsellersChartData}
                    options={{
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        x: {
                          grid: { color: "#23233a" },
                          ticks: { color: "#bbaaff" },
                        },
                        y: {
                          grid: { color: "#23233a" },
                          ticks: { color: "#bbaaff" },
                        },
                      },
                      responsive: true,
                      maintainAspectRatio: false,
                      //   height: 220,
                    }}
                    height={220}
                  />
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sortedBestsellers.length > 0 ? (
                    sortedBestsellers.map(([name, count], idx) => (
                      <li
                        key={name}
                        style={{
                          color: "#fff",
                          padding: "10px 0",
                          borderBottom: "1px solid #23233a",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <span style={{ color: "#bbaaff", marginRight: 10 }}>
                            #{idx + 1}
                          </span>{" "}
                          {name}
                        </span>
                        <span style={{ fontWeight: 700 }}>{count} sold</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "#888" }}>No sales data yet</li>
                  )}
                </ul>
              </div>

              {/* Revenue Card + Line Chart */}
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Financial Overview</h3>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: "#bbaaff", fontSize: 14 }}>
                    Total Revenue
                  </div>
                  <div
                    style={{ color: "#1ed760", fontSize: 36, fontWeight: 800 }}
                  >
                    ₹{totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    background: "#23233a",
                    padding: "15px",
                    borderRadius: "12px",
                    marginBottom: 24,
                  }}
                >
                  <div style={{ color: "#bbaaff", fontSize: 13 }}>
                    Average per Day
                  </div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
                    ₹{avgDaily}
                  </div>
                </div>
                <div style={{ height: 220 }}>
                  <Line
                    data={dailyRevenueChartData}
                    options={{
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        x: {
                          grid: { color: "#23233a" },
                          ticks: { color: "#bbaaff" },
                        },
                        y: {
                          grid: { color: "#23233a" },
                          ticks: { color: "#bbaaff" },
                        },
                      },
                      responsive: true,
                      maintainAspectRatio: false,
                      //   height: 220,
                    }}
                    height={220}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styling Objects
const cardStyle: React.CSSProperties = {
  background: "#181824",
  borderRadius: "24px",
  padding: "32px",
  flex: "1",
  minWidth: "300px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
};

const cardTitleStyle: React.CSSProperties = {
  color: "#bbaaff",
  fontSize: "20px",
  fontWeight: 700,
  marginBottom: "20px",
  borderBottom: "2px solid #23233a",
  paddingBottom: "10px",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 10px 10px 0",
  borderBottom: "1px solid #23233a",
  fontSize: 13,
  fontWeight: 700,
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 10px 12px 0",
  fontSize: 14,
};
