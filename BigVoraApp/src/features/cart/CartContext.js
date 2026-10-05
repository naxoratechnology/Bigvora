import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  addAddress as addAddressRequest,
  getProfile,
  removeAddress as removeAddressRequest,
  updateAddress as updateAddressRequest,
} from '../../services/profile/profile.service';
import {
  addFavourite,
  listFavourites,
  removeFavourite,
} from '../../services/favourites/favourite.service';
import {
  clearCart as clearRemoteCart,
  listCart,
  setCartQuantity,
} from '../../services/cart/cart.service';
import {readCachedCart, saveCachedCart} from '../../services/cart/cart.storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token, syncUser } = useAuth();
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [orders, setOrders] = useState([]);
  const itemsRef = useRef([]);
  const syncUserRef = useRef(syncUser);
  const cartMutationQueue = useRef(Promise.resolve());

  useEffect(() => {
    syncUserRef.current = syncUser;
  }, [syncUser]);

  const replaceItems = useCallback(nextItems => {
    itemsRef.current = nextItems;
    setItems(nextItems);
    saveCachedCart(user?.id, nextItems).catch(() => {});
  }, [user?.id]);

  const queueQuantitySync = (productId, quantity, accessToken = token) => {
    if (!accessToken) return;
    cartMutationQueue.current = cartMutationQueue.current
      .catch(() => undefined)
      .then(() => setCartQuantity(accessToken, productId, quantity))
      .catch(() =>
        listCart(accessToken)
          .then(data => replaceItems(data.items || []))
          .catch(() => undefined),
      );
  };

  const addToCart = product => {
    const existing = itemsRef.current.find(item => item.id === product.id);
    const quantity = (existing?.quantity || 0) + 1;
    replaceItems(
      existing
        ? itemsRef.current.map(item =>
            item.id === product.id ? { ...item, quantity } : item,
          )
        : [...itemsRef.current, { ...product, quantity }],
    );
    queueQuantitySync(product.id, quantity);
  };

  const updateQuantity = (id, change) => {
    const existing = itemsRef.current.find(item => item.id === id);
    if (!existing) return;
    const quantity = Math.max(0, existing.quantity + change);
    replaceItems(
      itemsRef.current
        .map(item => (item.id === id ? { ...item, quantity } : item))
        .filter(item => item.quantity > 0),
    );
    queueQuantitySync(id, quantity);
  };

  const removeFromCart = id => {
    if (!itemsRef.current.some(item => item.id === id)) return;
    replaceItems(itemsRef.current.filter(item => item.id !== id));
    queueQuantitySync(id, 0);
  };

  const clearCart = () => {
    replaceItems([]);
    if (!token) return;
    const accessToken = token;
    cartMutationQueue.current = cartMutationQueue.current
      .catch(() => undefined)
      .then(() => clearRemoteCart(accessToken))
      .catch(() =>
        listCart(accessToken)
          .then(data => replaceItems(data.items || []))
          .catch(() => undefined),
      );
  };
  const toggleFavourite = product => {
    const removing = favourites.some(item => item.id === product.id);
    setFavourites(current =>
      removing
        ? current.filter(item => item.id !== product.id)
        : [product, ...current],
    );
    if (!token) return;
    const operation = removing
      ? removeFavourite(token, product.id)
      : addFavourite(token, product.id);
    operation.catch(() =>
      setFavourites(current =>
        removing
          ? current.some(item => item.id === product.id)
            ? current
            : [product, ...current]
          : current.filter(item => item.id !== product.id),
      ),
    );
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
    setSelectedAddressId(current =>
      next.some(item => item.id === current)
        ? current
        : next.find(item => item.isDefault)?.id || next[0]?.id || null,
    );
  }, [user?.addresses]);
  useEffect(() => {
    let active = true;
    if (!token) {
      setFavourites([]);
      return () => {
        active = false;
      };
    }
    listFavourites(token)
      .then(data => {
        if (!active) return;
        setFavourites(
          (data.favourites || []).map(product => ({
            ...product,
            priceValue: Number(product.price),
            price: '\u20B9' + Number(product.price).toLocaleString('en-IN'),
            mrp: Number(product.mrp || product.price),
            oldPrice:
              Number(product.mrp) > Number(product.price)
                ? '\u20B9' + Number(product.mrp).toLocaleString('en-IN')
                : '',
            discountPercent:
              Number(product.discountPercent) ||
              (Number(product.mrp) > Number(product.price)
                ? Math.round(
                    ((Number(product.mrp) - Number(product.price)) /
                      Number(product.mrp)) *
                      100,
                  )
                : 0),
            icon: 'cube-outline',
            tint: '#EDF3FF',
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);
  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(data => syncUserRef.current(data.user))
      .catch(() => {});
  }, [token]);
  useEffect(() => {
    let active = true;
    cartMutationQueue.current = Promise.resolve();
    if (!token || !user?.id) {
      replaceItems([]);
      return () => {
        active = false;
      };
    }
    (async () => {
      try {
        const cachedItems = await readCachedCart(user.id);
        if (active && cachedItems.length) replaceItems(cachedItems);
      } catch {}
      try {
        const data = await listCart(token);
        if (active) replaceItems(data.items || []);
      } catch {
        // Keep the securely cached cart when the API is temporarily unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, [token, user?.id, replaceItems]);
  const addAddress = async address => {
    if (!token) throw new Error('Please sign in to save an address.');
    const data = await addAddressRequest(token, address);
    await syncUser(data.user);
    const added = data.user.addresses[data.user.addresses.length - 1];
    setSelectedAddressId(added?.id || null);
    return added;
  };
  const updateAddress = async (id, address) => {
    const data = await updateAddressRequest(token, id, address);
    await syncUser(data.user);
    return data.user;
  };
  const removeAddress = async id => {
    const data = await removeAddressRequest(token, id);
    await syncUser(data.user);
    return data.user;
  };

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
    subtotal: items.reduce(
      (total, item) => total + item.priceValue * item.quantity,
      0,
    ),
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
