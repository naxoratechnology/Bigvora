import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import AdminDashboardScreen from '../screens/admin/dashboard/AdminDashboardScreen';
import AdminProductsScreen from '../screens/admin/products/AdminProductsScreen';
import AdminOrdersScreen from '../screens/admin/orders/AdminOrdersScreen';
import AdminOrderDetailsScreen from '../screens/admin/orders/AdminOrderDetailsScreen';
import AdminCategoriesScreen from '../screens/admin/categories/AdminCategoriesScreen';
import AdminCustomersScreen from '../screens/admin/customers/AdminCustomersScreen';
import AdminCustomerDetailsScreen from '../screens/admin/customers/AdminCustomerDetailsScreen';
import AddProductScreen from '../screens/admin/products/AddProductScreen';
import AdminProductDetailsScreen from '../screens/admin/products/AdminProductDetailsScreen';
import AddCategoryScreen from '../screens/admin/categories/AddCategoryScreen';
import AdminDetailScreen from '../screens/admin/AdminDetailScreen';
import AdjustStockScreen from '../screens/admin/products/AdjustStockScreen';
import ProductRulesScreen from '../screens/admin/account/ProductRulesScreen';
import AdminAccountScreen from '../screens/admin/account/AdminAccountScreen';
import AdminBannersScreen from '../screens/admin/banners/AdminBannersScreen';
import { AdminDataProvider } from '../features/admin/AdminDataContext';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const icons = {
  Dashboard: ['speedometer', 'speedometer-outline'],
  Products: ['cube', 'cube-outline'],
  Categories: ['grid', 'grid-outline'],
  Account: ['person-circle', 'person-circle-outline'],
};
function AdminTabIcon({ route, focused, color, size }) {
  return (
    <Ionicons
      name={icons[route.name][focused ? 0 : 1]}
      color={color}
      size={size}
    />
  );
}
function adminScreenOptions({ route }) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.label,
    tabBarIcon: props => <AdminTabIcon route={route} {...props} />,
  };
}

function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={adminScreenOptions}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Products" component={AdminProductsScreen} />
      <Tab.Screen name="Categories" component={AdminCategoriesScreen} />
      <Tab.Screen name="Account" component={AdminAccountScreen} />
    </Tab.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminDataProvider>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
        <Stack.Screen name="AdminDetail" component={AdminDetailScreen} />
        <Stack.Screen name="AdjustStock" component={AdjustStockScreen} />
        <Stack.Screen name="Orders" component={AdminOrdersScreen} />
        <Stack.Screen name="Customers" component={AdminCustomersScreen} />
        <Stack.Screen name="ProductRules" component={ProductRulesScreen} />
        <Stack.Screen name="Banners" component={AdminBannersScreen} />
        <Stack.Screen
          name={'AdminOrderDetails'}
          component={AdminOrderDetailsScreen}
        />
        <Stack.Screen
          name={'AdminCustomerDetails'}
          component={AdminCustomerDetailsScreen}
        />
        <Stack.Screen
          name={'AdminProductDetails'}
          component={AdminProductDetailsScreen}
        />
      </Stack.Navigator>
    </AdminDataProvider>
  );
}

export default AdminNavigator;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    right: 10,
    bottom: 14,
    left: 10,
    height: 72,
    paddingTop: 7,
    paddingBottom: 7,
    borderTopWidth: 0,
    borderRadius: 23,
    backgroundColor: colors.background,
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  label: { marginBottom: 3, fontSize: 9, fontWeight: '700' },
});
