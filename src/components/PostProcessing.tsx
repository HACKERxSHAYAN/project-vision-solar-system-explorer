import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

function PostProcessing() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.6}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.025}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
        radius={0.85}
        levels={9}
      />
      <Vignette
        offset={0.28}
        darkness={0.72}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default PostProcessing;
