import { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  
  // Simple noise function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    vec2 uv = vUv;
    vec2 mouse = uMouse * 0.5 + 0.5;
    
    float time = uTime * 0.1;
    
    // Layered noise
    float n = noise(uv * 3.0 + time) * 0.5;
    n += noise(uv * 6.0 - time * 0.5) * 0.25;
    n += noise(uv * 12.0 + time * 0.3) * 0.125;
    
    // Mouse influence
    float mouseDist = distance(uv, mouse);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.2;
    
    // Color
    vec3 darkColor = vec3(0.035, 0.035, 0.04);
    vec3 midColor = vec3(0.06, 0.06, 0.065);
    vec3 accentColor = vec3(0.83, 0.65, 0.46);
    
    vec3 color = mix(darkColor, midColor, n + mouseInfluence);
    color += accentColor * (n * 0.015 + mouseInfluence * 0.04);
    
    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.6;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface NoisePlaneProps {
  isPaused: boolean;
}

const NoisePlane = ({ isPaused }: NoisePlaneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame((state) => {
    // Skip updates when paused (tab hidden)
    if (isPaused || !meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    
    mouseRef.current.x += (state.mouse.x - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (state.mouse.y - mouseRef.current.y) * 0.05;
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
  });

  return (
    <mesh ref={meshRef} scale={[2, 2, 1]}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const WebGLBackground = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Pause render loop when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Skip WebGL entirely for reduced motion users
  if (prefersReducedMotion) {
    return <div className="fixed inset-0 -z-10 bg-background" />;
  }

  return (
    <div className="fixed inset-0 -z-10 bg-background">
      <Suspense fallback={<div className="w-full h-full bg-background" />}>
        <Canvas
          camera={{ position: [0, 0, 1], fov: 75 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          frameloop={isPaused ? 'demand' : 'always'}
        >
          <NoisePlane isPaused={isPaused} />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default WebGLBackground;
