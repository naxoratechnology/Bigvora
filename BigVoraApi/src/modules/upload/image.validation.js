const {invalid}=require('../product/product.validation');
function imageUrl(value) {
  if(typeof value!=='string'||value.length>2048) invalid('Invalid image URL.');
  let url;try{url=new URL(value);}catch{invalid('Invalid image URL.');}
  if(url.protocol!=='https:'||url.hostname!=='res.cloudinary.com'||url.username||url.password) invalid('Use an uploaded Cloudinary image.');
  const cloud=process.env.CLOUDINARY_CLOUD_NAME;
  if(!cloud||!url.pathname.startsWith('/'+cloud+'/image/upload/')) invalid('Use an image uploaded to this store.');
  return value;
}
module.exports={imageUrl};
