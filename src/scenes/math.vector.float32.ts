import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { DeepImmutable } from "@babylonjs/core/types";

const f32 = Tools.FloatRound;

export class Vector3Float32 extends Vector3 {

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
        this.x = f32(this.x + x);
        this.y = f32(this.y + y);
        this.z = f32(this.z + z);
        return this;
    }

    /**
     * Gets a new Vector3Float32, result of the addition the current Vector3Float32 and the given vector
     * @param otherVector defines the second operand
     * @returns the resulting Vector3Float32
     */
    public add(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
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
    public addToRef(otherVector: DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(f32(this._x + otherVector._x), f32(this._y + otherVector._y), f32(this._z + otherVector._z));
    }

    /**
     * Subtract the given vector from the current Vector3Float32
     * @param otherVector defines the second operand
     * @returns the current updated Vector3Float32
     */
    public subtractInPlace(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        this.x = f32(this.x - otherVector._x);
        this.y = f32(this.y - otherVector._y);
        this.z = f32(this.z - otherVector._z);
        return this;
    }

    /**
     * Returns a new Vector3Float32, result of the subtraction of the given vector from the current Vector3Float32
     * @param otherVector defines the second operand
     * @returns the resulting Vector3Float32
     */
    public subtract(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        return new Vector3Float32(this._x, this._y, this._z).subtractInPlace(otherVector);
    }

    /**
     * Subtracts the given vector from the current Vector3Float32 and stores the result in the vector "result".
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public subtractToRef(otherVector: DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
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
        return result.copyFromFloats(f32(this._x - x), f32(this._y - y), f32(this._z - z));
    }

    /**
     * Multiplies the Vector3Float32 coordinates by the float "scale"
     * @param scale defines the multiplier factor
     * @returns the current updated Vector3Float32
     */
    public scaleInPlace(scale: number): Vector3Float32 {
        this.x = f32(this.x * scale);
        this.y = f32(this.y * scale);
        this.z = f32(this.z * scale);
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
        return result.copyFromFloats(f32(this._x * scale), f32(this._y * scale), f32(this._z * scale));
    }

    /**
     * Scale the current Vector3Float32 values by a factor and add the result to a given Vector3Float32
     * @param scale defines the scale factor
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public scaleAndAddToRef(scale: number, result: Vector3Float32): Vector3Float32 {
        return result.addInPlaceFromFloats(f32(this._x * scale), f32(this._y * scale), f32(this._z * scale));
    }

    /**
     * Multiplies the current Vector3Float32 coordinates by the given ones
     * @param otherVector defines the second operand
     * @returns the current updated Vector3Float32
     */
    public multiplyInPlace(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        this.x = f32(this.x * otherVector._x);
        this.y = f32(this.y * otherVector._y);
        this.z = f32(this.z * otherVector._z);
        return this;
    }

    /**
     * Returns a new Vector3Float32, result of the multiplication of the current Vector3Float32 by the given vector
     * @param otherVector defines the second operand
     * @returns the new Vector3Float32
     */
    public multiply(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        return this.multiplyByFloats(otherVector._x, otherVector._y, otherVector._z);
    }

    /**
     * Multiplies the current Vector3Float32 by the given one and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public multiplyToRef(otherVector: DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(f32(this._x * otherVector._x), f32(this._y * otherVector._y), f32(this._z * otherVector._z));
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
    public divide(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        return this.divideToRef(otherVector, new Vector3Float32());
    }

    /**
     * Divides the current Vector3Float32 coordinates by the given ones and stores the result in the given vector "result"
     * @param otherVector defines the second operand
     * @param result defines the Vector3Float32 object where to store the result
     * @returns the "result" vector
     */
    public divideToRef(otherVector: DeepImmutable<Vector3Float32>, result: Vector3Float32): Vector3Float32 {
        return result.copyFromFloats(f32(this._x / otherVector._x), f32(this._y / otherVector._y), f32(this._z / otherVector._z));
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
    public pow(otherVector: DeepImmutable<Vector3Float32>): Vector3Float32 {
        const result = new Vector3Float32();
        result.x = f32(Math.pow(this._x, otherVector._x));
        result.y = f32(Math.pow(this._y, otherVector._y));
        result.z = f32(Math.pow(this._z, otherVector._z));
        return result;
    }

    /**
     * Gets the length of the Vector3Float32
     * @returns the length of the Vector3Float32
     */
    public length(): number {
        return f32(Math.sqrt(f32(f32(f32(this._x * this._x) + f32(this._y * this._y)) + f32(this._z * this._z))));
    }

    /**
     * Gets the squared length of the Vector3Float
     * @returns squared length of the Vector3Float
     */
    public lengthSquared(): number {
        return f32(f32(f32(this._x * this._x) + f32(this._y * this._y)) + f32(this._z * this._z));
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

        return this.scaleInPlace(f32(1.0 / len));
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

        return this.scaleToRef(f32(1.0 / len), reference);
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
     public static Lerp(start: DeepImmutable<Vector3Float32>, end: DeepImmutable<Vector3Float32>, amount: number): Vector3Float32 {
        var result = new Vector3Float32(0, 0, 0);
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
    public static LerpToRef(start: DeepImmutable<Vector3Float32>, end: DeepImmutable<Vector3Float32>, amount: number, result: Vector3Float32): void {
        result.x = f32(start._x + f32(f32(end._x - start._x) * amount));
        result.y = f32(start._y + f32(f32(end._y - start._y) * amount));
        result.z = f32(start._z + f32(f32(end._z - start._z) * amount));
    }

    /**
     * Returns the dot product (float) between the vectors "left" and "right"
     * @param left defines the left operand
     * @param right defines the right operand
     * @returns the dot product
     */
    public static Dot(left: DeepImmutable<Vector3Float32>, right: DeepImmutable<Vector3Float32>): number {
        return f32(f32(f32(left._x * right._x) + f32(left._y * right._y)) + f32(left._z * right._z));
    }

    /**
     * Converts a Vector3 to a Vector3Float32
     * @param source source Vector3
     * @param destination destination Vector3Float32
     */
    public static ToFloat32(source: DeepImmutable<Vector3>, destination: Vector3Float32): void {
        destination.set(f32(source.x), f32(source.y), f32(source.z));
    }
}
