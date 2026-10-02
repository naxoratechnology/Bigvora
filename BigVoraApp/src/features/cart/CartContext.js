import React, {createContext, useContext, useEffect, useState} from 'react';
import {useAuth} from '../auth/AuthContext';
import {addAddress as addAddressRequest, removeAddress as removeAddressRequest, updateAddress as updateAddressRequest} from '../../services/profile/profile.service';
import {addFavourite, listFavourites, removeFavourite} from '../../services/favourites/favourite.service';

const CartContext = createContext(null);

export function CartProvider({children}) {
  const {user, token, syncUser} = useAuth();
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [orders, setOrders] = useState([]);

  const addToCart = product => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      return existing
        ? current.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item)
        : [...current, {...product, quantity: 1}];
    });
  };

  const updateQuantity = (id, change) => {
    setItems(current => current
      .map(item => item.id === id ? {...item, quantity: item.quantity + change} : item)
      .filter(item => item.quantity > 0));
  };

  const removeFromCart = id => setItems(current => current.filter(item => item.id !== id));
  const clearCart = () => setItems([]);
  const toggleFavourite = product => {
    const removing = favourites.some(item => item.id === product.id);
    setFavourites(current => removing ? current.filter(item => item.id !== product.id) : [product, ...current]);
    if (!token) return;
    const operation = removing ? removeFavourite(token, product.id) : addFavourite(token, product.id);
    operation.catch(() => setFavourites(current => removing
      ? (current.some(item => item.id === product.id) ? current : [product, ...current])
      : current.filter(item => item.id !== product.id)));
  };
  const placeOrder = total => {
    const order = {
      id: `BV${Date.now().toString().slice(-8)}`,
      items: [...items],
      total,
      status: 'Order placed',
      date: new Date().toLocaleDateString('en-IN'),
    };
    setOrders(current => [order, ...current]);
    clearCart();
    return order;
  };
  useEffect(() => {
    const next = user?.addresses || [];
    setAddresses(next);
    setSelectedAddressId(current => next.some(item => item.id === current) ? current : (next.find(item => item.isDefault)?.id || next[0]?.id || null));
  }, [user?.addresses]);
  useEffect(() => {
    let active = true;
    if (!token) { setFavourites([]); return () => { active = false; }; }
    listFavourites(token).then(data => {
      if (!active) return;
      setFavourites((data.favourites || []).map(product => ({
        ...product,
        priceValue: Number(product.price),
        price: '\u20B9' + Number(product.price).toLocaleString('en-IN'),
        oldPrice: '',
        icon: 'cube-outline',
        tint: '#EDF3FF',
      })));
    }).catch(() => {});
    return () => { active = false; };
  }, [token]);
  const addAddress = async address => {
    if (!token) throw new Error('Please sign in to save an address.');
    const data = await addAddressRequest(token, address); await syncUser(data.user);
    const added = data.user.addresses[data.user.addresses.length - 1]; setSelectedAddressId(added?.id || null); return added;
  };
  const updateAddress = async (id, address) => {const data=await updateAddressRequest(token,id,address);await syncUser(data.user);return data.user;};
  const removeAddress = async id => {const data=await removeAddressRequest(token,id);await syncUser(data.user);return data.user;};

  const value = {
    items,
    addresses,
    favourites,
    orders,
    selectedAddressId,
    setSelectedAddressId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleFavourite,
    placeOrder,
    addAddress,
    updateAddress,
    removeAddress,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.priceValue * item.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
