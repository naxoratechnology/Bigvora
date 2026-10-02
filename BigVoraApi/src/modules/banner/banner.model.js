const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  image:{type:String,required:true},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
},{timestamps:true});
module.exports=mongoose.model('Banner',schema);
