import React, {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import AdminPanelScreen from '../../../components/admin/AdminPanelScreen';
import {useAdminData} from '../../../features/admin/AdminDataContext';
export default function AdminCategoriesScreen({navigation}) {
  const {categories,categoriesLoading,categoriesError,refreshCategories} = useAdminData();
  useFocusEffect(useCallback(() => {
    void refreshCategories();
  }, [refreshCategories]));
  const items = categories.map(item => ({
    ...item, title: item.name,
    subtitle: `${item.products} products`,
    meta: 'Storefront category', icon: 'grid-outline',
  }));
  return <AdminPanelScreen loading={categoriesLoading} error={categoriesError}
    onRefresh={refreshCategories} title="Categories" subtitle="Organise your storefront"
    actionLabel="Add" items={items} searchPlaceholder="Search categories"
    onAdd={() => navigation.navigate('AddCategory')}
    onItemPress={item => navigation.navigate('AdminDetail',{type:'categories',id:item.id})}/>;
}
