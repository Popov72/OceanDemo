import * as BABYLON from "@babylonjs/core";
import { Tools } from "@babylonjs/core/Misc/tools";

const fp32 = Tools.FloatRound;

export class Vector3Float32 extends BABYLON.Vector3 {

    /**
     * Gets the class name
     * @returns the string "Vector3Float32"
     */
    public getClassName(): string {
        return "Vector3Float32";
    }

    /**
     * Adds the given coordinates to the current Vector3Float32
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3Float32
     */
    public addInPlaceFromFloats(x: number, y: number, z: number): Vector3Float32 {
        this.x = fp32(this.x + x);
        this.y = fp32(this.y + y);
        this.z = fp32(this.z + z);
        return this;
    }

    /**
     * Gets a new Vector3Float32, result of the addition the current Vector3Float32 and the given vector
     * @param otherVector defines the second operand
     * @returns the resulting Vector3Float32
     */
    public add(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        return this.addToRef(otherVector, new Vector3Float32(this._x, this._y, this._z));
    }

    /**
     * Gets a new Vector3Float32, result of the addition the current Vector3Float32 and the given vector
     * @param otherVector defines the second operand
     * @returns the resulting Vector3Float32
     */
    public addScalar(scalar: number): Vector3Float32 {
        const result = new Vector3Float32(scalar, scalar, scalar);
        return this.addToRef(result, result);
    }

    /**
     * Adds the current Vector3Float32 to the given one and stores the result in the vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public addToRef(otherVector: BABYLON.DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(fp32(this._x + otherVector._x), fp32(this._y + otherVector._y), fp32(this._z + otherVector._z));
    }

    /**
     * Subtract the given vector from the current Vector3Float32
     * @param otherVector defines the second operand
     * @returns the current updated Vector3Float32
     */
    public subtractInPlace(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        this.x = fp32(this.x - otherVector._x);
        this.y = fp32(this.y - otherVector._y);
        this.z = fp32(this.z - otherVector._z);
        return this;
    }

    /**
     * Returns a new Vector3Float32, result of the subtraction of the given vector from the current Vector3Float32
     * @param otherVector defines the second operand
     * @returns the resulting Vector3Float32
     */
    public subtract(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        return new Vector3Float32(this._x, this._y, this._z).subtractInPlace(otherVector);
    }

    /**
     * Subtracts the given vector from the current Vector3Float32 and stores the result in the vector "result".
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public subtractToRef(otherVector: BABYLON.DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return this.subtractFromFloatsToRef(otherVector._x, otherVector._y, otherVector._z, result);
    }

    /**
     * Returns a new Vector3Float32 set with the subtraction of the given floats from the current Vector3Float32 coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the resulting Vector3Float32
     */
    public subtractFromFloats(x: number, y: number, z: number): Vector3Float32 {
        return this.subtractFromFloatsToRef(x, y, z, new Vector3Float32(this._x, this._y, this._z));
    }

    /**
     * Subtracts the given floats from the current Vector3Float32 coordinates and set the given vector "result" with this result
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(fp32(this._x - x), fp32(this._y - y), fp32(this._z - z));
    }

    /**
     * Multiplies the Vector3Float32 coordinates by the float "scale"
     * @param scale defines the multiplier factor
     * @returns the current updated Vector3Float32
     */
    public scaleInPlace(scale: number): Vector3Float32 {
        this.x = fp32(this.x * scale);
        this.y = fp32(this.y * scale);
        this.z = fp32(this.z * scale);
        return this;
    }

    /**
     * Returns a new Vector3Float32 set with the current Vector3Float32 coordinates multiplied by the float "scale"
     * @param scale defines the multiplier factor
     * @returns a new Vector3Float32
     */
    public scale(scale: number): Vector3Float32 {
        return new Vector3Float32(this._x, this._y, this._z).scaleInPlace(scale);
    }

    /**
     * Multiplies the current Vector3Float32 coordinates by the float "scale" and stores the result in the given vector "result" coordinates
     * @param scale defines the multiplier factor
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public scaleToRef(scale: number, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(fp32(this._x * scale), fp32(this._y * scale), fp32(this._z * scale));
    }

    /**
     * Scale the current Vector3Float32 values by a factor and add the result to a given Vector3Float32
     * @param scale defines the scale factor
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public scaleAndAddToRef(scale: number, result: Vector3Float32): Vector3Float32 {
        return result.addInPlaceFromFloats(fp32(this._x * scale), fp32(this._y * scale), fp32(this._z * scale));
    }

    /**
     * Multiplies the current Vector3Float32 coordinates by the given ones
     * @param otherVector defines the second operand
     * @returns the current updated Vector3Float32
     */
    public multiplyInPlace(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        this.x = fp32(this.x * otherVector._x);
        this.y = fp32(this.y * otherVector._y);
        this.z = fp32(this.z * otherVector._z);
        return this;
    }

    /**
     * Returns a new Vector3Float32, result of the multiplication of the current Vector3Float32 by the given vector
     * @param otherVector defines the second operand
     * @returns the new Vector3Float32
     */
    public multiply(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        return this.multiplyByFloats(otherVector._x, otherVector._y, otherVector._z);
    }

    /**
     * Multiplies the current Vector3Float32 by the given one and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public multiplyToRef(otherVector: BABYLON.DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(fp32(this._x * otherVector._x), fp32(this._y * otherVector._y), fp32(this._z * otherVector._z));
    }

    /**
     * Returns a new Vector3Float32 set with the result of the mulliplication of the current Vector3Float32 coordinates by the given floats
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the new Vector3Float32
     */
    public multiplyByFloats(x: number, y: number, z: number): Vector3Float32 {
        const result = new Vector3Float32(x, y, z);
        return this.multiplyToRef(result, result);
    }

    /**
     * Returns a new Vector3Float32 set with the result of the division of the current Vector3Float32 coordinates by the given ones
     * @param otherVector defines the second operand
     * @returns the new Vector3Float32
     */
    public divide(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        return this.divideToRef(otherVector, new Vector3Float32());
    }

    /**
     * Divides the current Vector3Float32 coordinates by the given ones and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public divideToRef(otherVector: BABYLON.DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(fp32(this._x / otherVector._x), fp32(this._y / otherVector._y), fp32(this._z / otherVector._z));
    }

    /**
     * Divides the current Vector3Float32 coordinates by the given ones.
     * @param otherVector defines the second operand
     * @returns the current updated Vector3Float32
     */
    public divideInPlace(otherVector: Vector3Float32): Vector3Float32 {
        return this.divideToRef(otherVector, this);
    }

    /**
     * Returns a new Vector3Float32, result of applying pow on the current Vector3Float32 by the given vector
     * @param otherVector defines the second operand
     * @returns the new Vector3Float32
     */
    public pow(otherVector: BABYLON.DeepImmutable<Vector3Float32>): Vector3Float32 {
        const result = new Vector3Float32();
        result.x = fp32(Math.pow(this._x, otherVector._x));
        result.y = fp32(Math.pow(this._y, otherVector._y));
        result.z = fp32(Math.pow(this._z, otherVector._z));
        return result;
    }

    /**
     * Gets the length of the Vector3Float32
     * @returns the length of the Vector3Float32
     */
    public length(): number {
        return fp32(Math.sqrt(fp32(fp32(fp32(this._x * this._x) + fp32(this._y * this._y)) + fp32(this._z * this._z))));
    }

    /**
     * Gets the squared length of the Vector3Float
     * @returns squared length of the Vector3Float
     */
    public lengthSquared(): number {
        return fp32(fp32(fp32(this._x * this._x) + fp32(this._y * this._y)) + fp32(this._z * this._z));
    }

    /**
     * Normalize the current Vector3Float32.
     * Please note that this is an in place operation.
     * @returns the current updated Vector3Float32
     */
    public normalize(): Vector3Float32 {
        return this.normalizeFromLength(this.length());
    }

    /**
     * Normalize the current Vector3Float32 with the given input length.
     * Please note that this is an in place operation.
     * @param len the length of the vector
     * @returns the current updated Vector3Float32
     */
    public normalizeFromLength(len: number): Vector3Float32 {
        if (len === 0 || len === 1.0) {
            return this;
        }

        return this.scaleInPlace(fp32(1.0 / len));
    }

    /**
     * Normalize the current Vector3Float32 to a new vector
     * @returns the new Vector3Float32
     */
    public normalizeToNew(): Vector3Float32 {
        const normalized = new Vector3Float32(0, 0, 0);
        this.normalizeToRef(normalized);
        return normalized;
    }

    /**
     * Normalize the current Vector3Float32 to the reference
     * @param reference define the Vector3Float32 to update
     * @returns the updated Vector3Float32
     */
    public normalizeToRef(reference: Vector3Float32): Vector3Float32 {
        const len = this.length();
        if (len === 0 || len === 1.0) {
            return reference.copyFromFloats(this._x, this._y, this._z);
        }

        return this.scaleToRef(fp32(1.0 / len), reference);
    }

    /**
     * Copies the given floats to the current Vector3Float32 coordinates
     * @param x defines the x coordinate of the operand
     * @param y defines the y coordinate of the operand
     * @param z defines the z coordinate of the operand
     * @returns the current updated Vector3Float32
     */
     public copyFromFloats(x: number, y: number, z: number): Vector3Float32 {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Returns a new Vector3Float32 located for "amount" (float) on the linear interpolation between the vectors "start" and "end"
     * @param start defines the start value
     * @param end defines the end value
     * @param amount max defines amount between both (between 0 and 1)
     * @returns the new Vector3Float32
     */
     public static Lerp(start: BABYLON.DeepImmutable<Vector3Float32>, end: BABYLON.DeepImmutable<Vector3Float32>, amount: number): Vector3Float32 {
        const result = new Vector3Float32(0, 0, 0);
        Vector3Float32.LerpToRef(start, end, amount, result);
        return result;
    }

    /**
     * Sets the given vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end"
     * @param start defines the start value
     * @param end defines the end value
     * @param amount max defines amount between both (between 0 and 1)
     * @param result defines the Vector3Float32 where to store the result
     */
    public static LerpToRef(start: BABYLON.DeepImmutable<Vector3Float32>, end: BABYLON.DeepImmutable<Vector3Float32>, amount: number, result: Vector3Float32): void {
        result.x = fp32(start._x + fp32(fp32(end._x - start._x) * amount));
        result.y = fp32(start._y + fp32(fp32(end._y - start._y) * amount));
        result.z = fp32(start._z + fp32(fp32(end._z - start._z) * amount));
    }

    /**
     * Returns the dot product (float) between the vectors "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @returns the dot product
     */
    public static Dot(left: BABYLON.DeepImmutable<Vector3Float32>, right: BABYLON.DeepImmutable<Vector3Float32>): number {
        return fp32(fp32(fp32(left._x * right._x) + fp32(left._y * right._y)) + fp32(left._z * right._z));
    }

    /**
     * Converts a Vector3 to a Vector3Float32
     * @param source source Vector3
     * @param destination destination Vector3Float32
     */
    public static ToFloat32(source: BABYLON.DeepImmutable<BABYLON.Vector3>, destination: Vector3Float32): void {
        destination.set(fp32(source.x), fp32(source.y), fp32(source.z));
    }
}
