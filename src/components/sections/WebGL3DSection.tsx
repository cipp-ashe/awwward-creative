import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

// Vertex shader with displacement
const vertexShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform float uNoiseScale;
  uniform float uDisplacementStrength;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDisplacement;
  varying vec3 vPosition;
  
  // Simplex 3D noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x2_ = x_ * ns.x + ns.yyyy;
    vec4 y2_ = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x2_) - abs(y2_);
    
    vec4 b0 = vec4(x2_.xy, y2_.xy);
    vec4 b1 = vec4(x2_.zw, y2_.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Mouse influence on displacement
    float mouseInfluence = 1.0 + length(uMouse) * 0.3;
    
    // Scroll-driven animation speed
    float scrollSpeed = 0.5 + uScroll * 2.0;
    
    // Noise-based displacement
    float noiseVal = snoise(position * uNoiseScale + vec3(uTime * scrollSpeed * 0.2));
    noiseVal += snoise(position * uNoiseScale * 2.0 + vec3(uTime * scrollSpeed * 0.1)) * 0.5;
    
    // Apply displacement along normal
    float displacement = noiseVal * uDisplacementStrength * mouseInfluence;
    displacement *= 0.5 + uScroll * 0.5; // Scroll increases displacement
    
    vDisplacement = displacement;
    
    vec3 newPosition = position + normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Fragment shader with color based on displacement and scroll
const fragmentShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDisplacement;
  varying vec3 vPosition;
  
  void main() {
    // Fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
    
    // Color based on displacement and scroll
    float colorMix = smoothstep(-0.3, 0.3, vDisplacement);
    vec3 baseColor = mix(uColorA, uColorB, colorMix);
    
    // Add scroll-driven color shift
    baseColor = mix(baseColor, uColorC, uScroll * 0.5);
    
    // Add fresnel glow
    vec3 glowColor = uColorB * 1.5;
    vec3 finalColor = mix(baseColor, glowColor, fresnel * 0.6);
    
    // Subtle pulsing based on time
    finalColor *= 0.9 + sin(uTime * 0.5) * 0.1;
    
    // Mouse proximity effect (brighter near mouse)
    float mouseDist = length(vUv - (uMouse * 0.5 + 0.5));
    finalColor += uColorB * smoothstep(0.5, 0.0, mouseDist) * 0.2;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface DisplacementMeshProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

const DisplacementMesh = ({ scrollProgress, mousePosition }: DisplacementMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  // Memoize uniforms to prevent recreation
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uNoiseScale: { value: 1.5 },
    uDisplacementStrength: { value: 0.3 },
    uColorA: { value: new THREE.Color('#0a0a0a') }, // Dark base
    uColorB: { value: new THREE.Color('#d4a574') }, // Amber accent
    uColorC: { value: new THREE.Color('#1a1a1a') }, // Mid dark
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    
    // Update uniforms
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScroll.value = scrollProgress;
    material.uniforms.uMouse.value.lerp(
      new THREE.Vector2(mousePosition.x, mousePosition.y),
      0.05
    );
    
    // Gentle rotation based on scroll and mouse
    meshRef.current.rotation.x = scrollProgress * Math.PI * 0.5 + mousePosition.y * 0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.1 + mousePosition.x * 0.3;
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    
    // Scale based on scroll
    const scale = 1.5 + scrollProgress * 0.5;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Floating particles around the main object
const Particles = ({ scrollProgress }: { scrollProgress: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 200;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 2;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    pointsRef.current.rotation.x = scrollProgress * Math.PI * 0.25;
    
    // Expand particles based on scroll
    const scale = 1 + scrollProgress * 0.5;
    pointsRef.current.scale.setScalar(scale);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#d4a574"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Post-processing effects with scroll-driven intensity
interface PostProcessingProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

const PostProcessing = ({ scrollProgress, mousePosition }: PostProcessingProps) => {
  const chromaticRef = useRef<any>(null);
  const dofRef = useRef<any>(null);
  
  useFrame(() => {
    if (chromaticRef.current) {
      const offsetX = mousePosition.x * 0.002 * (0.5 + scrollProgress * 0.5);
      const offsetY = mousePosition.y * 0.002 * (0.5 + scrollProgress * 0.5);
      chromaticRef.current.offset.set(offsetX, offsetY);
    }
  });

  // Scroll-driven bloom intensity
  const bloomIntensity = 0.3 + scrollProgress * 0.7;
  const bloomLuminanceThreshold = 0.4 - scrollProgress * 0.2;

  // DOF parameters - focus on center object, blur particles at distance
  // focusDistance: 0 = camera, 1 = far plane. Object is at ~0 from camera perspective
  // As camera orbits (radius 3.5-6.5), adjust focus to keep object sharp
  const baseFocusDistance = 0;
  const focalLength = 0.05 + scrollProgress * 0.03; // Increase focal length with scroll
  const bokehScale = 3 + scrollProgress * 4; // More blur as we scroll

  return (
    <EffectComposer>
      <DepthOfField
        ref={dofRef}
        focusDistance={baseFocusDistance}
        focalLength={focalLength}
        bokehScale={bokehScale}
      />
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        ref={chromaticRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.001, 0.001)}
        radialModulation={false}
        modulationOffset={0.5}
      />
      <Vignette
        offset={0.3}
        darkness={0.5 + scrollProgress * 0.3}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

// Easing functions for camera path
const easingFunctions = {
  // Standard curves
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  
  // Elastic - bouncy overshoot
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Spring - settle with oscillation
  spring: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 :
      t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  
  // Smooth step - extra smooth
  smoothStep: (t: number) => t * t * (3 - 2 * t),
  
  // Exponential
  expoInOut: (t: number) => t === 0 ? 0 : t === 1 ? 1 :
    t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
};

// Segment-based easing - different curves for different scroll phases
const getSegmentedEasing = (progress: number): number => {
  // Phase 1: 0-25% - Smooth start with easeInOut
  if (progress < 0.25) {
    const t = progress / 0.25;
    return easingFunctions.easeInOutCubic(t) * 0.25;
  }
  // Phase 2: 25-50% - Elastic feel for dramatic reveal
  if (progress < 0.5) {
    const t = (progress - 0.25) / 0.25;
    return 0.25 + easingFunctions.elastic(t) * 0.25;
  }
  // Phase 3: 50-75% - Spring for dynamic movement
  if (progress < 0.75) {
    const t = (progress - 0.5) / 0.25;
    return 0.5 + easingFunctions.spring(t) * 0.25;
  }
  // Phase 4: 75-100% - Smooth settle
  const t = (progress - 0.75) / 0.25;
  return 0.75 + easingFunctions.smoothStep(t) * 0.25;
};

// Scroll-driven camera orbit controller
interface CameraControllerProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

const CameraController = ({ scrollProgress, mousePosition }: CameraControllerProps) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 5));
  const currentPosition = useRef(new THREE.Vector3(0, 0, 5));
  
  useFrame(() => {
    // Apply segmented easing to scroll progress
    const easedProgress = getSegmentedEasing(scrollProgress);
    
    // Orbital path parameters with eased progress
    const baseRadius = 5;
    const radiusVariation = 1.5;
    const radius = baseRadius + Math.sin(easedProgress * Math.PI) * radiusVariation;
    
    // Eased orbit rotation
    const theta = easedProgress * Math.PI * 1.5;
    const phi = Math.PI / 2 + Math.sin(easedProgress * Math.PI * 2) * 0.4;
    
    // Mouse adds subtle offset
    const mouseOffsetX = mousePosition.x * 0.3;
    const mouseOffsetY = mousePosition.y * 0.2;
    
    // Spherical to cartesian
    const x = radius * Math.sin(phi) * Math.cos(theta + mouseOffsetX);
    const y = radius * Math.cos(phi) + mouseOffsetY;
    const z = radius * Math.sin(phi) * Math.sin(theta + mouseOffsetX);
    
    targetPosition.current.set(x, y, z);
    
    // Adaptive lerp factor - faster during elastic/spring phases
    const lerpSpeed = scrollProgress > 0.25 && scrollProgress < 0.75 ? 0.12 : 0.08;
    currentPosition.current.lerp(targetPosition.current, lerpSpeed);
    
    camera.position.copy(currentPosition.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

// Scene wrapper component
interface SceneProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

const Scene = ({ scrollProgress, mousePosition }: SceneProps) => {
  return (
    <>
      <CameraController 
        scrollProgress={scrollProgress} 
        mousePosition={mousePosition} 
      />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#d4a574" />
      <DisplacementMesh 
        scrollProgress={scrollProgress} 
        mousePosition={mousePosition} 
      />
      <Particles scrollProgress={scrollProgress} />
      <PostProcessing 
        scrollProgress={scrollProgress} 
        mousePosition={mousePosition} 
      />
    </>
  );
};

const WebGL3DSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Scroll tracking via GSAP ScrollTrigger
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
        onEnter: () => setIsVisible(true),
        onLeave: () => setIsVisible(false),
        onEnterBack: () => setIsVisible(true),
        onLeaveBack: () => setIsVisible(false),
      });
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Mouse tracking
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1]
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <section ref={sectionRef} className="section py-32">
        <div className="section-content text-center">
          <span className="text-mono text-xs text-primary tracking-widest uppercase mb-8 block">
            07 — WebGL
          </span>
          <h2 className="text-display text-display-md mb-6">
            Interactive <span className="text-primary">Depth</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            3D visualization disabled for reduced motion preference.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={sectionRef} 
      className="relative min-h-[200vh]"
      aria-label="Interactive 3D WebGL demonstration"
    >
      {/* Sticky canvas container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* WebGL Canvas - only render when visible */}
        {isVisible && (
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{ 
                  antialias: true, 
                  powerPreference: 'high-performance',
                  alpha: true,
                }}
                style={{ background: 'transparent' }}
              >
                <Scene 
                  scrollProgress={scrollProgress} 
                  mousePosition={mousePosition} 
                />
              </Canvas>
            </Suspense>
          </div>
        )}

        {/* Overlay content */}
        <div className="section-content relative z-10 pointer-events-none">
          <div className="text-center">
            <motion.span 
              className="text-mono text-xs text-primary tracking-widest uppercase mb-8 block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              07 — WebGL
            </motion.span>
            
            <motion.h2 
              className="text-display text-display-md mb-6 blend-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Interactive <span className="text-primary">Depth</span>
            </motion.h2>
            
            <motion.p 
              className="text-muted-foreground max-w-md mx-auto text-balance mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Custom GLSL shaders displace geometry in real-time. 
              Scroll and mouse position modulate the noise field.
            </motion.p>

            {/* Stats display */}
            <motion.div 
              className="flex justify-center gap-8 text-mono text-xs"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <span className="text-primary">{Math.round(scrollProgress * 100)}%</span>
                <span className="text-muted-foreground ml-2">scroll</span>
              </div>
              <div>
                <span className="text-primary">{mousePosition.x.toFixed(2)}</span>
                <span className="text-muted-foreground ml-2">mouse.x</span>
              </div>
              <div>
                <span className="text-primary">{mousePosition.y.toFixed(2)}</span>
                <span className="text-muted-foreground ml-2">mouse.y</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background glow */}
        <div 
          className="glow w-[600px] h-[600px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
          style={{ opacity: 0.1 + scrollProgress * 0.15 }}
        />
      </div>
    </section>
  );
};

export default WebGL3DSection;
