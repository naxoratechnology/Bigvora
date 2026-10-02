import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import ImageUploadField from '../../../components/admin/ImageUploadField';
import AdminFormScreen from '../../../components/admin/AdminFormScreen';
import {useAdminData} from '../../../features/admin/AdminDataContext';
const fields=[{key:'name',label:'Category name',placeholder:'Enter category name',icon:'grid-outline',required:true},{key:'description',label:'Description',placeholder:'Describe this category',icon:'document-text-outline',multiline:true,required:true}];
export default function AddCategoryScreen({navigation,route}) {
  const {addCategory,updateCategory,categories,refreshCategories} = useAdminData();
  const category = categories.find(item => item.id === route.params?.id);
  const [images,setImages] = useState(category?.image?[category.image]:[]);
  const [uploading,setUploading] = useState(false);
  const editing = Boolean(route.params?.id);
  const [version] = useState(category?.version);
  if (editing && !category) return <View><Text>Category not found.</Text><Pressable onPress={navigation.goBack}><Text>Go back</Text></Pressable></View>;
  const save = async values => {
    try {
      if (editing) await updateCategory(category.id,{...values,image:images[0]||null},version);
      else await addCategory({...values,image:images[0]||null});
    } catch (error) {
      if (error.status === 409) await refreshCategories();
      throw error;
    }
  };
  return <AdminFormScreen navigation={navigation} title={editing?'Edit category':'Add category'}
    fields={fields} initialValues={category||{}} onSubmit={save} submitDisabled={uploading}><ImageUploadField kind="category" images={images} onChange={setImages} onBusyChange={setUploading}/></AdminFormScreen>;
}
