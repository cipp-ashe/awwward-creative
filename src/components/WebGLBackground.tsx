import { useRef, useMemo, Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

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
  isActive: boolean;
}

const NoisePlane = ({ isActive }: NoisePlaneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame((state) => {
    // Skip updates when not active (visibility gating)
    if (!isActive || !meshRef.current) return;
    
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const { isReducedMotion } = useMotionConfigSafe();

  // Visibility gating: pause when document is hidden or element is not in viewport
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Intersection observer to pause when not visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only set active if document is also visible
        if (document.visibilityState === 'visible') {
          setIsActive(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Context loss handlers
  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGLBackground: Context lost, pausing render');
      setContextLost(true);
      setIsActive(false);
    };

    const handleContextRestored = () => {
      console.info('WebGLBackground: Context restored, resuming render');
      setContextLost(false);
      setIsActive(document.visibilityState === 'visible');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Cleanup on unmount via gl.dispose proxy
    const originalDispose = gl.dispose.bind(gl);
    gl.dispose = () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      originalDispose();
    };
  }, []);

  // REDUCED MOTION GATE: No WebGL activity when reduced motion is enabled
  // This is a hard accessibility requirement - users who request reduced motion
  // should not have GPU-intensive backgrounds running
  if (isReducedMotion) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 -z-10 bg-background"
        aria-hidden="true"
      />
    );
  }

  // Static fallback when context is lost
  if (contextLost) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 -z-10 bg-background"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--muted)) 0%, hsl(var(--background)) 70%)'
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <Suspense fallback={<div className="w-full h-full bg-background" />}>
        <Canvas
          camera={{ position: [0, 0, 1], fov: 75 }}
          dpr={[1, 1.5]}
          frameloop={isActive ? 'always' : 'demand'}
          gl={{ 
            antialias: false, 
            powerPreference: 'high-performance',
            // REMOVED: preserveDrawingBuffer: true
            // Reason: Higher memory usage, slower rendering
            // Context recovery is handled by contextlost/contextrestored events
          }}
          onCreated={handleCreated}
        >
          <NoisePlane isActive={isActive} />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default WebGLBackground;
