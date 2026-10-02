const router=require('express').Router();
const mongoose=require('mongoose');

const Product=()=>require('../product/product.model');
const Category=()=>require('../category/category.model');
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const productFields='name category categoryId description price mrp stock unit images ruleIds createdAt';
const productPopulate={path:'ruleIds',match:{isActive:true},select:'title description icon'};
const presentProduct=x=>({id:String(x._id),name:x.name,category:x.category,categoryId:x.categoryId?String(x.categoryId):null,description:x.description,price:x.price,mrp:x.mrp||x.price,discountPercent:x.mrp>x.price?Math.round(((x.mrp-x.price)/x.mrp)*100):0,stock:x.stock,unit:x.unit,images:x.images||[],rules:(x.ruleIds||[]).map(rule=>({id:String(rule._id),title:rule.title,description:rule.description,icon:rule.icon}))});
const number=(value,name,{min=0,max=1000000000,integer=false}={})=>{if(value===undefined||value==='')return undefined;const parsed=Number(value);if(!Number.isFinite(parsed)||parsed<min||parsed>max||(integer&&!Number.isSafeInteger(parsed))){const error=new Error(`Invalid ${name}.`);error.status=400;throw error;}return parsed;};

router.get('/home',async(req,res,next)=>{try{const[categories,products,banners]=await Promise.all([Category().find().sort({nameKey:1}).select('name image').lean(),Product().find().populate(productPopulate).sort({createdAt:-1}).limit(100).select(productFields).lean(),require('../banner/banner.model').find().sort({createdAt:-1}).select('name title image').lean()]);res.json({success:true,data:{categories:categories.map(x=>({id:String(x._id),name:x.name,image:x.image||null})),products:products.map(presentProduct),banners:banners.map(item=>({id:String(item._id),name:item.name||item.title||'Banner',image:item.image}))}});}catch(error){next(error);}});

router.get('/search',async(req,res,next)=>{try{
 const query=typeof req.query.q==='string'?req.query.q.trim().slice(0,100):'';const categoryId=typeof req.query.categoryId==='string'?req.query.categoryId:'';const sort=typeof req.query.sort==='string'?req.query.sort:'relevance';const inStock=req.query.inStock==='true';const minPrice=number(req.query.minPrice,'minimum price');const maxPrice=number(req.query.maxPrice,'maximum price');const page=number(req.query.page,'page',{min:1,max:10000,integer:true})||1;const limit=number(req.query.limit,'limit',{min:1,max:40,integer:true})||20;
 if(categoryId&&!mongoose.isObjectIdOrHexString(categoryId)){const error=new Error('Invalid category filter.');error.status=400;throw error;}if(minPrice!==undefined&&maxPrice!==undefined&&minPrice>maxPrice){const error=new Error('Minimum price cannot exceed maximum price.');error.status=400;throw error;}if(!['relevance','newest','priceAsc','priceDesc','discount'].includes(sort)){const error=new Error('Invalid sort option.');error.status=400;throw error;}
 const filter={};if(query){const pattern=new RegExp(escapeRegex(query),'i');filter.$or=[{name:pattern},{category:pattern},{description:pattern},{sku:pattern}];}if(categoryId)filter.categoryId=new mongoose.Types.ObjectId(categoryId);if(inStock)filter.stock={$gt:0};if(minPrice!==undefined||maxPrice!==undefined)filter.price={...(minPrice!==undefined?{$gte:minPrice}:{}),...(maxPrice!==undefined?{$lte:maxPrice}:{})};
 const sortMap={relevance:{createdAt:-1},newest:{createdAt:-1},priceAsc:{price:1,_id:1},priceDesc:{price:-1,_id:1}};let products;if(sort==='discount'){products=await Product().aggregate([{$match:filter},{$addFields:{discountSort:{$cond:[{$gt:['$mrp','$price']},{$divide:[{$subtract:['$mrp','$price']},'$mrp']},0]}}},{$sort:{discountSort:-1,createdAt:-1}},{$skip:(page-1)*limit},{$limit:limit}]);products=await Product().populate(products,productPopulate);}else{products=await Product().find(filter).populate(productPopulate).sort(sortMap[sort]).skip((page-1)*limit).limit(limit).select(productFields).lean();}
 const [total,categories,suggestionDocs]=await Promise.all([Product().countDocuments(filter),Category().find().sort({nameKey:1}).select('name').lean(),query?Product().find({name:new RegExp('^'+escapeRegex(query),'i')}).sort({name:1}).limit(6).select('name').lean():Promise.resolve([])]);
 res.json({success:true,data:{query,suggestions:[...new Set(suggestionDocs.map(item=>item.name))],products:products.map(presentProduct),categories:categories.map(item=>({id:String(item._id),name:item.name})),pagination:{page,limit,total,hasMore:page*limit<total}}});
 }catch(error){next(error);}});

module.exports=router;
