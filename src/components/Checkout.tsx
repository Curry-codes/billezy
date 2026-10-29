import { useLocation, useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import { ensureAuthenticatedUser, functions, rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { httpsCallable } from "firebase/functions";

type CartItem = { tagUID: string; name?: string; price?: number };
type PaymentOrderItem = { tagUID: string; name: string; price: number };
type PaymentOrder = {
  orderId: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  items: PaymentOrderItem[];
};
type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  handler: (response: RazorpayPaymentResponse) => Promise<void>;
  prefill: { name: string };
  theme: { color: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function Checkout() {
  const loc = useLocation();
  const nav = useNavigate();
  const [items, setItems] = useState<CartItem[]>(
    (loc.state as { items?: CartItem[] } | null)?.items || [],
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (
        !rtdb ||
        !items.some((item) => !item.name || item.price === undefined)
      ) {
        return;
      }
      const updated = await Promise.all(
        items.map(async (it) => {
          if (it.name && it.price) return it;
          try {
            const prodSnap = await get(ref(rtdb, `/products/${it.tagUID}`));
            if (prodSnap.exists()) {
              const data = prodSnap.val();
              return {
                ...it,
                name: data.productName || data.name || it.tagUID,
                price: data.price || 0,
              };
            }
          } catch (e) {
            console.error("Fetch error:", e);
          }
          return it;
        }),
      );
      if (updated.some((item, index) => item !== items[index])) {
        setItems(updated);
      }
    }
    fetchDetails();
  }, [items]);

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0);

  const handleRazorpay = async () => {
    if (total <= 0) return alert("Cart is empty");

    setProcessing(true);

    try {
      await ensureAuthenticatedUser();
      const createOrder = httpsCallable<{ tagUIDs: string[] }, PaymentOrder>(
        functions,
        "createPaymentOrder",
      );
      const { data: paymentOrder } = await createOrder({
        tagUIDs: items.map((item) => item.tagUID),
      });

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Unable to load Razorpay checkout."));
          document.body.appendChild(script);
        });
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not initialize.");
      }

      const options: RazorpayOptions = {
        key: paymentOrder.keyId,
        order_id: paymentOrder.razorpayOrderId,
        amount: paymentOrder.amount,

        currency: "INR",

        name: "Smart Billing",

        handler: async (response) => {
          setProcessing(true);
          try {
            const confirmPayment = httpsCallable(
              functions,
              "confirmRazorpayPayment",
            );
            await confirmPayment({
              orderId: paymentOrder.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            nav("/final-bill", {
              state: {
                success: true,
                orderId: paymentOrder.orderId,
                items: paymentOrder.items,
                status: "paid",
              },
            });
          } catch (err) {
            console.error("Payment confirmation failed:", err);
            alert("Payment could not be verified. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },

        prefill: { name: "Customer" },

        theme: { color: "#232526" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Payment initiation failed:", e);
      alert(
        "Unable to start checkout. Confirm Firebase Functions and Razorpay are configured.",
      );
    } finally {
      setProcessing(false);
    }
  };

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
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: 28,
              margin: 0,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            ORDER SUMMARY
          </h2>
          <p
            style={{
              color: "#bbaaff",
              margin: 0,
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 18,
            }}
          >
            Please check and confirm all the items before proceeding to checkout
          </p>
          {/* Items List */}
          <div
            style={{
              width: "100%",
              marginBottom: 18,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {items.length === 0 ? (
              <div style={{ color: "#888", textAlign: "center", padding: 32 }}>
                No items in cart
              </div>
            ) : (
              items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#23233a",
                    borderRadius: 16,
                    marginBottom: 12,
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px 0 #6c4cff11",
                    borderLeft: "3px solid #6c4cff",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#181824",
                      color: "#bbaaff",
                      fontWeight: 700,
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 18,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}
                    >
                      {it.name}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 17,
                      marginRight: 18,
                    }}
                  >
                    ₹{(Number(it.price) || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Totals */}
          <div style={{ width: "100%", marginBottom: 18 }}>
            <div
              style={{
                color: "#bbaaff",
                fontWeight: 500,
                fontSize: 15,
                marginBottom: 2,
              }}
            >
              Item(s) subtotal
            </div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 2,
              }}
            >
              SUBTOTAL
            </div>
            <div
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: 24,
                marginBottom: 2,
              }}
            >
              ORDER TOTAL
            </div>
            <div
              style={{
                color: "#bbaaff",
                fontWeight: 700,
                fontSize: 18,
                textAlign: "right",
              }}
            >
              ₹{total.toLocaleString()}
            </div>
          </div>
          {/* Pay Now Button */}
          <button
            onClick={handleRazorpay}
            disabled={processing || items.length === 0}
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
              cursor: processing ? "not-allowed" : "pointer",
              letterSpacing: 1,
              transition: "background 0.2s",
            }}
          >
            {processing ? "Processing..." : "Pay Now"}
          </button>
          <div
            style={{
              width: "100%",
              marginTop: 12,
              display: "flex",
              justifyContent: "flex-start",
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
              onClick={() => nav(-1)}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
