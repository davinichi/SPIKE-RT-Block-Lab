const encoder = new TextEncoder();
export function crc32(bytes, seed = 0) {
  let crc = (seed ^ 0xffffffff) >>> 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i=0;i<8;i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
// ZIP method 0 (stored): no compression library, UTF-8 filenames and contents.
export function zipFiles(files) {
  const parts=[], central=[]; let offset=0, size=0;
  const u16=(view,at,n)=>view.setUint16(at,n,true), u32=(view,at,n)=>view.setUint32(at,n,true);
  const entries=Object.entries(files);
  for (const [name,text] of entries) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw Error('ZIPファイル名が不正です。');
    const path=encoder.encode(name), data=encoder.encode(text), crc=crc32(data);
    const header=new Uint8Array(30+path.length), h=new DataView(header.buffer);
    u32(h,0,0x04034b50);u16(h,4,20);u16(h,6,0x800);u16(h,12,0x21);
    u32(h,14,crc);u32(h,18,data.length);u32(h,22,data.length);u16(h,26,path.length);header.set(path,30);
    parts.push(header,data);
    const record=new Uint8Array(46+path.length), v=new DataView(record.buffer);
    u32(v,0,0x02014b50);u16(v,4,20);u16(v,6,20);u16(v,8,0x800);u16(v,14,0x21);
    u32(v,16,crc);u32(v,20,data.length);u32(v,24,data.length);u16(v,28,path.length);u32(v,42,offset);record.set(path,46);
    central.push(record);size+=record.length;offset+=header.length+data.length;
  }
  const end=new Uint8Array(22), e=new DataView(end.buffer);
  u32(e,0,0x06054b50);u16(e,8,entries.length);u16(e,10,entries.length);u32(e,12,size);u32(e,16,offset);
  const result=new Uint8Array(offset+size+22);let i=0;
  for (const part of [...parts,...central,end]) {result.set(part,i);i+=part.length;}
  return result;
}
