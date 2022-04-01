"use strict";(self.webpackChunkbabylonjs_ocean_demo=self.webpackChunkbabylonjs_ocean_demo||[]).push([[183],{1183:(t,i,e)=>{e.r(i),e.d(i,{EXRSerializer:()=>_});var a,h,s,d=e(4651);!function(t){t[t.UINT=0]="UINT",t[t.HALF=1]="HALF",t[t.FLOAT=2]="FLOAT"}(a||(a={})),function(t){t[t.NO_COMPRESSION=0]="NO_COMPRESSION",t[t.RLE_COMPRESSION=1]="RLE_COMPRESSION",t[t.ZIPS_COMPRESSION=2]="ZIPS_COMPRESSION",t[t.ZIP_COMPRESSION=3]="ZIP_COMPRESSION",t[t.PIZ_COMPRESSION=4]="PIZ_COMPRESSION",t[t.PXR24_COMPRESSION=5]="PXR24_COMPRESSION",t[t.B44_COMPRESSION=6]="B44_COMPRESSION",t[t.B44A_COMPRESSION=7]="B44A_COMPRESSION"}(h||(h={})),function(t){t[t.INCREASING_Y=0]="INCREASING_Y",t[t.DECREASING_Y=1]="DECREASING_Y",t[t.RANDOM_Y=2]="RANDOM_Y"}(s||(s={}));class _{constructor(){this._buffer=new Uint8Array(0),this._dataLength=0,this._view=new DataView(this._buffer.buffer),this._growSize=2e3}get buffer(){return this._buffer}serialize(t,i,e,d=["R","G","B","A"]){this._dataLength=0;const _=d.length;this._capacity(t*i*_*4);const n=[],r=["A","B","G","R"];let l=0;for(let t=0;t<r.length;++t)d.indexOf(r[t])>=0&&(n.push({name:r[t],pixelType:a.FLOAT}),l|=1<<3-t);this._add([118,47,49,1]),this._addInt32(2),this._addHeaderAttribute_chlist("channels",n),this._addHeaderAttribute_compression("compression",h.NO_COMPRESSION),this._addHeaderAttribute_box2i("dataWindow",0,0,t-1,i-1),this._addHeaderAttribute_box2i("displayWindow",0,0,t-1,i-1),this._addHeaderAttribute_lineOrder("lineOrder",s.INCREASING_Y),this._addHeaderAttribute_float("pixelAspectRatio",1),this._addHeaderAttribute_v2f("screenWindowCenter",0,0),this._addHeaderAttribute_float("screenWindowWidth",t),this._addNull();const g=[],f=8*i,o=t*_*4;let c=this._dataLength+f;for(let t=0;t<i;++t)g.push(BigInt(c)),c+=o+8;this._addUint64(g);for(let a=0;a<i;++a){this._addUint32(a),this._addUint32(o);for(let i=3;i>=0;--i)if(l&1<<i)for(let h=0;h<t;++h){const s=e[a*t*_+h*_+i];this._addFloat(s)}}this._buffer=this._buffer.slice(0,this._dataLength),this._view=new DataView(this._buffer.buffer)}download(t){d.w1.Download(new Blob([this._buffer.buffer],{type:"application/octet-stream"}),t)}_addHeaderAttribute_chlist(t,i){this._addString(t),this._addNull(),this._addString("chlist"),this._addNull();let e=1;for(let t=0;t<i.length;++t)e+=i[t].name.length+1,e+=16;this._addUint32(e);for(let t=0;t<i.length;++t){const e=i[t];this._addString(e.name),this._addNull(),this._addInt32(e.pixelType),this._addUint8(0),this._addNull(3),this._addInt32([1,1])}this._addNull()}_addHeaderAttribute_compression(t,i){this._addString(t),this._addNull(),this._addString("compression"),this._addNull(),this._addUint32(1),this._addUint8(i)}_addHeaderAttribute_box2i(t,i,e,a,h){this._addString(t),this._addNull(),this._addString("box2i"),this._addNull(),this._addUint32(16),this._addInt32([i,e,a,h])}_addHeaderAttribute_lineOrder(t,i){this._addString(t),this._addNull(),this._addString("lineOrder"),this._addNull(),this._addUint32(1),this._addUint8(i)}_addHeaderAttribute_float(t,i){this._addString(t),this._addNull(),this._addString("float"),this._addNull(),this._addUint32(4),this._addFloat(i)}_addHeaderAttribute_v2f(t,i,e){this._addString(t),this._addNull(),this._addString("v2f"),this._addNull(),this._addUint32(8),this._addFloat([i,e])}_addString(t){this._capacity(t.length);for(let i=0;i<t.length;++i)this._view.setUint8(this._dataLength++,t.charCodeAt(i))}_addInt8(t){if(Array.isArray(t)){this._capacity(t.length);for(let i=0;i<t.length;++i)this._view.setInt8(this._dataLength++,t[i])}else this._capacity(1),this._view.setInt8(this._dataLength,t),this._dataLength+=1}_addUint8(t){this._capacity(1),this._view.setUint8(this._dataLength,t),this._dataLength+=1}_addInt16(t){if(Array.isArray(t)){this._capacity(2*t.length);for(let i=0;i<t.length;++i)this._view.setInt16(this._dataLength,t[i],!0),this._dataLength+=2}else this._capacity(2),this._view.setInt16(this._dataLength,t,!0),this._dataLength+=2}_addUint16(t){if(Array.isArray(t)){this._capacity(2*t.length);for(let i=0;i<t.length;++i)this._view.setUint16(this._dataLength,t[i],!0),this._dataLength+=2}else this._view.setUint16(this._dataLength,t,!0),this._dataLength+=2}_addInt32(t){if(Array.isArray(t)){this._capacity(4*t.length);for(let i=0;i<t.length;++i)this._view.setInt32(this._dataLength,t[i],!0),this._dataLength+=4}else this._capacity(4),this._view.setInt32(this._dataLength,t,!0),this._dataLength+=4}_addUint32(t){if(Array.isArray(t)){this._capacity(4*t.length);for(let i=0;i<t.length;++i)this._view.setUint32(this._dataLength,t[i],!0),this._dataLength+=4}else this._capacity(4),this._view.setUint32(this._dataLength,t,!0),this._dataLength+=4}_addUint64(t){if(Array.isArray(t)){this._capacity(8*t.length);for(let i=0;i<t.length;++i)this._view.setBigUint64(this._dataLength,t[i],!0),this._dataLength+=8}else{this._capacity(t.byteLength);for(let i=0;i<t.length;++i)this._view.setBigUint64(this._dataLength,t[i],!0),this._dataLength+=8}}_addFloat(t){if(Array.isArray(t)){this._capacity(4*t.length);for(let i=0;i<t.length;++i)this._view.setFloat32(this._dataLength,t[i],!0),this._dataLength+=4}else t instanceof Float32Array?(this._capacity(t.byteLength),this._buffer.set(t,this._dataLength),this._dataLength+=t.byteLength):(this._capacity(4),this._view.setFloat32(this._dataLength,t,!0),this._dataLength+=4)}_addNull(t=1){for(this._capacity(t);t-- >0;)this._view.setUint8(this._dataLength++,0)}_add(t){Array.isArray(t)&&(t=new Uint8Array(t));const i=t.byteLength;this._capacity(i),this._buffer.set(t,this._dataLength),this._dataLength+=i}_capacity(t){this._dataLength+t<=this._buffer.byteLength||this._growBuffer(Math.max(this._growSize,t))}_growBuffer(t){const i=new Uint8Array(this._buffer.byteLength+t);i.set(this._buffer,0),this._buffer=i,this._view=new DataView(this._buffer.buffer)}}}}]);
//# sourceMappingURL=183.b6ea06de749550549b92.js.map