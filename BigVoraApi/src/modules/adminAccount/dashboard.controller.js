const Order = require("../order/order.model");
const Product = require("../product/product.model");
const Category = require("../category/category.model");
const User = require("../auth/user.model");

const startOfIndiaDay = (daysAgo) => {
  const now = new Date();
  const indiaOffset = 330 * 60 * 1000;
  const india = new Date(now.getTime() + indiaOffset);
  india.setUTCHours(0, 0, 0, 0);
  india.setUTCDate(india.getUTCDate() - daysAgo);
  return new Date(india.getTime() - indiaOffset);
};

async function summary(req, res, next) {
  try {
    const today = startOfIndiaDay(0);
    const tomorrow = startOfIndiaDay(-1);
    const weekStart = startOfIndiaDay(6);
    const activeOrders = {
      status: { $nin: ["cancelled", "payment_pending"] },
    };
    const [
      totalSalesResult,
      todaySalesResult,
      orderCount,
      todayOrderCount,
      fulfilledToday,
      productCount,
      lowStockCount,
      outOfStockCount,
      customerCount,
      newCustomersThisWeek,
      categoryCount,
      recentOrders,
      sevenDaySales,
    ] = await Promise.all([
      Order.aggregate([
        { $match: activeOrders },
        { $group: { _id: null, value: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            ...activeOrders,
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, value: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.countDocuments({
        status: "delivered",
        updatedAt: { $gte: today, $lt: tomorrow },
      }),
      Product.countDocuments(),
      Product.countDocuments({
        $expr: {
          $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$reorderLevel"] }],
        },
      }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: weekStart, $lt: tomorrow },
      }),
      Category.countDocuments(),
      Order.find()
        .populate("customerId", "fullName")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([
        {
          $match: {
            ...activeOrders,
            createdAt: { $gte: weekStart, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            value: { $sum: "$total" },
          },
        },
      ]),
    ]);
    const salesByDate = new Map(
      sevenDaySales.map((item) => [item._id, item.value])
    );
    const salesChart = Array.from({ length: 7 }, (_, index) => {
      const date = startOfIndiaDay(6 - index);
      const indiaDate = new Date(date.getTime() + 330 * 60 * 1000);
      const key = indiaDate.toISOString().slice(0, 10);
      return { date: key, value: salesByDate.get(key) || 0 };
    });
    return res.json({
      success: true,
      data: {
        today: {
          sales: todaySalesResult[0]?.value || 0,
          orders: todayOrderCount,
          fulfilled: fulfilledToday,
        },
        totals: {
          revenue: totalSalesResult[0]?.value || 0,
          orders: orderCount,
          products: productCount,
          customers: customerCount,
          categories: categoryCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          newCustomersThisWeek,
        },
        salesChart,
        recentOrders: recentOrders.map((order) => ({
          id: String(order._id),
          orderNumber: order.orderNumber,
          customer:
            order.customerId?.fullName || order.address?.name || "Customer",
          total: order.total || 0,
          status: order.status,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { summary };
