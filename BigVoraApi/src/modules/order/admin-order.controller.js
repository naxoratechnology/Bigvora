const mongoose = require('mongoose');
const Order = require('./order.model');

const presentCustomer = customer => ({
  id: customer?._id ? String(customer._id) : '',
  name: customer?.fullName || 'Customer',
  email: customer?.email || '',
  mobile: customer?.mobile || '',
});

const present = order => ({
  id: String(order._id),
  orderNumber: order.orderNumber,
  customer: presentCustomer(order.customerId),
  items: (order.items || []).map(item => ({
    productId: String(item.productId),
    name: item.name,
    sku: item.sku || '',
    image: item.image || '',
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  })),
  itemCount: (order.items || []).reduce(
    (total, item) => total + item.quantity,
    0,
  ),
  address: order.address,
  subtotal: order.subtotal,
  deliveryFee: order.deliveryFee,
  total: order.total,
  status: order.status,
  payment: {
    method: order.payment?.method || '',
    status: order.payment?.status || '',
    razorpayOrderId: order.payment?.razorpayOrderId || '',
    razorpayPaymentId: order.payment?.razorpayPaymentId || '',
  },
  shipment: {
    status: order.shipment?.status || 'not_ready',
    awb: order.shipment?.awb || '',
    message: order.shipment?.message || '',
    currentStatus: order.shipment?.currentStatus || '',
    expectedDeliveryDate: order.shipment?.expectedDeliveryDate || '',
    lastLocation: order.shipment?.lastLocation || '',
    lastRemark: order.shipment?.lastRemark || '',
    syncedAt: order.shipment?.syncedAt || null,
  },
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

async function list(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25),
    );
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    const search = String(req.query.search || '').trim();
    if (search) {
      filter.orderNumber = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customerId', 'fullName email mobile')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      data: {
        orders: orders.map(present),
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

async function detail(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order.' });
    }
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'fullName email mobile')
      .lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, data: { order: present(order) } });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const allowed = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'];
    const status = String(req.body.status || '').trim().toLowerCase();
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid order status.',
      });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    order.status = status;
    await order.save();
    await order.populate('customerId', 'fullName email mobile');
    return res.json({ success: true, data: { order: present(order) } });
  } catch (error) {
    return next(error);
  }
}

const mapOrderStatus = courierStatus => {
  const value = courierStatus.toLowerCase();
  if (value.includes('delivered') && !value.includes('undelivered')) return 'delivered';
  if (value.includes('out for delivery') || value.includes('in transit') || value.includes('picked up')) return 'shipped';
  if (value.includes('manifest') || value.includes('booked')) return 'packed';
  if (value.includes('cancel')) return 'cancelled';
  return '';
};

async function syncShipment(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (!order.shipment?.awb) {
      return res.status(409).json({
        success: false,
        message: 'This order does not have an AWB number yet.',
      });
    }
    const accessToken = process.env.ITHINK_ACCESS_TOKEN;
    const secretKey = process.env.ITHINK_SECRET_KEY;
    if (!accessToken || !secretKey) {
      return res.status(503).json({
        success: false,
        message: 'Delivery partner credentials are not configured.',
      });
    }
    const response = await fetch(
      process.env.ITHINK_TRACKING_URL ||
        'https://api.ithinklogistics.com/api_v3/order/track.json',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          data: {
            awb_number_list: order.shipment.awb,
            access_token: accessToken,
            secret_key: secretKey,
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    const tracking = result?.data?.[order.shipment.awb];
    if (!response.ok || !tracking || tracking.message === 'failure') {
      throw Object.assign(
        new Error(tracking?.message || result?.message || 'Delivery status could not be synced.'),
        { status: 502 },
      );
    }
    const currentStatus =
      tracking.current_status || tracking.last_scan_details?.status || '';
    order.shipment.currentStatus = currentStatus;
    order.shipment.status = currentStatus || order.shipment.status;
    order.shipment.expectedDeliveryDate =
      tracking.expected_delivery_date || tracking.promise_delivery_date || '';
    order.shipment.lastLocation =
      tracking.last_scan_details?.scan_location || '';
    order.shipment.lastRemark =
      tracking.last_scan_details?.remark ||
      tracking.last_scan_details?.reason ||
      '';
    order.shipment.message = 'Synced with iThink Logistics.';
    order.shipment.syncedAt = new Date();
    const syncedOrderStatus = mapOrderStatus(currentStatus);
    if (syncedOrderStatus) order.status = syncedOrderStatus;
    await order.save();
    await order.populate('customerId', 'fullName email mobile');
    return res.json({ success: true, data: { order: present(order) } });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      error.status = 504;
      error.message = 'Delivery partner sync timed out. Please try again.';
    }
    return next(error);
  }
}

module.exports = { list, detail, updateStatus, syncShipment };
