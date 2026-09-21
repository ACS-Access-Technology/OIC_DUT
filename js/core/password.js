const cryptoApi=()=>globalThis.crypto || window.crypto;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export function newAccessCode(){return 'OIC-'+hex(cryptoApi().getRandomValues(new Uint8Array(8)));}
export async function hashPassword(password,salt=hex(cryptoApi().getRandomValues(new Uint8Array(16)))) {
 const key=await cryptoApi().subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const hash=await cryptoApi().subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:120000,hash:'SHA-256'},key,256);
 return {salt,hash:hex(hash)};
}
export async function verifyPassword(password,credential){return (await hashPassword(password,credential.salt)).hash===credential.hash;}
