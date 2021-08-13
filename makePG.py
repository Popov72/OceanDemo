import re

sourceDir = 'src/scenes/'
wgslDir = 'assets/ocean/'

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
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/cb69d722ba0e1aed94b8f0e32058b799.exr'"
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
        "find": r"\bfoamPicture\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/9c85eca814352b70dd5242dd178d6d9c.jpg'"
    },
    {
        "find": r"\bqwantani_1k\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/0c03bd6e3c9d04da0cf428bbf487bf68.hdr'"
    },
    {
        "find": r"\bbabylon_buoy\b",
        "replace": "'https://popov72.github.io/BabylonDev/resources/webgpu/oceanDemo/643a55451fd81c682e86ba94241de29e.glb'"
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
async function createEngine() {
    const webGPUSupported = await (BABYLON.WebGPUEngine as any).IsSupportedAsync;
    if (webGPUSupported) {
        const engine = new BABYLON.WebGPUEngine(document.getElementById("renderCanvas") as HTMLCanvasElement, {
            forceCopyForInvertYFinalFramebuffer : true
        });
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

declare var BigInt: any;
declare type BigInt = any;
declare var BigUint64Array: any;
declare type BigUint64Array = any;
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