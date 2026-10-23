/** Decode a local image and store a bounded PNG, shared by backups and offline exports. */
export async function prepareLogo(file:File):Promise<string>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Choose a PNG, JPEG, or WebP logo under 5 MB.');
 const bitmap=await createImageBitmap(file);
 try{const scale=Math.min(1,1024/bitmap.width,512/bitmap.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);const logo=canvas.toDataURL('image/png');if(logo.length>700000)throw Error('This logo is too detailed. Try a smaller image.');return logo;}finally{bitmap.close();}
}
