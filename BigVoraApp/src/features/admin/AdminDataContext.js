// @refresh reset
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import * as productApi from '../../services/admin/product.service';
import * as categoryApi from '../../services/admin/category.service';
import * as ruleApi from '../../services/admin/product-rule.service';
import * as bannerApi from '../../services/admin/banner.service';
import * as orderApi from '../../services/admin/order.service';
import * as customerApi from '../../services/admin/customer.service';

const AdminDataContext = createContext(null);
export function AdminDataProvider({ children }) {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');
  const refreshCustomers = useCallback(async () => {
    if (!token) return;
    setCustomersLoading(true);
    setCustomersError('');
    try {
      setCustomers(await customerApi.listCustomers(token));
    } catch (error) {
      setCustomersError(error.message);
    } finally {
      setCustomersLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) refreshCustomers();
  }, [token, refreshCustomers]);
  const fetchCustomer = useCallback(
    async id => {
      const customer = await customerApi.getCustomer(token, id);
      setCustomers(current =>
        current.some(item => item.id === customer.id)
          ? current.map(item => (item.id === customer.id ? customer : item))
          : [customer, ...current],
      );
      return customer;
    },
    [token],
  );
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const refreshOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      setOrders(await orderApi.listOrders(token));
    } catch (error) {
      setOrdersError(error.message);
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) refreshOrders();
  }, [token, refreshOrders]);
  const fetchOrder = useCallback(
    async id => {
      const order = await orderApi.getOrder(token, id);
      setOrders(current =>
        current.some(item => item.id === order.id)
          ? current.map(item => (item.id === order.id ? order : item))
          : [order, ...current],
      );
      return order;
    },
    [token],
  );
  const replaceOrder = order => {
    setOrders(current =>
      current.some(item => item.id === order.id)
        ? current.map(item => (item.id === order.id ? order : item))
        : [order, ...current],
    );
    return order;
  };
  const updateOrderStatus = async (id, status) =>
    replaceOrder(await orderApi.updateOrderStatus(token, id, status));
  const syncOrderShipment = async id =>
    replaceOrder(await orderApi.syncOrderShipment(token, id));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');
  const [productRules, setProductRules] = useState([]);
  const [productRulesLoading, setProductRulesLoading] = useState(false);
  const [productRulesError, setProductRulesError] = useState('');
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannersError, setBannersError] = useState('');
  const refreshBanners = useCallback(async () => {
    setBannersLoading(true);
    setBannersError('');
    try {
      setBanners(await bannerApi.listBanners(token));
    } catch (error) {
      setBannersError(error.message);
    } finally {
      setBannersLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) refreshBanners();
  }, [token, refreshBanners]);
  const addBanner = async fields => {
    const banner = await bannerApi.createBanner(token, fields);
    setBanners(current => [banner, ...current]);
  };
  const updateBanner = async (id, fields, version) => {
    const banner = await bannerApi.updateBanner(token, id, fields, version);
    setBanners(current =>
      current.map(item => (item.id === id ? banner : item)),
    );
  };
  const deleteBanner = async id => {
    await bannerApi.deleteBanner(token, id);
    setBanners(current => current.filter(item => item.id !== id));
  };
  const refreshProductRules = useCallback(async () => {
    setProductRulesLoading(true);
    setProductRulesError('');
    try {
      setProductRules(await ruleApi.listProductRules(token));
    } catch (error) {
      setProductRulesError(error.message);
    } finally {
      setProductRulesLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) refreshProductRules();
  }, [token, refreshProductRules]);
  const addProductRule = async fields => {
    const rule = await ruleApi.createProductRule(token, fields);
    setProductRules(current => [rule, ...current]);
  };
  const updateProductRule = async (id, fields, version) => {
    const rule = await ruleApi.updateProductRule(token, id, fields, version);
    setProductRules(current =>
      current.map(item => (item.id === id ? rule : item)),
    );
  };
  const deleteProductRule = async id => {
    await ruleApi.deleteProductRule(token, id);
    setProductRules(current => current.filter(item => item.id !== id));
  };
  useEffect(() => {
    let active = true;
    setCategories([]);
    setCategoriesError('');
    if (!token) {
      setCategoriesError('Please sign in as an admin.');
      return undefined;
    }
    setCategoriesLoading(true);
    categoryApi
      .listCategories(token)
      .then(items => {
        if (active) setCategories(items);
      })
      .catch(error => {
        if (active) setCategoriesError(error.message);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      setCategories(await categoryApi.listCategories(token));
    } catch (error) {
      setCategoriesError(error.message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [token]);
  const replaceCategory = category =>
    setCategories(current =>
      current.some(item => item.id === category.id)
        ? current.map(item => (item.id === category.id ? category : item))
        : [...current, category],
    );
  const fetchCategory = useCallback(
    async id => {
      replaceCategory(await categoryApi.getCategory(token, id));
    },
    [token],
  );
  const addCategory = async values =>
    replaceCategory(await categoryApi.createCategory(token, values));
  const updateCategory = async (id, values, version) =>
    replaceCategory(
      await categoryApi.updateCategory(token, id, values, version),
    );
  const deleteCategory = async (id, version) => {
    await categoryApi.deleteCategory(token, id, version);
    setCategories(current => current.filter(item => item.id !== id));
  };
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  useEffect(() => {
    let active = true;
    setProducts([]);
    setProductsError('');
    if (!token) {
      setProductsError('Please sign in as an admin.');
      return undefined;
    }
    setProductsLoading(true);
    productApi
      .listProducts(token)
      .then(items => {
        if (active) setProducts(items);
      })
      .catch(error => {
        if (active) setProductsError(error.message);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      setProducts(await productApi.listProducts(token));
    } catch (error) {
      setProductsError(error.message);
    } finally {
      setProductsLoading(false);
    }
  }, [token]);
  const replaceProduct = product =>
    setProducts(current => {
      const exists = current.some(item => item.id === product.id);
      return exists
        ? current.map(item => (item.id === product.id ? product : item))
        : [product, ...current];
    });
  const fetchProduct = useCallback(
    async id => {
      const product = await productApi.getProduct(token, id);
      replaceProduct(product);
    },
    [token],
  );
  const addProduct = async values => {
    const product = await productApi.createProduct(token, values);
    replaceProduct(product);
    await refreshCategories();
  };
  const updateProduct = async (id, values, version) => {
    const product = await productApi.updateProduct(token, id, values, version);
    replaceProduct(product);
    await refreshCategories();
  };
  const deleteProduct = async (id, version) => {
    await productApi.deleteProduct(token, id, version);
    setProducts(current => current.filter(item => item.id !== id));
    await refreshCategories();
  };
  const adjustStock = async (id, quantity, reason) => {
    const product = await productApi.adjustProductStock(
      token,
      id,
      quantity,
      reason,
    );
    replaceProduct(product);
  };
  return (
    <AdminDataContext.Provider
      value={{
        products,
        categories,
        banners,
        bannersLoading,
        bannersError,
        refreshBanners,
        addBanner,
        updateBanner,
        deleteBanner,
        productRules,
        productRulesLoading,
        productRulesError,
        refreshProductRules,
        addProductRule,
        updateProductRule,
        deleteProductRule,
        orders,
        ordersLoading,
        ordersError,
        refreshOrders,
        fetchOrder,
        updateOrderStatus,
        syncOrderShipment,
        customers,
        customersLoading,
        customersError,
        refreshCustomers,
        fetchCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCategory,
        updateCategory,
        deleteCategory,
        fetchCategory,
        refreshCategories,
        categoriesLoading,
        categoriesError,
        fetchProduct,
        refreshProducts,
        productsLoading,
        productsError,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error('useAdminData must be inside AdminDataProvider');
  return value;
}
