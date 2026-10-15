const mongoose=require('mongoose');
const schema=new mongoose.Schema({mobile:{type:String,required:true,index:true},purpose:{type:String,enum:['login','register','reset'],required:true},codeHash:{type:String,required:true},expiresAt:{type:Date,required:true,expires:0},attempts:{type:Number,default:0}},{timestamps:true});
schema.index({mobile:1,purpose:1},{unique:true});
module.exports=mongoose.model('AuthOtp',schema);
