import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import CartScreen from '../screens/user/cart/CartScreen';
import CategoriesScreen from '../screens/user/categories/CategoriesScreen';
import HomeScreen from '../screens/user/home/HomeScreen';
import ProfileScreen from '../screens/user/profile/ProfileScreen';
import {useCart} from '../features/cart/CartContext';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function createTabIcon(activeIcon, inactiveIcon) {
  return function TabIcon({color, focused, size}) {
    return (
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        color={color}
        size={size}
      />
    );
  };
}

const tabBarIcons = {
  Home: createTabIcon('home', 'home-outline'),
  Categories: createTabIcon('grid', 'grid-outline'),
  Cart: createTabIcon('cart', 'cart-outline'),
  Account: createTabIcon('person', 'person-outline'),
};

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function BottomNavigator() {
  const {itemCount} = useCart();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarIcon: tabBarIcons[route.name],
      })}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{tabBarBadge: itemCount || undefined}}
      />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    left: 15,
    height: 72,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
    borderRadius: 24,
    backgroundColor: colors.background,
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  tabBarLabel: {
    marginBottom: 3,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default BottomNavigator;
