import React from 'react';
import AdminPanelScreen from '../../../components/admin/AdminPanelScreen';
import { useAdminData } from '../../../features/admin/AdminDataContext';
export default function AdminCustomersScreen({ navigation }) {
  const { customers, customersLoading, customersError, refreshCustomers } =
    useAdminData();
  const items = customers.map(item => ({
    ...item,
    title: item.name,
    subtitle: `${item.email || item.mobile || 'No contact'} · ${
      item.orderCount
    } order${item.orderCount === 1 ? '' : 's'}`,
    meta: `Spent ₹${Number(item.totalSpent || 0).toLocaleString('en-IN')}`,
    icon: 'person-outline',
    status: item.isActive ? 'Active' : 'Inactive',
  }));
  return (
    <AdminPanelScreen
      title="Customers"
      subtitle="View customer activity"
      items={items}
      loading={customersLoading}
      error={customersError}
      onRefresh={refreshCustomers}
      onBack={navigation.goBack}
      searchPlaceholder="Search customers"
      onItemPress={item =>
        navigation.navigate('AdminCustomerDetails', { id: item.id })
      }
    />
  );
}
