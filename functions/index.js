const crypto = require("node:crypto");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getDatabase } = require("firebase-admin/database");
const { defineSecret } = require("firebase-functions/params");

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
const databaseURL = process.env.FIREBASE_DATABASE_URL || firebaseConfig.databaseURL;
if (!databaseURL) {
  throw new Error("Realtime Database URL is missing from Firebase configuration.");
}
admin.initializeApp({ databaseURL });

const rtdb = getDatabase();
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioFrom = defineSecret("TWILIO_FROM");

function requireSignedIn(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Sign in before starting checkout.",
    );
  }
}

function isStaff(context) {
  return ["admin", "staff"].includes(context.auth?.token?.role);
}

function validateReceiptOrder(order, context) {
  if (!order) {
    throw new functions.https.HttpsError(
      "not-found",
      "Order not found.",
    );
  }
  if (order.status !== "paid") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The order must be paid before its receipt can be sent.",
    );
  }
  if (order.uid !== context.auth.uid && !isStaff(context)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to send this order's receipt.",
    );
  }
  if (order.billSent) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The receipt for this order has already been sent.",
    );
  }
  if (order.billSending) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The receipt for this order is already being sent.",
    );
  }
}

async function razorpayRequest(path, method, body, keyId, keySecret) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Razorpay request failed", response.status, result.error?.code);
    throw new Error("Razorpay request failed.");
  }
  return result;
}

async function findProductByTag(tagUID) {
  const direct = await rtdb.ref(`products/${tagUID}`).get();
  if (direct.exists()) return { key: tagUID, product: direct.val() };

  for (const field of ["tagId", "tagUID"]) {
    const snapshot = await rtdb
      .ref("products")
      .orderByChild(field)
      .equalTo(tagUID)
      .limitToFirst(1)
      .get();
    if (snapshot.exists()) {
      const [key, product] = Object.entries(snapshot.val())[0];
      return { key, product };
    }
  }
  return null;
}

exports.createPaymentOrder = functions
  .region("us-central1")
  .runWith({ secrets: [razorpayKeyId, razorpayKeySecret] })
  .https.onCall(async (data, context) => {
    requireSignedIn(context);
    const tagUIDs = data?.tagUIDs;
    if (
      !Array.isArray(tagUIDs) ||
      tagUIDs.length < 1 ||
      tagUIDs.length > 20 ||
      tagUIDs.some(
        (tag) => typeof tag !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(tag),
      ) ||
      new Set(tagUIDs).size !== tagUIDs.length
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Provide a valid list of unique product tags.",
      );
    }

    try {
      const products = await Promise.all(
        tagUIDs.map(async (tagUID) => {
          const found = await findProductByTag(tagUID);
          const product = found?.product;
          if (
            !found ||
            (product.active_status && product.active_status !== "Active") ||
            !Number.isFinite(Number(product.price)) ||
            Number(product.price) <= 0
          ) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              `Product ${tagUID} is unavailable.`,
            );
          }
          return {
            tagUID,
            productKey: found.key,
            name: String(product.productName || product.name || tagUID),
            price: Number(product.price),
          };
        }),
      );
      const amount = Math.round(
        products.reduce((sum, product) => sum + product.price, 0) * 100,
      );
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "The order total is invalid.",
        );
      }

      const orderRef = rtdb.ref("orders").push();
      const orderId = orderRef.key;
      const keyId = razorpayKeyId.value();
      const keySecret = razorpayKeySecret.value();
      if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are not configured.");
      }

      const razorpayOrder = await razorpayRequest(
        "/orders",
        "POST",
        { amount, currency: "INR", receipt: orderId },
        keyId,
        keySecret,
      );
      await orderRef.set({
        uid: context.auth.uid,
        items: products,
        total: amount / 100,
        status: "pending",
        razorpayOrderId: razorpayOrder.id,
        createdAt: new Date().toISOString(),
      });

      return {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        keyId,
        amount,
        items: products,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error("Payment order creation failed", error);
      throw new functions.https.HttpsError(
        "internal",
        "Unable to initialize payment.",
      );
    }
  });

exports.confirmRazorpayPayment = functions
  .region("us-central1")
  .runWith({ secrets: [razorpayKeyId, razorpayKeySecret] })
  .https.onCall(async (data, context) => {
    requireSignedIn(context);
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      data || {};
    if (
      typeof orderId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(orderId) ||
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(razorpaySignature)
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Payment details are invalid.",
      );
    }

    try {
      const keyId = razorpayKeyId.value();
      const keySecret = razorpayKeySecret.value();
      const orderRef = rtdb.ref(`orders/${orderId}`);
      const snapshot = await orderRef.get();
      const order = snapshot.val();
      if (!snapshot.exists() || order.uid !== context.auth.uid) {
        throw new functions.https.HttpsError(
          "not-found",
          "Order not found.",
        );
      }
      if (order.status === "paid") {
        if (order.razorpay_id === razorpayPaymentId) return { ok: true };
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This order has already been paid.",
        );
      }
      if (
        order.status !== "pending" ||
        order.razorpayOrderId !== razorpayOrderId
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Payment does not match this order.",
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest();
      const suppliedSignature = Buffer.from(razorpaySignature, "hex");
      if (!crypto.timingSafeEqual(expectedSignature, suppliedSignature)) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Payment signature is invalid.",
        );
      }

      const payment = await razorpayRequest(
        `/payments/${encodeURIComponent(razorpayPaymentId)}`,
        "GET",
        null,
        keyId,
        keySecret,
      );
      if (
        payment.order_id !== razorpayOrderId ||
        payment.status !== "captured" ||
        payment.amount !== Math.round(Number(order.total) * 100) ||
        payment.currency !== "INR"
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Payment is not captured for the expected amount.",
        );
      }

      const updates = {
        [`orders/${orderId}`]: {
          ...order,
          status: "paid",
          payment_method: "Razorpay",
          razorpay_id: razorpayPaymentId,
          paidAt: new Date().toISOString(),
          billSent: false,
        },
        scannedItems: null,
      };
      for (const item of order.items) {
        const productSnapshot = await rtdb
          .ref(`products/${item.productKey || item.tagUID}`)
          .get();
        if (!productSnapshot.exists()) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "A product in this order is no longer available.",
          );
        }
        updates[
          `products/${item.productKey || item.tagUID}/active_status`
        ] = "Deactivated";
      }
      await rtdb.ref().update(updates);
      return { ok: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error("Payment confirmation failed", error);
      throw new functions.https.HttpsError(
        "internal",
        "Unable to confirm payment.",
      );
    }
  });

exports.sendTwilio = functions
  .region("us-central1")
  .runWith({ secrets: [twilioSid, twilioToken, twilioFrom] })
  .https.onCall(async (data, context) => {
    requireSignedIn(context);
    const { orderId, name, phone } = data || {};
    if (
      typeof orderId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(orderId) ||
      typeof phone !== "string" ||
      !/^\+[1-9]\d{7,14}$/.test(phone) ||
      (name !== undefined &&
        (typeof name !== "string" || name.length > 32))
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Provide a valid order, name, and phone number.",
      );
    }

    const orderRef = rtdb.ref(`orders/${orderId}`);
    const snapshot = await orderRef.get();
    validateReceiptOrder(snapshot.val(), context);

    const transaction = await orderRef.transaction((order) => {
      if (
        !order ||
        order.status !== "paid" ||
        order.billSent ||
        order.billSending ||
        (order.uid !== context.auth.uid && !isStaff(context))
      ) {
        return;
      }
      order.billSending = true;
      order.name = name || "Customer";
      order.phone = phone;
      return order;
    });
    if (!transaction.committed) {
      validateReceiptOrder((await orderRef.get()).val(), context);
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The order changed while preparing the receipt. Please try again.",
      );
    }

    try {
      const twilio = require("twilio");
      const client = twilio(twilioSid.value(), twilioToken.value());
      await client.messages.create({
        body: `Hi ${name || "Customer"}, Order ${orderId} is successful. Please use this as your receipt. Thank you for shopping with us!`,
        from: twilioFrom.value(),
        to: phone,
      });
      await orderRef.update({
        billSending: false,
        billSent: true,
        billSentAt: new Date().toISOString(),
      });
      return { ok: true };
    } catch (error) {
      await orderRef.update({ billSending: false });
      console.error("SMS delivery failed", error);
      throw new functions.https.HttpsError(
        "internal",
        "Unable to send the receipt.",
      );
    }
  });
