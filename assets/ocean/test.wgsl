[[group(0), binding(1)]] var WavesData : texture_storage_2d<rgba32float, write>;
[[group(0), binding(2)]] var H0K : texture_storage_2d<rg32float, write>;

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

[[group(0), binding(6)]] var<storage, read> spectrumParameters : SpectrumParameters;

[[stage(compute), workgroup_size(8,8,1)]]
fn calculateInitialSpectrum([[builtin(global_invocation_id)]] id : vec3<u32>)
{
}
