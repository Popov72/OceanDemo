"use strict";(self.webpackChunkbabylonjs_ocean_demo=self.webpackChunkbabylonjs_ocean_demo||[]).push([[789],{1789:(t,s,i)=>{i.r(s),i.d(s,{Vector3Float32:()=>r});var e=i(3353);const h=i(4651).w1.FloatRound;class r extends e.Vector3{getClassName(){return"Vector3Float32"}addInPlaceFromFloats(t,s,i){return this.x=h(this.x+t),this.y=h(this.y+s),this.z=h(this.z+i),this}add(t){return this.addToRef(t,new r(this._x,this._y,this._z))}addScalar(t){const s=new r(t,t,t);return this.addToRef(s,s)}addToRef(t,s){return s.copyFromFloats(h(this._x+t._x),h(this._y+t._y),h(this._z+t._z))}subtractInPlace(t){return this.x=h(this.x-t._x),this.y=h(this.y-t._y),this.z=h(this.z-t._z),this}subtract(t){return new r(this._x,this._y,this._z).subtractInPlace(t)}subtractToRef(t,s){return this.subtractFromFloatsToRef(t._x,t._y,t._z,s)}subtractFromFloats(t,s,i){return this.subtractFromFloatsToRef(t,s,i,new r(this._x,this._y,this._z))}subtractFromFloatsToRef(t,s,i,e){return e.copyFromFloats(h(this._x-t),h(this._y-s),h(this._z-i))}scaleInPlace(t){return this.x=h(this.x*t),this.y=h(this.y*t),this.z=h(this.z*t),this}scale(t){return new r(this._x,this._y,this._z).scaleInPlace(t)}scaleToRef(t,s){return s.copyFromFloats(h(this._x*t),h(this._y*t),h(this._z*t))}scaleAndAddToRef(t,s){return s.addInPlaceFromFloats(h(this._x*t),h(this._y*t),h(this._z*t))}multiplyInPlace(t){return this.x=h(this.x*t._x),this.y=h(this.y*t._y),this.z=h(this.z*t._z),this}multiply(t){return this.multiplyByFloats(t._x,t._y,t._z)}multiplyToRef(t,s){return s.copyFromFloats(h(this._x*t._x),h(this._y*t._y),h(this._z*t._z))}multiplyByFloats(t,s,i){const e=new r(t,s,i);return this.multiplyToRef(e,e)}divide(t){return this.divideToRef(t,new r)}divideToRef(t,s){return s.copyFromFloats(h(this._x/t._x),h(this._y/t._y),h(this._z/t._z))}divideInPlace(t){return this.divideToRef(t,this)}pow(t){const s=new r;return s.x=h(Math.pow(this._x,t._x)),s.y=h(Math.pow(this._y,t._y)),s.z=h(Math.pow(this._z,t._z)),s}length(){return h(Math.sqrt(h(h(h(this._x*this._x)+h(this._y*this._y))+h(this._z*this._z))))}lengthSquared(){return h(h(h(this._x*this._x)+h(this._y*this._y))+h(this._z*this._z))}normalize(){return this.normalizeFromLength(this.length())}normalizeFromLength(t){return 0===t||1===t?this:this.scaleInPlace(h(1/t))}normalizeToNew(){const t=new r(0,0,0);return this.normalizeToRef(t),t}normalizeToRef(t){const s=this.length();return 0===s||1===s?t.copyFromFloats(this._x,this._y,this._z):this.scaleToRef(h(1/s),t)}copyFromFloats(t,s,i){return this.x=t,this.y=s,this.z=i,this}static Lerp(t,s,i){const e=new r(0,0,0);return r.LerpToRef(t,s,i,e),e}static LerpToRef(t,s,i,e){e.x=h(t._x+h(h(s._x-t._x)*i)),e.y=h(t._y+h(h(s._y-t._y)*i)),e.z=h(t._z+h(h(s._z-t._z)*i))}static Dot(t,s){return h(h(h(t._x*s._x)+h(t._y*s._y))+h(t._z*s._z))}static ToFloat32(t,s){s.set(h(t.x),h(t.y),h(t.z))}}}}]);
//# sourceMappingURL=789.4b799811d4012395772b.js.map