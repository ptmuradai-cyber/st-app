/* STEP A schemaVersion 1. Bounded ZIP reader; no network or third-party code. */
(function(root){'use strict';
const LIMITS={zip:64*1024*1024,total:128*1024*1024,image:8*1024*1024,manifest:4*1024*1024,cards:1000,pixels:16_000_000,side:8192,ratio:200};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function need(ok,message){if(!ok)throw Error(message);}
function string(v,max,empty=false){need(typeof v==='string'&&v.length<=max&&(empty||v.trim().length>0),'教材情報の文字列が不正です');return v;}
const table=Array.from({length:256},(_,i)=>{for(let k=0;k<8;k++)i=(i&1)?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
function entries(bytes){
 need(bytes.length>=22&&bytes.length<=LIMITS.zip,'ZIPは64MB以下にしてください');const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(p)===0x06054b50&&p+22+u16(p+20)===bytes.length){end=p;break;}
 need(end>=0,'ZIPの末尾が破損しています');need(u16(end+4)===0&&u16(end+6)===0&&u16(end+8)===u16(end+10),'分割ZIPは使用できません');const count=u16(end+10),size=u32(end+12),start=u32(end+16);need(count>=2&&count<=LIMITS.cards+1&&start+size===end,'ZIPの件数または索引が不正です');
 let p=start,total=0;const out=new Map(),ranges=[];const decoder=new TextDecoder('utf-8',{fatal:true});
 for(let i=0;i<count;i++){
  need(p+46<=end&&u32(p)===0x02014b50,'ZIP索引が破損しています');const flags=u16(p+8),method=u16(p+10),crc=u32(p+16),compressed=u32(p+20),length=u32(p+24),nl=u16(p+28),el=u16(p+30),cl=u16(p+32),offset=u32(p+42),attrs=u32(p+38),host=bytes[p+5];
  need(p+46+nl+el+cl<=end&&u16(p+34)===0,'ZIP索引が範囲外です');const name=decoder.decode(bytes.subarray(p+46,p+46+nl));need(!out.has(name),'ZIP内のファイル名が重複しています');need(name==='manifest.json'||/^images\/[0-9a-f-]{36}\.webp$/.test(name),'教材以外のファイル・不正なパスが含まれています');need((attrs&16)===0&&!(host===3&&((attrs>>>16)&0xf000)===0xa000),'リンク・フォルダは使用できません');need((flags&~0x808)===0&&[0,8].includes(method),'暗号化・未対応圧縮のZIPです');
  const cap=name==='manifest.json'?LIMITS.manifest:LIMITS.image;need(length>0&&length<=cap&&compressed>0&&length/compressed<=LIMITS.ratio,'展開サイズまたは圧縮率が上限を超えています');total+=length;need(total<=LIMITS.total,'展開後の総容量が128MBを超えます');
  for(let q=p+46+nl;q<p+46+nl+el;){need(q+4<=p+46+nl+el,'ZIP拡張情報が不正です');const tag=u16(q),n=u16(q+2);need(tag!==1&&q+4+n<=p+46+nl+el,'ZIP64または破損した拡張情報です');q+=4+n;}
  need(offset+30<=start&&u32(offset)===0x04034b50,'ZIPファイル位置が不正です');const ln=u16(offset+26),le=u16(offset+28),dataStart=offset+30+ln+le,dataEnd=dataStart+compressed;
  need(dataStart<=start&&dataEnd<=start&&decoder.decode(bytes.subarray(offset+30,offset+30+ln))===name&&u16(offset+6)===flags&&u16(offset+8)===method,'ZIP内のヘッダーが一致しません');
  if(!(flags&8))need(u32(offset+14)===crc&&u32(offset+18)===compressed&&u32(offset+22)===length,'ZIP内のサイズが一致しません');
  else {let d=dataEnd;if(d+4<=start&&u32(d)===0x08074b50)d+=4;need(d+12<=start&&u32(d)===crc&&u32(d+4)===compressed&&u32(d+8)===length,'ZIPの記述子が不正です');}
  ranges.push([offset,dataEnd]);out.set(name,{name,method,crc,length,compressed,dataStart});p+=46+nl+el+cl;
 }
 need(p===end,'ZIP索引の長さが一致しません');ranges.sort((a,b)=>a[0]-b[0]);need(ranges.every((a,i)=>!i||a[0]>=ranges[i-1][1]),'ZIPのデータ範囲が重複しています');return out;
}
async function unpack(bytes,entry){
 const data=bytes.subarray(entry.dataStart,entry.dataStart+entry.compressed);let output;
 if(entry.method===0){need(data.length===entry.length,'非圧縮ZIPのサイズが不正です');output=data;}
 else{
  let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw Error('このブラウザではZIP展開を利用できません。新しいSafari等で確認してください');}
  const reader=new Blob([data]).stream().pipeThrough(ds).getReader();const chunks=[];let count=0;const timer=setTimeout(()=>reader.cancel('timeout'),30000);
  try{for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>entry.length){await reader.cancel();throw Error('ZIPの実展開量が申告サイズを超えました');}chunks.push(value);}need(count===entry.length,'ZIPの展開結果が不足しています');output=new Uint8Array(count);let pos=0;for(const c of chunks){output.set(c,pos);pos+=c.length;}}
  finally{clearTimeout(timer);reader.releaseLock();}
 }
 need(crc32(output)===entry.crc,'ZIPのCRC検査に失敗しました');return output;
}
function manifest(value){
 need(value&&value.format==='st-picture-card-pack'&&value.schemaVersion===1,'STEP A形式（schemaVersion 1）の教材ではありません');need(uuid.test(value.packId),'教材IDが不正です');
 string(value.name,120);string(value.version,40);for(const k of ['createdAt','exportedAt']){string(value[k],80);need(Number.isFinite(Date.parse(value[k])),'教材の日時が不正です');}
 need(Array.isArray(value.cards)&&value.cards.length>=1&&value.cards.length<=LIMITS.cards,'カード枚数は1〜1000枚にしてください');const ids=new Set();
 const cards=value.cards.map(c=>{need(c&&uuid.test(c.cardId)&&!ids.has(c.cardId),'カードIDが不正または重複しています');ids.add(c.cardId);need(c.image===`images/${c.cardId}.webp`,'画像パスとカードIDが一致しません');string(c.correctAnswer,200);need(Array.isArray(c.acceptedAnswers)&&c.acceptedAnswers.length<=30,'許容語が不正です');c.acceptedAnswers.forEach(a=>string(a,200));string(c.category,200,true);string(c.notes,2000,true);need(Number.isInteger(c.width)&&Number.isInteger(c.height)&&c.width>0&&c.height>0&&c.width<=LIMITS.side&&c.height<=LIMITS.side&&c.width*c.height<=LIMITS.pixels,'画像寸法が上限を超えています');need(/^[0-9a-f]{64}$/.test(c.sha256)&&Number.isSafeInteger(c.imageRevision)&&c.imageRevision>0,'画像の検証情報が不正です');return {cardId:c.cardId,image:c.image,correctAnswer:c.correctAnswer,acceptedAnswers:[...c.acceptedAnswers],category:c.category,notes:c.notes,width:c.width,height:c.height,sha256:c.sha256,imageRevision:c.imageRevision};});
 return {format:value.format,schemaVersion:1,packId:value.packId,name:value.name,version:value.version,createdAt:value.createdAt,exportedAt:value.exportedAt,cards};
}
function webpSize(bytes){
 need(bytes.length>=25,'画像が破損しています');const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tag=p=>String.fromCharCode(...bytes.subarray(p,p+4));need(tag(0)==='RIFF'&&tag(8)==='WEBP'&&d.getUint32(4,true)+8===bytes.length,'WebP画像ではありません');
 let size=null;for(let p=12;p+8<=bytes.length;){const n=d.getUint32(p+4,true),t=tag(p);need(p+8+n<=bytes.length,'WebPチャンクが破損しています');
 if(t==='VP8L'){need(n>=5&&bytes[p+8]===0x2f,'WebPヘッダーが不正です');const bits=d.getUint32(p+9,true);need((bits>>>29)===0,'WebP版が不正です');size=[(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
 if(t==='VP8X'){need(n===10&&(bytes[p+8]&2)===0,'動画WebPは使用できません');size=[1+bytes[p+12]+(bytes[p+13]<<8)+(bytes[p+14]<<16),1+bytes[p+15]+(bytes[p+16]<<8)+(bytes[p+17]<<16)];}
 if(t==='ANIM'||t==='ANMF')throw Error('動画WebPは使用できません');p+=8+n+(n%2);}
 need(size&&size[0]<=LIMITS.side&&size[1]<=LIMITS.side&&size[0]*size[1]<=LIMITS.pixels,'画像の実寸法が不正です');return size;
}
async function decode(blob){const url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();return [image.naturalWidth,image.naturalHeight];}finally{URL.revokeObjectURL(url);}}
async function validate(file,progress=()=>{},decoder=decode){
 need(file.size<=LIMITS.zip,'ZIPは64MB以下にしてください');const bytes=new Uint8Array(await file.arrayBuffer()),files=entries(bytes);need(files.has('manifest.json'),'manifest.jsonがありません');const m=manifest(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await unpack(bytes,files.get('manifest.json')))));need(files.size===m.cards.length+1,'画像の枚数が教材情報と一致しません');
 const images=[];for(let i=0;i<m.cards.length;i++){const c=m.cards[i],entry=files.get(c.image);need(entry,'画像が不足しています');const data=await unpack(bytes,entry);need(await digest(data)===c.sha256,'画像ハッシュが一致しません');const size=webpSize(data);need(size[0]===c.width&&size[1]===c.height,'画像の実寸が教材情報と一致しません');const blob=new Blob([data],{type:'image/webp'}),actual=await decoder(blob);need(actual[0]===c.width&&actual[1]===c.height,'画像を正常に表示できません');images.push({cardId:c.cardId,blob});progress(i+1,m.cards.length);}
 const fingerprint=await digest(new TextEncoder().encode(JSON.stringify({packId:m.packId,name:m.name,version:m.version,cards:m.cards})));
 return {manifest:m,images,key:m.packId+'@'+m.version,fingerprint};
}
root.PicturePack={LIMITS,entries,unpack,manifest,webpSize,validate,crc32,digest};
})(typeof globalThis!=='undefined'?globalThis:window);
