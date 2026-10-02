const crypto = require("node:crypto"),
  Product = require("../product/product.model"),
  Order = require("./order.model");
const out = (o) => ({
  id: String(o._id),
  orderNumber: o.orderNumber,
  total: o.total,
  status: o.status,
  paymentStatus: o.payment.status,
  shipmentStatus: o.shipment.status,
  awb: o.shipment.awb || "",
});
async function stock(o) {
  if (o.inventoryCommitted) return;
  const done = [];
  try {
    for (const i of o.items) {
      const r = await Product.updateOne(
        { _id: i.productId, stock: { $gte: i.quantity } },
        { $inc: { stock: -i.quantity } }
      );
      if (!r.modifiedCount)
        throw Object.assign(new Error(i.name + " is out of stock."), {
          status: 409,
        });
      done.push(i);
    }
    o.inventoryCommitted = true;
    await o.save();
  } catch (e) {
    await Promise.all(
      done.map((i) =>
        Product.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } })
      )
    );
    throw e;
  }
}
async function ship(o, u) {
  const pickup = process.env.ITHINK_PICKUP_ADDRESS_ID,
    token = process.env.ITHINK_ACCESS_TOKEN,
    secret = process.env.ITHINK_SECRET_KEY;
  if (!pickup || !token || !secret) {
    o.shipment = {
      status: "pending_configuration",
      message: "Pickup address or credentials are not configured.",
    };
    return o.save();
  }
  const a = o.address,
    p = {
      order: o.orderNumber,
      order_date: new Date().toLocaleDateString("en-GB").replaceAll("/", "-"),
      total_amount: String(o.total),
      name: a.name,
      add: a.line,
      pin: a.pincode,
      city: a.city,
      state: a.state,
      country: "India",
      phone: a.phone,
      email: u.email || "",
      is_billing_same_as_shipping: "yes",
      products: o.items.map((i) => ({
        product_name: i.name,
        product_sku: i.sku,
        product_quantity: String(i.quantity),
        product_price: String(i.unitPrice),
        product_img_url: i.image,
      })),
      shipment_length: "10",
      shipment_width: "10",
      shipment_height: "10",
      weight: "0.5",
      shipping_charges: String(o.deliveryFee),
      cod_amount: o.payment.method === "cod" ? String(o.total) : "0",
      payment_mode: o.payment.method === "cod" ? "COD" : "Prepaid",
    };
  try {
    const r = await fetch(
        (process.env.ITHINK_API_BASE_URL ||
          "https://my.ithinklogistics.com/api_v3") + "/order/add.json",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              shipments: [p],
              pickup_address_id: pickup,
              access_token: token,
              secret_key: secret,
            },
          }),
        }
      ),
      d = await r.json(),
      x = d?.data?.[0] || d?.data || {},
      awb = x.awb_number || x.waybill || x.awb || "";
    o.shipment = {
      status:
        r.ok && (awb || d.status === "success") ? "booked" : "booking_failed",
      awb: String(awb),
      message: d.message || "",
    };
  } catch (e) {
    o.shipment = { status: "booking_failed", message: e.message };
  }
  await o.save();
}
async function checkout(req, res, next) {
  let o;
  try {
    const b = req.body,
      a = b.address || {};
    if (
      !["cod", "razorpay"].includes(b.paymentMethod) ||
      !Array.isArray(b.items) ||
      !b.items.length ||
      !a.name ||
      !/^\d{10}$/.test(String(a.phone || "").replace(/\D/g, "")) ||
      !a.line ||
      !a.city ||
      !a.state ||
      !/^\d{6}$/.test(a.pincode)
    )
      throw Object.assign(
        new Error("Complete cart and delivery address details are required."),
        { status: 400 }
      );
    const q = new Map(
        b.items.map((i) => [String(i.productId), Number(i.quantity)])
      ),
      ps = await Product.find({ _id: { $in: [...q.keys()] } });
    if (ps.length !== q.size)
      throw Object.assign(new Error("A product is unavailable."), {
        status: 409,
      });
    const items = ps.map((p) => {
        const n = q.get(String(p._id));
        if (!Number.isInteger(n) || n < 1 || p.stock < n)
          throw Object.assign(new Error(p.name + " is out of stock."), {
            status: 409,
          });
        return {
          productId: p._id,
          name: p.name,
          sku: p.sku,
          image: p.images?.[0] || "",
          unitPrice: p.price,
          quantity: n,
          lineTotal: p.price * n,
        };
      }),
      sub = items.reduce((s, i) => s + i.lineTotal, 0),
      deliveryFee = sub >= 499 ? 0 : 49;
    if (sub < 299) {
      throw Object.assign(
        new Error("Minimum order value is ₹299. Add more items to continue."),
        { status: 400 }
      );
    }
    o = await Order.create({
      orderNumber: "BV" + Date.now(),
      customerId: req.user._id,
      items,
      address: { ...a, phone: String(a.phone).replace(/\D/g, "") },
      subtotal: sub,
      deliveryFee,
      total: sub + deliveryFee,
      payment: {
        method: b.paymentMethod,
        status: b.paymentMethod === "cod" ? "cod_pending" : "pending",
      },
      status: b.paymentMethod === "cod" ? "confirmed" : "payment_pending",
    });
    if (b.paymentMethod === "cod") {
      await stock(o);
      await ship(o, req.user);
      return res.status(201).json({ success: true, data: { order: out(o) } });
    }
    const key = process.env.RAZORPAY_KEY_ID,
      sec = process.env.RAZORPAY_KEY_SECRET;
    if (!key || !sec)
      throw Object.assign(new Error("Online payment is unavailable."), {
        status: 503,
      });
    const r = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(key + ":" + sec).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(o.total * 100),
          currency: "INR",
          receipt: o.orderNumber,
        }),
      }),
      d = await r.json();
    if (!r.ok)
      throw Object.assign(
        new Error(d?.error?.description || "Payment could not start."),
        { status: 502 }
      );
    o.payment.razorpayOrderId = d.id;
    await o.save();
    res.status(201).json({
      success: true,
      data: {
        order: out(o),
        payment: {
          keyId: key,
          razorpayOrderId: d.id,
          amount: d.amount,
          currency: d.currency,
        },
      },
    });
  } catch (e) {
    next(e);
  }
}
async function verify(req, res, next) {
  try {
    const b = req.body,
      o = await Order.findOne({ _id: b.orderId, customerId: req.user._id });
    if (!o)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    const sig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(o.payment.razorpayOrderId + "|" + b.razorpayPaymentId)
      .digest("hex");
    if (sig !== b.razorpaySignature)
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed." });
    if (o.payment.status !== "paid") {
      await stock(o);
      o.payment.status = "paid";
      o.payment.razorpayPaymentId = b.razorpayPaymentId;
      o.status = "confirmed";
      await o.save();
      await ship(o, req.user);
    }
    res.json({ success: true, data: { order: out(o) } });
  } catch (e) {
    next(e);
  }
}
async function list(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1),
      limit = Math.min(
        50,
        Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
      ),
      filter = { customerId: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    const data = orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      payment: { method: order.payment?.method, status: order.payment?.status },
      shipment: {
        status: order.shipment?.status || "not_ready",
        awb: order.shipment?.awb || "",
      },
      items: (order.items || []).map((item) => ({
        productId: String(item.productId),
        name: item.name,
        sku: item.sku,
        image: item.image || "",
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      itemCount: (order.items || []).reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      address: order.address,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      data: {
        orders: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}
module.exports = { checkout, verify, list };
