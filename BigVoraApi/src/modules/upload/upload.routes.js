const router = require('express').Router();
const multer = require('multer');
const crypto = require('node:crypto');
const { requireAdmin } = require('../../middleware/admin.middleware');
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 5 * 1024 * 1024, files: 8}});
router.post('/', requireAdmin, (req,res,next) => upload.array('images',8)(req,res,error => {
  if(error) return res.status(400).json({success:false,message:'Upload up to eight images, each under 5 MB.'});
  return next();
}), async(req,res,next) => {
  const kind = req.body.kind;
  if(!['product','category','banner'].includes(kind) || !req.files?.length || (kind!=='product' && req.files.length!==1))
    return res.status(400).json({success:false,message:'Select one category/banner image or up to eight product images.'});
  // Check file signatures rather than trusting client MIME types.
  const valid = b => b.subarray(0,3).equals(Buffer.from([255,216,255])) ||
    b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
    (b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP');
  if(req.files.some(f=>!valid(f.buffer))) return res.status(400).json({success:false,message:'Use JPEG, PNG or WebP images.'});
  const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;
  if(!cloud||!key||!secret) return res.status(503).json({success:false,message:'Image uploads are not configured.'});
  const images=[];
  try {
    for(const file of req.files) {
      const timestamp=Math.floor(Date.now()/1000),folder='bigvora/'+kind;
      const signature=crypto.createHash('sha1').update('folder='+folder+'&timestamp='+timestamp+secret).digest('hex');
      const form=new FormData();
      form.append('file',new Blob([file.buffer]),'image');
      form.append('folder',folder);form.append('timestamp',String(timestamp));form.append('api_key',key);form.append('signature',signature);
      const response=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/image/upload',{method:'POST',body:form,signal:AbortSignal.timeout(30000)});
      const result=await response.json();
      if(!response.ok||!result.secure_url) throw new Error('Upload failed');
      images.push(result.secure_url);
    }
    return res.status(201).json({success:true,data:{images}});
  } catch { return res.status(502).json({success:false,message:'Image upload failed. Please try again.'}); }
});
module.exports=router;
