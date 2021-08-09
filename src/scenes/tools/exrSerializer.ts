import { Tools } from "@babylonjs/core/Misc/tools";

enum PixelType {
    UINT = 0,
    HALF = 1,
    FLOAT = 2,
}

enum CompressionType {
    NO_COMPRESSION = 0,
    RLE_COMPRESSION = 1,
    ZIPS_COMPRESSION = 2,
    ZIP_COMPRESSION = 3,
    PIZ_COMPRESSION = 4,
    PXR24_COMPRESSION = 5,
    B44_COMPRESSION = 6,
    B44A_COMPRESSION = 7,
}

enum LineOrder {
    INCREASING_Y = 0,
    DECREASING_Y = 1,
    RANDOM_Y = 2,
}

interface IChannelLayout {
    name: string;
    pixelType: PixelType;
}

export class EXRSerializer {

    private _buffer: Uint8Array;
    private _dataLength: number;
    private _view: DataView;
    private _growSize: number;

    public get buffer() {
        return this._buffer;
    }

    constructor() {
        this._buffer = new Uint8Array(0);
        this._dataLength = 0;
        this._view = new DataView(this._buffer.buffer);
        this._growSize = 2000;
    }

    public serialize(width: number, height: number, data: Float32Array | number[], channels: string[] = ["R", "G", "B", "A"]): void {
        this._dataLength = 0;

        const numChannels = channels.length;

        this._capacity(width * height * numChannels * 4);

        const channelsLayout: IChannelLayout[] = [];
        const allChannels = ["A", "B", "G", "R"];

        let channelsMask = 0;
        for (let i = 0; i < allChannels.length; ++i) {
            if (channels.indexOf(allChannels[i]) >= 0) {
                channelsLayout.push({ name: allChannels[i], pixelType: PixelType.FLOAT });
                channelsMask = channelsMask | (1 << ( 3 - i));
            }
        }

        this._add([0x76, 0x2f, 0x31, 0x01]); // magic
        this._addInt32(0x00000002); // version
        this._addHeaderAttribute_chlist("channels", channelsLayout);
        this._addHeaderAttribute_compression("compression", CompressionType.NO_COMPRESSION);
        this._addHeaderAttribute_box2i("dataWindow", 0, 0, width - 1, height - 1);
        this._addHeaderAttribute_box2i("displayWindow", 0, 0, width - 1, height - 1);
        this._addHeaderAttribute_lineOrder("lineOrder", LineOrder.INCREASING_Y);
        this._addHeaderAttribute_float("pixelAspectRatio", 1);
        this._addHeaderAttribute_v2f("screenWindowCenter", 0, 0);
        this._addHeaderAttribute_float("screenWindowWidth", width);
        this._addNull();

        const offsetTable: BigInt[] = [];
        const offsetTableSize = height * 8;
        const pixelDataSize = width * numChannels * 4;

        let scanlineOffset = this._dataLength + offsetTableSize;
        for (let y = 0; y < height; ++y) {
            offsetTable.push(BigInt(scanlineOffset));
            scanlineOffset += pixelDataSize + 8;
        }

        this._addUint64(offsetTable);

        for (let y = 0; y < height; ++y) {
            this._addUint32(y);
            this._addUint32(pixelDataSize);
            for (let channel = 3; channel >= 0; --channel) {
                if (channelsMask & (1 << channel)) {
                    for (let x = 0; x < width; ++x) {
                        const v = data[y * width * numChannels + x * numChannels + channel];
                        this._addFloat(v);
                    }
                }
            }
        }

        this._buffer = this._buffer.slice(0, this._dataLength);
        this._view = new DataView(this._buffer.buffer);
    }

    public download(fileName: string): void {
        Tools.Download(new Blob([this._buffer.buffer], { type: "application/octet-stream" }), fileName);
    }

    private _addHeaderAttribute_chlist(name: string, channels: IChannelLayout[]): void {
        this._addString(name);
        this._addNull();
        this._addString("chlist");
        this._addNull();

        let headerSize = 1;
        for (let i = 0; i < channels.length; ++i) {
            headerSize += channels[i].name.length + 1;
            headerSize += 4 // pixelType
                        + 1 // pLinear
                        + 3 // filling
                        + 4 * 2; // xSampling & ySampling
        }
        this._addUint32(headerSize);
        for (let i = 0; i < channels.length; ++i) {
            const channel = channels[i];

            this._addString(channel.name);
            this._addNull();
            this._addInt32(channel.pixelType);
            this._addUint8(0); // pLinear
            this._addNull(3); // filling
            this._addInt32([1, 1]); // xSampling & ySampling
        }
        this._addNull();
    }

    private _addHeaderAttribute_compression(name: string, compression: CompressionType): void {
        this._addString(name);
        this._addNull();
        this._addString("compression");
        this._addNull();
        this._addUint32(1);
        this._addUint8(compression);
    }

    private _addHeaderAttribute_box2i(name: string, xMin: number, yMin: number, xMax: number, yMax: number): void {
        this._addString(name);
        this._addNull();
        this._addString("box2i");
        this._addNull();
        this._addUint32(4 * 4);
        this._addInt32([xMin, yMin, xMax, yMax]);
    }

    private _addHeaderAttribute_lineOrder(name: string, lineOrder: LineOrder): void {
        this._addString(name);
        this._addNull();
        this._addString("lineOrder");
        this._addNull();
        this._addUint32(1);
        this._addUint8(lineOrder);
    }

    private _addHeaderAttribute_float(name: string, value: number): void {
        this._addString(name);
        this._addNull();
        this._addString("float");
        this._addNull();
        this._addUint32(4);
        this._addFloat(value);
    }

    private _addHeaderAttribute_v2f(name: string, value1: number, value2: number): void {
        this._addString(name);
        this._addNull();
        this._addString("v2f");
        this._addNull();
        this._addUint32(4 * 2);
        this._addFloat([value1, value2]);
    }

    private _addString(s: string): void {
        this._capacity(s.length);
        for (let i = 0; i < s.length; ++i) {
            this._view.setUint8(this._dataLength++, s.charCodeAt(i));
        }
    }

    private _addInt8(v: number | number[]): void {
        if (Array.isArray(v)) {
            this._capacity(v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setInt8(this._dataLength++, v[i]);
            }
        } else {
            this._capacity(1);
            this._view.setInt8(this._dataLength, v);
            this._dataLength += 1;
        }
    }

    private _addUint8(v: number): void {
        this._capacity(1);
        this._view.setUint8(this._dataLength, v);
        this._dataLength += 1;
    }

    private _addInt16(v: number | number[]): void {
        if (Array.isArray(v)) {
            this._capacity(2 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setInt16(this._dataLength, v[i], true);
                this._dataLength += 2;
            }
        } else {
            this._capacity(2);
            this._view.setInt16(this._dataLength, v, true);
            this._dataLength += 2;
        }
    }

    private _addUint16(v: number | number[]): void {
        if (Array.isArray(v)) {
            this._capacity(2 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setUint16(this._dataLength, v[i], true);
                this._dataLength += 2;
            }
        } else {
            this._view.setUint16(this._dataLength, v, true);
            this._dataLength += 2;
        }
    }

    private _addInt32(v: number | number[]): void {
        if (Array.isArray(v)) {
            this._capacity(4 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setInt32(this._dataLength, v[i], true);
                this._dataLength += 4;
            }
        } else {
            this._capacity(4);
            this._view.setInt32(this._dataLength, v, true);
            this._dataLength += 4;
        }
    }

    private _addUint32(v: number | number[]): void {
        if (Array.isArray(v)) {
            this._capacity(4 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setUint32(this._dataLength, v[i], true);
                this._dataLength += 4;
            }
        } else {
            this._capacity(4);
            this._view.setUint32(this._dataLength, v, true);
            this._dataLength += 4;
        }
    }

    private _addUint64(v: BigUint64Array | BigInt[]): void {
        if (Array.isArray(v)) {
            this._capacity(8 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setBigUint64(this._dataLength, v[i] as bigint, true);
                this._dataLength += 8;
            }

        } else {
            this._capacity(v.byteLength);
            for (let i = 0; i < v.length; ++i) {
                this._view.setBigUint64(this._dataLength, v[i], true);
                this._dataLength += 8;
            }
        }
    }

    private _addFloat(v: number | number[] | Float32Array): void {
        if (Array.isArray(v)) {
            this._capacity(4 * v.length);
            for (let i = 0; i < v.length; ++i) {
                this._view.setFloat32(this._dataLength, v[i], true);
                this._dataLength += 4;
            }
        } else if (v instanceof Float32Array) {
            this._capacity(v.byteLength);
            this._buffer.set(v, this._dataLength);
            this._dataLength += v.byteLength;
        } else {
            this._capacity(4);
            this._view.setFloat32(this._dataLength, v, true);
            this._dataLength += 4;
        }
    }

    private _addNull(num = 1): void {
        this._capacity(num);
        while (num-- > 0) {
            this._view.setUint8(this._dataLength++, 0);
        }
    }

    private _add(data: Uint8Array | number[]): void {
        if (Array.isArray(data)) {
            data = new Uint8Array(data);
        }

        const dataLength = data.byteLength;

        this._capacity(dataLength);

        this._buffer.set(data, this._dataLength);
        this._dataLength += dataLength;
    }

    private _capacity(size: number): void {
        if (this._dataLength + size <= this._buffer.byteLength) {
            return;
        }

        this._growBuffer(Math.max(this._growSize, size));
    }

    private _growBuffer(addSize: number): void {
        const newBuffer = new Uint8Array(this._buffer.byteLength + addSize);

        newBuffer.set(this._buffer, 0);

        this._buffer = newBuffer;
        this._view = new DataView(this._buffer.buffer);
    }
}