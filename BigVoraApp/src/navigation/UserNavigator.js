import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomNavigator from './BottomNavigator';
import CategoryProductsScreen from '../screens/user/categories/CategoryProductsScreen';
import AddAddressScreen from '../screens/user/checkout/AddAddressScreen';
import CheckoutScreen from '../screens/user/checkout/CheckoutScreen';
import CheckoutAddressScreen from '../screens/user/checkout/CheckoutAddressScreen';
import OrderSuccessScreen from '../screens/user/checkout/OrderSuccessScreen';
import FavouritesScreen from '../screens/user/favourites/FavouritesScreen';
import OrdersScreen from '../screens/user/orders/OrdersScreen';
import OrderDetailsScreen from '../screens/user/orders/OrderDetailsScreen';
import AddressesScreen from '../screens/user/profile/AddressesScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import NotificationsScreen from '../screens/user/home/NotificationsScreen';
import ProductDetailsScreen from '../screens/user/products/ProductDetailsScreen';
import EditProfileScreen from '../screens/user/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/user/profile/ChangePasswordScreen';
import HelpSupportScreen from '../screens/user/profile/HelpSupportScreen';
import TermsScreen from '../screens/user/profile/TermsScreen';
import PrivacyPolicyScreen from '../screens/user/profile/PrivacyPolicyScreen';
import SearchScreen from '../screens/user/search/SearchScreen';

const Stack = createNativeStackNavigator();

function UserNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Tabs" component={BottomNavigator} />
      <Stack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen}
      />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="CheckoutAddress" component={CheckoutAddressScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

export default UserNavigator;
