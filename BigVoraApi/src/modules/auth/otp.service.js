const AuthOtp=require('./otp.model');

const validMobile=mobile=>typeof mobile==='string'&&/^\d{10}$/.test(mobile.trim());
const supportedPurpose=purpose=>['login','register','reset'].includes(purpose);
const otpError=(message,status=400)=>Object.assign(new Error(message),{status});
const temporaryOtpEnabled=()=>process.env.OTP_MODE!=='2factor';

async function twoFactorRequest(endpoint,failureStatus=502){
 const response=await fetch(endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 let body={};try{body=await response.json();}catch{throw otpError('OTP service returned an invalid response.',502);}
 if(!response.ok||String(body.Status||body.status||'').toLowerCase()!=='success')throw otpError('OTP service request failed.',failureStatus);
 return body;
}

async function sendOtp(mobile,purpose){
 if(!validMobile(mobile))throw otpError('Enter a valid 10-digit mobile number.');
 if(!supportedPurpose(purpose))throw otpError('Invalid OTP request.');
 if(temporaryOtpEnabled()){
  if(purpose==='reset')throw otpError('Password reset is unavailable until SMS verification is enabled.',503);
  const normalized=mobile.trim();
  await AuthOtp.findOneAndUpdate({mobile:normalized,purpose},{$set:{providerSessionId:'temporary-static-otp',expiresAt:new Date(Date.now()+10*60*1000),attempts:0}},{upsert:true,new:true,setDefaultsOnInsert:true});
  return normalized;
 }
 const key=process.env.TWO_FACTOR_API_KEY;
 const template=process.env.TWO_FACTOR_OTP_TEMPLATE;
 if(!key||!template)throw otpError('OTP service is not configured.',503);
 const normalized=mobile.trim();
 const endpoint=`https://2factor.in/API/V1/${encodeURIComponent(key)}/SMS/${encodeURIComponent(`+91${normalized}`)}/AUTOGEN/${encodeURIComponent(template)}`;
 const result=await twoFactorRequest(endpoint);
 const providerSessionId=result.Details||result.details||result.session_id;
 if(typeof providerSessionId!=='string'||!providerSessionId)throw otpError('OTP service did not return a verification session.',502);
 await AuthOtp.findOneAndUpdate({mobile:normalized,purpose},{$set:{providerSessionId,expiresAt:new Date(Date.now()+10*60*1000),attempts:0}},{upsert:true,new:true,setDefaultsOnInsert:true});
 return normalized;
}

async function verifyOtp(mobile,purpose,code){
 if(!validMobile(mobile)||typeof code!=='string'||!/^[0-9]{6}$/.test(code))throw otpError('Enter the 6-digit OTP.');
 if(temporaryOtpEnabled()&&purpose==='reset')throw otpError('Password reset is unavailable until SMS verification is enabled.',503);
 const record=await AuthOtp.findOne({mobile:mobile.trim(),purpose});
 if(!record)throw otpError('OTP expired. Request a new OTP.');
 if(record.attempts>=5){await record.deleteOne();throw otpError('OTP expired. Request a new OTP.');}
 if(temporaryOtpEnabled()){
  if(record.providerSessionId!=='temporary-static-otp')throw otpError('OTP expired. Request a new OTP.');
  if(code!=='123456'){record.attempts+=1;await record.save();throw otpError('Incorrect OTP. Please try again.');}
  await record.deleteOne();return true;
 }
 const key=process.env.TWO_FACTOR_API_KEY;
 if(!key)throw otpError('OTP service is not configured.',503);
 try{
  const endpoint=`https://2factor.in/API/V1/${encodeURIComponent(key)}/SMS/VERIFY3/${encodeURIComponent(record.providerSessionId)}/${encodeURIComponent(code)}`;
  await twoFactorRequest(endpoint,400);
 }catch(error){
  if(error.status===502)throw error;
  record.attempts+=1;await record.save();throw otpError('Incorrect OTP. Please try again.');
 }
 await record.deleteOne();return true;
}

module.exports={sendOtp,verifyOtp,validMobile,temporaryOtpEnabled};
