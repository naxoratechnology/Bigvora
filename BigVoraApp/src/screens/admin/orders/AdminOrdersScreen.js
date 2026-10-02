import React from 'react';
import AdminPanelScreen from '../../../components/admin/AdminPanelScreen';
import { useAdminData } from '../../../features/admin/AdminDataContext';
export default function AdminOrdersScreen({ navigation }) {
  const { orders, ordersLoading, ordersError, refreshOrders } = useAdminData();
  const items = orders.map(item => ({
    ...item,
    title: item.orderNumber,
    subtitle: `${item.customer?.name || 'Customer'} · ${item.itemCount} item${
      item.itemCount === 1 ? '' : 's'
    }`,
    meta: `₹${Number(item.total || 0).toLocaleString('en-IN')} · ${
      item.payment?.method === 'cod' ? 'Cash on delivery' : 'Online payment'
    }`,
    icon: 'receipt-outline',
  }));
  return (
    <AdminPanelScreen
      title="Orders"
      subtitle="Track and fulfil customer orders"
      items={items}
      loading={ordersLoading}
      error={ordersError}
      onRefresh={refreshOrders}
      onBack={navigation.goBack}
      searchPlaceholder="Search order or customer"
      onItemPress={item =>
        navigation.navigate('AdminOrderDetails', { id: item.id })
      }
    />
  );
}
