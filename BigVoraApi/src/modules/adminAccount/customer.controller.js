const mongoose = require("mongoose");
const User = require("../auth/user.model");
const Order = require("../order/order.model");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const presentSummary = (customer) => ({
  id: String(customer._id),
  name: customer.fullName,
  email: customer.email || "",
  mobile: customer.mobile || "",
  isActive: customer.isActive,
  orderCount: customer.orderCount || 0,
  totalSpent: customer.totalSpent || 0,
  lastOrderAt: customer.lastOrderAt || null,
  joinedAt: customer.createdAt,
});

async function list(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
    );
    const match = { role: "customer" };
    const search = String(req.query.search || "").trim();
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      match.$or = [
        { fullName: expression },
        { email: expression },
        { mobile: expression },
      ];
    }
    const [result] = await User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: Order.collection.name,
          localField: "_id",
          foreignField: "customerId",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
          totalSpent: { $sum: "$orders.total" },
          lastOrderAt: { $max: "$orders.createdAt" },
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          customers: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                fullName: 1,
                email: 1,
                mobile: 1,
                isActive: 1,
                orderCount: 1,
                totalSpent: 1,
                lastOrderAt: 1,
                createdAt: 1,
              },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);
    const total = result?.count?.[0]?.total || 0;
    return res.json({
      success: true,
      data: {
        customers: (result?.customers || []).map(presentSummary),
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer." });
    }
    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    })
      .select("fullName email mobile isActive addresses createdAt updatedAt")
      .lean();
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }
    const [orders, totals] = await Promise.all([
      Order.find({ customerId: customer._id })
        .select(
          "orderNumber status total payment shipment itemCount createdAt items"
        )
        .sort({ createdAt: -1, _id: -1 })
        .limit(20)
        .lean(),
      Order.aggregate([
        { $match: { customerId: customer._id } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);
    const stats = totals[0] || {};
    return res.json({
      success: true,
      data: {
        customer: {
          id: String(customer._id),
          name: customer.fullName,
          email: customer.email || "",
          mobile: customer.mobile || "",
          isActive: customer.isActive,
          joinedAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          addresses: (customer.addresses || []).map((address) => ({
            id: String(address._id),
            label: address.label,
            name: address.name,
            phone: address.phone,
            line: address.line,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isDefault: address.isDefault,
          })),
          orderCount: stats.orderCount || 0,
          totalSpent: stats.totalSpent || 0,
          averageOrderValue: stats.averageOrderValue || 0,
          lastOrderAt: stats.lastOrderAt || null,
          recentOrders: orders.map((order) => ({
            id: String(order._id),
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            itemCount: (order.items || []).reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            paymentMethod: order.payment?.method || "",
            shipmentStatus: order.shipment?.status || "not_ready",
            createdAt: order.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, detail };
