const crypto=require('node:crypto');
const AuthOtp=require('./otp.model');

const validMobile=mobile=>typeof mobile==='string'&&/^\d{10}$/.test(mobile.trim());
const supportedPurpose=purpose=>['login','register','reset'].includes(purpose);
const otpError=(message,status=400)=>Object.assign(new Error(message),{status});
const temporaryOtpEnabled=()=>false;

async function twoFactorRequest(endpoint,failureStatus=502){
 const response=await fetch(endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 let body={};try{body=await response.json();}catch{throw otpError('OTP service returned an invalid response.',502);}
 if(!response.ok||String(body.Status||body.status||'').toLowerCase()!=='success')throw otpError('OTP service request failed.',failureStatus);
 return body;
}
async function fast2smsRequest(mobile,code){
 const key=process.env.FAST2SMS_API_KEY, senderId=process.env.FAST2SMS_SENDER_ID, messageId=process.env.FAST2SMS_MESSAGE_ID;
 if(!key||!senderId||!messageId)throw otpError('OTP service is not configured.',503);
 const response=await fetch('https://www.fast2sms.com/dev/bulkV2',{method:'POST',headers:{authorization:key,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({route:'dlt',sender_id:senderId,message:messageId,variables_values:code,numbers:mobile}),signal:AbortSignal.timeout(15000)});
 let body={};try{body=await response.json();}catch{throw otpError('OTP service returned an invalid response.',502);}
 if(!response.ok||body.return!==true)throw otpError(body.message||'OTP service request failed.',502);
}
const hashOtp=code=>crypto.createHash('sha256').update(`${code}:${process.env.OTP_SECRET||'bigvora-otp'}`).digest('hex');
const generatedOtp=()=>String(crypto.randomInt(0,1000000)).padStart(6,'0');

async function sendOtp(mobile,purpose){
 if(!validMobile(mobile))throw otpError('Enter a valid 10-digit mobile number.');
 if(!supportedPurpose(purpose))throw otpError('Invalid OTP request.');
 const normalized=mobile.trim();
 const code=generatedOtp();
 await fast2smsRequest(normalized,code);
 await AuthOtp.findOneAndUpdate({mobile:normalized,purpose},{$set:{providerSessionId:'fast2sms',otpHash:hashOtp(code),expiresAt:new Date(Date.now()+Number(process.env.OTP_EXPIRY_MINUTES||5)*60*1000),attempts:0}},{upsert:true,new:true,setDefaultsOnInsert:true});
 return normalized;
}

async function verifyOtp(mobile,purpose,code){
 if(!validMobile(mobile)||typeof code!=='string'||!/^[0-9]{6}$/.test(code))throw otpError('Enter the 6-digit OTP.');
 const record=await AuthOtp.findOne({mobile:mobile.trim(),purpose});
 if(!record)throw otpError('OTP expired. Request a new OTP.');
 if(record.attempts>=5){await record.deleteOne();throw otpError('OTP expired. Request a new OTP.');}
 if(record.providerSessionId!=='fast2sms'||record.otpHash!==hashOtp(code)){
  record.attempts+=1;await record.save();throw otpError('Incorrect OTP. Please try again.');
 }
 await record.deleteOne();return true;
}

module.exports={sendOtp,verifyOtp,validMobile,temporaryOtpEnabled};
