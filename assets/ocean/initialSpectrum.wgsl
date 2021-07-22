let PI : f32 = 3.1415926;

[[group(0), binding(1)]] var WavesData : texture_storage_2d<rgba32float, write>;
[[group(0), binding(2)]] var H0K : texture_storage_2d<rg32float, write>;
[[group(0), binding(4)]] var Noise : texture_2d<f32>;

[[block]] struct Params {
    Size : u32;
    LengthScale : f32;
    CutoffHigh : f32;
    CutoffLow : f32;
    GravityAcceleration : f32;
    Depth : f32;
};

[[group(0), binding(5)]] var<uniform> params : Params;

struct SpectrumParameter {
	scale : f32;
	angle : f32;
	spreadBlend : f32;
	swell : f32;
	alpha : f32;
	peakOmega : f32;
	gamma : f32;
	shortWavesFade : f32;
};

[[block]] struct SpectrumParameters {
    elements : array<SpectrumParameter>;
};

[[group(0), binding(6)]] var<storage, read> spectrums : SpectrumParameters;

fn frequency(k: f32, g: f32, depth: f32) -> f32
{
	return sqrt(g * k * tanh(min(k * depth, 20.0)));
}

fn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32
{
	let th = tanh(min(k * depth, 20.0));
	let ch = cosh(k * depth);
	return g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;
}

fn normalisationFactor(s: f32) -> f32
{
	let s2 = s * s;
	let s3 = s2 * s;
	let s4 = s3 * s;
	if (s < 5.0) {
		return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
    }
	return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
}

fn cosine2s(theta: f32, s: f32) -> f32
{
	return normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);
}

fn spreadPower(omega: f32, peakOmega: f32) -> f32
{
	if (omega > peakOmega) {
		return 9.77 * pow(abs(omega / peakOmega), -2.5);
	}
	return 6.97 * pow(abs(omega / peakOmega), 5.0);
}

fn directionSpectrum(theta: f32, omega: f32, pars: SpectrumParameter) -> f32
{
	let s = spreadPower(omega, pars.peakOmega) + 16.0 * tanh(min(omega / pars.peakOmega, 20.0)) * pars.swell * pars.swell;
	return mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - pars.angle, s), pars.spreadBlend);
}

fn TMACorrection(omega: f32, g: f32, depth: f32) -> f32
{
	let omegaH = omega * sqrt(depth / g);
	if (omegaH <= 1.0) {
		return 0.5 * omegaH * omegaH;
    }
	if (omegaH < 2.0) {
		return 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);
    }
	return 1.0;
}

fn JONSWAP(omega: f32, g: f32, depth: f32, pars: SpectrumParameter) -> f32
{
	var sigma: f32;
	if (omega <= pars.peakOmega) {
		sigma = 0.07;
    } else {
		sigma = 0.09;
    }
	let r = exp(-(omega - pars.peakOmega) * (omega - pars.peakOmega) / 2.0 / sigma / sigma / pars.peakOmega / pars.peakOmega);
	
	let oneOverOmega = 1.0 / omega;
	let peakOmegaOverOmega = pars.peakOmega / omega;

	return pars.scale * TMACorrection(omega, g, depth) * pars.alpha * g * g
		* oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega
		* exp(-1.25 * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega)
		* pow(abs(pars.gamma), r);
}

fn shortWavesFade(kLength: f32, pars: SpectrumParameter) -> f32
{
	return exp(-pars.shortWavesFade * pars.shortWavesFade * kLength * kLength);
}

[[stage(compute), workgroup_size(8,8,1)]]
fn calculateInitialSpectrum([[builtin(global_invocation_id)]] id : vec3<u32>)
{
	let deltaK = 2.0 * PI / params.LengthScale;
	let nx = f32(id.x) - f32(params.Size) / 2.0;
	let nz = f32(id.y) - f32(params.Size) / 2.0;
	let k = vec2<f32>(nx, nz) * deltaK;
	let kLength = length(k);

	if (kLength <= params.CutoffHigh && kLength >= params.CutoffLow) {
		let omega = frequency(kLength, params.GravityAcceleration, params.Depth);
		textureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0 / kLength, k.y, omega));

		let kAngle = atan2(k.y, k.x);
		let dOmegadk = frequencyDerivative(kLength, params.GravityAcceleration, params.Depth);
		var spectrum = JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[0]) * directionSpectrum(kAngle, omega, spectrums.elements[0]) * shortWavesFade(kLength, spectrums.elements[0]);
		if (spectrums.elements[1].scale > 0.0) {
			spectrum = spectrum + JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[1]) * directionSpectrum(kAngle, omega, spectrums.elements[1]) * shortWavesFade(kLength, spectrums.elements[1]);
        }
        let noise = textureLoad(Noise, vec2<i32>(id.xy), 0).xy;
        textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(noise * sqrt(2.0 * spectrum * abs(dOmegadk) / kLength * deltaK * deltaK), 0., 0.));
	} else {
		textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(0.0));
		textureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0, k.y, 0.0));
	}    
}
