import * as BABYLON from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
import { Vector3Float32 } from "./math.vector.float32";
import { Tools } from "@babylonjs/core/Misc/tools";

const f32 = Tools.FloatRound;

const PI = f32(Math.PI);
const sunPosition = new Vector3Float32();
const sunDirection = new Vector3Float32();
const up = new Vector3Float32();
const temp1 = new Vector3Float32(); // simplifiedRayleigh
const temp2 = new Vector3Float32(); // totalMie
const temp3 = new Vector3Float32(); // retColor
const EE = f32(1000.0);
const cutoffAngle = f32(PI / f32(1.95));
const steepness = f32(1.5);
const v = f32(4.0);
const TwoPI = f32(2.0 * PI);
const lambda = new Vector3Float32(f32(680E-9), f32(550E-9), f32(450E-9));
const K = new Vector3Float32(f32(0.686), f32(0.678), f32(0.666));
const rayleighZenithLength = f32(8.4E3);
const mieZenithLength = f32(1.25E3);
const unitVec = new Vector3Float32(f32(1), f32(1), f32(1));
//const twoVec = new Vector3Float32(f32(2), f32(2), f32(2));
const oneAndHalfVec = new Vector3Float32(f32(1.5), f32(1.5), f32(1.5));
const halfOneVec = new Vector3Float32(f32(0.5), f32(0.5), f32(0.5));
const tenthVec = new Vector3Float32(f32(0.1), f32(0.1), f32(0.1));
const texColorCst = new Vector3Float32(f32(f32(0.0) * f32(0.3)), f32(f32(0.001) * f32(0.3)), f32(f32(0.0025) * f32(0.3)));

(SkyMaterial.prototype as any).getSunColor = function() {
    const sunIntensity = (zenithAngleCos: number) => {
        return f32(EE * Math.max(0.0, f32(1.0 - f32(Math.exp((-f32(cutoffAngle - f32(Math.acos(zenithAngleCos)))/f32(steepness)))))));
    };

    const simplifiedRayleigh = () => {
        const c = f32(0.0005);
        temp1.set(f32(c / 94), f32(c / 40), f32(c / 18));
        return temp1;
    };

    const totalMie = (lambda: Vector3Float32, K: Vector3Float32, T: number) => {
        const c = f32(f32((f32(0.2) * T)) * f32(10E-18));
        const p = f32(v - 2.0);
        const m = f32(f32(f32(0.434) * c) * PI);
        temp2.set(
            f32(f32(m * f32(Math.pow(f32(TwoPI / lambda.x), p))) * f32(K.x)),
            f32(f32(m * f32(Math.pow(f32(TwoPI / lambda.y), p))) * f32(K.y)),
            f32(f32(m * f32(Math.pow(f32(TwoPI / lambda.z), p))) * f32(K.z))
        );
        return temp2;
    };

    const rayleighPhase = (cosTheta: number) => {	 
        return f32(f32(3.0 / f32(16.0 * PI)) * f32(1.0 + f32(Math.pow(cosTheta, 2.0))));
    };

    const hgPhase = (cosTheta: number, g: number) => {
        return f32(f32(1.0 / f32(4.0 * PI)) * f32((f32(1.0 - f32(Math.pow(g, 2.0))) / f32(Math.pow(1.0 - f32(f32(2.0 * g) * cosTheta) + f32(Math.pow(g, 2.0)), 1.5)))));
    };

    const A = f32(0.15);
    const B = f32(0.50);
    const C = f32(0.10);
    const D = f32(0.20);
    const EEE = f32(0.02);
    const F = f32(0.30);
    const W = new Vector3Float32(f32(1000.0), f32(1000.0), f32(1000.0));

    const Uncharted2Tonemap = (x: Vector3Float32) => {
        const c1 = x.scale(A).addScalar(f32(C * B));
        const c2 = x.scale(A).addScalar(B);
        const c3 = x.multiply(c1).addScalar(f32(D * EEE));
        const c4 = x.multiply(c2).addScalar(f32(D * F));
        return c3.divide(c4).addScalar(-f32(EEE / F));
    };

    Vector3Float32.ToFloat32(this.sunPosition, sunPosition);
    Vector3Float32.ToFloat32(this.up, up);

	//float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
	const sunfade = f32(1.0 - BABYLON.Scalar.Clamp(f32(1.0 - f32(Math.exp(f32(sunPosition.y / 450000.0)))), 0.0, 1.0));

	//float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
	const rayleighCoefficient = f32(f32(this.rayleigh) - (1.0 * f32(1.0 - sunfade)));

	//vec3 sunDirection = normalize(sunPosition);
    sunPosition.normalizeToRef(sunDirection);

	//float sunE = sunIntensity(dot(sunDirection, up));
	const sunE = sunIntensity(Vector3Float32.Dot(sunDirection, up));

	//vec3 betaR = simplifiedRayleigh() * rayleighCoefficient;
	const betaR = simplifiedRayleigh().scale(rayleighCoefficient);

	//vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;
	const betaM = totalMie(lambda, K, f32(this.turbidity)).scale(f32(this.mieCoefficient));

	//float zenithAngle = acos(max(0.0, sunDirection.y));
	const zenithAngle = f32(Math.acos(Math.max(0.0, sunDirection.y)));

	//float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	const sR = f32(rayleighZenithLength / f32(f32(Math.cos(zenithAngle)) +
        f32(f32(0.15) * f32(Math.pow(f32(f32(93.885) - f32(f32(zenithAngle * 180.0) / PI)), f32(-1.253))))));

	//float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	const sM = f32(mieZenithLength / (f32(Math.cos(zenithAngle)) +
        f32(f32(0.15) * f32(Math.pow(f32(f32(93.885) - f32(f32(zenithAngle * 180.0) / PI)), f32(-1.253))))));

	//vec3 Fex = exp(-(betaR * sR + betaM * sM));
	const Fex = betaR.scale(sR).add(betaM.scale(sM));
    Fex.set(f32(Math.exp(-Fex.x)), f32(Math.exp(-Fex.y)), f32(Math.exp(-Fex.z)));

	const cosTheta = 1.0;

	//float rPhase = rayleighPhase(cosTheta*0.5+0.5);
	const rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);

	//vec3 betaRTheta = betaR * rPhase;
	const mPhase = hgPhase(cosTheta, f32(this.mieDirectionalG));

	//float mPhase = hgPhase(cosTheta, mieDirectionalG);
	const betaRTheta = betaR.scale(rPhase);

	//vec3 betaMTheta = betaM * mPhase;
	const betaMTheta = betaM.scale(mPhase);
	
	// vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));
    const f1 = betaRTheta.add(betaMTheta).divide(betaR.add(betaM)).scale(sunE); // sunE * ((betaRTheta + betaMTheta) / (betaR + betaM))
    let Lin = f1.multiply(unitVec.subtract(Fex)).pow(oneAndHalfVec);

	//Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0-dot(up, sunDirection), 5.0), 0.0, 1.0));
    const l1 = f1.multiply(Fex).pow(halfOneVec);
    const l2 = BABYLON.Scalar.Clamp(f32(Math.pow(f32(1.0 - Vector3Float32.Dot(up, sunDirection)), 5.0)), 0, 1); // clamp(pow(1.0-dot(up, sunDirection), 5.0), 0.0, 1.0)

	Lin = Lin.multiply(Vector3Float32.Lerp(unitVec, l1, l2));

	//vec3 L0 = vec3(0.1) * Fex;
    const L0 = tenthVec.multiply(Fex);

	//L0 += (sunE * 19000.0 * Fex) * sundisk;
	//const sundisk = 1.;
	L0.addInPlace(Fex.scale(f32(sunE * 19000.0)));

	//vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));
    const whiteScale = unitVec.divide(Uncharted2Tonemap(W));

	//vec3 texColor = (Lin+L0);
	//texColor *= 0.04;
	//texColor += vec3(0.0,0.001,0.0025)*0.3;
    const texColor = Lin.add(L0).scale(f32(0.04)).add(texColorCst);

    //vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance, 4.0)))*texColor);
    const curr = Uncharted2Tonemap(texColor.scale(f32(Math.log2(f32(2.0 / f32(Math.pow(this.luminance, 4.0)))))));

    //vec3 retColor = curr*whiteScale;
    Vector3Float32.ClampToRef(curr.multiply(whiteScale), halfOneVec, unitVec, temp3);

    const retColor = new BABYLON.Color3(temp3.x, temp3.y, temp3.z);

    return retColor;
};
