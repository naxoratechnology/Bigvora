import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import {CartProvider} from './src/features/cart/CartContext';
import {AuthProvider} from './src/features/auth/AuthContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
