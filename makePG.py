import re

sourceDir = 'src/scenes/'
wgslDir = 'src/assets/ocean/'

globalReplaces = [
    {
        "find": r"(\bimport\b|\bexport\b).*?;.*?(\r?\n|$)",
        "replace": ""
    },
    {
        "find": r"export class",
        "replace": "class"
    },
    {
        "find": r"export interface",
        "replace": "interface"
    },
    {
        "find": r"implements CreateSceneClass ",
        "replace": ""
    },
    {
        "find": r"this\._view.setBigUint64",
        "replace": "(this._view as any).setBigUint64"
    },
    {
        "find": r"\bGUI\.",
        "replace": "BABYLON.GUI."
    },
    {
        "find": r"\bCustomMaterial\b",
        "replace": "BABYLON.CustomMaterial"
    },
    {
        "find": r"\bPBRCustomMaterial\b",
        "replace": "BABYLON.PBRCustomMaterial"
    },
    {
        "find": r"\bSkyMaterial\b",
        "replace": "BABYLON.SkyMaterial"
    },
    {
        "find": r"\bTools\.",
        "replace": "BABYLON.Tools."
    },
    {
        "find": r"\bnoiseEXR\b",
        "replace": "'https://assets.babylonjs.com/environments/noise.exr'"
    },
    {
        "find": r"\bbuoy\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/e388a5748796486181fbb8cb94bd0a66.glb'"
    },
    {
        "find": r"\bfisher_boat\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/1f306a6325b8c6d21b8125e742b24167.glb'"
    },
    {
        "find": r"\bdart_tsunami_buoy\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/5b0b186220463f71ca8c72af6f8a9434.glb'"
    },
    {
        "find": r"\bqwantani_1k\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/0c03bd6e3c9d04da0cf428bbf487bf68.hdr'"
    },
    {
        "find": r"\bbabylon_buoy\b",
        "replace": "'https://assets.babylonjs.com/meshes/babylonBuoy.glb'"
    },
    {
        "find": r"class OceanGUI \{",
        "replace": "declare var dat: any;\r\nclass OceanGUI {"
    },
    {
        "find": r"this\._gui = new GUI\(\);",
        "replace": "this._gui = new dat.GUI();"
    },
    {
        "find": r"//await OceanGUI\.LoadDAT\(\);",
        "replace": "await OceanGUI.LoadDAT();"
    },
]

files = [
    {
        "name": "ocean.ts"
    },
    {
        "name": "oceanGui.ts"
    },
    {
        "name": "oceanGeometry.ts"
    },
    {
        "name": "oceanMaterial.ts"
    },
    {
        "name": "skyBox.ts"
    },
    {
        "name": "buoyancy.ts"
    },
    {
        "name": "wavesSettings.ts"
    },
    {
        "name": "wavesGenerator.ts"
    },
    {
        "name": "wavesCascade.ts"
    },
    {
        "name": "initialSpectrum.ts"
    },
    {
        "name": "fft.ts"
    },
    {
        "name": "tools/computeHelper.ts"
    },
    {
        "name": "tools/exrSerializer.ts"
    },
    {
        "name": "tools/math.vector.float32.ts"
    },
    {
        "name": "tools/RTTDebug.ts"
    },
    {
        "name": "tools/skyMaterialExt.ts"
    },
]

wgsl = [
    "initialSpectrum",
    "initialSpectrum2",
    "fftPrecompute",
    "fftInverseFFT",
    "fftInverseFFT2",
    "fftInverseFFT3",
    "timeDependentSpectrum",
    "wavesTexturesMerger",
]
pgCode = []
pgCode.append('''
/**
 * Based on the great Unity project https://github.com/gasgiant/FFT-Ocean by Ivan Pensionerov (https://github.com/gasgiant)
 */

async function createEngine() {
    const webGPUSupported = await (BABYLON.WebGPUEngine as any).IsSupportedAsync;
    if (webGPUSupported) {
        const engine = new BABYLON.WebGPUEngine(document.getElementById("renderCanvas") as HTMLCanvasElement);
        await engine.initAsync();
        return engine;
    }
    return new BABYLON.Engine(document.getElementById("renderCanvas") as HTMLCanvasElement, true);
}

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): Promise<BABYLON.Scene> {
        const oceanDemo = new Ocean();
        return oceanDemo.createScene(engine, canvas);
    }
}
''')
for file in files:
    name = file['name']

    f = open('%s%s' % (sourceDir, name), 'rt')
    code = ''.join(f.readlines())

    for greplace in globalReplaces:
        find = greplace['find']
        val = greplace['replace']
        code = re.sub(find, val, code)

    pgCode.append(code)

pgCode.append('\r\n')

for name in wgsl:
    f = open('%s%s.wgsl' % (wgslDir, name))
    pgCode.append('const %sCS = `\n%s`' % (name, ''.join(f.readlines())))
    f.close()

f = open('codePG.js', 'wt')
f.write('\r\n'.join(pgCode))
f.close()