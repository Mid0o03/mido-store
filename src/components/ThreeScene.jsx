import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

const GeometricCore = () => {
    const meshRef = useRef();

    useFrame((state, delta) => {
        // Continuous rotation
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.3;
    });

    return (
        <mesh ref={meshRef}>
            <icosahedronGeometry args={[2, 0]} />
            <meshBasicMaterial
                color="#39FF14"
                wireframe
                transparent
                opacity={0.4}
            />
        </mesh>
    );
};

const InnerCore = () => {
    const meshRef = useRef();

    useFrame((state, delta) => {
        // Counter rotation
        meshRef.current.rotation.x -= delta * 0.3;
        meshRef.current.rotation.y -= delta * 0.4;
    });

    return (
        <mesh ref={meshRef} scale={0.5}>
            <octahedronGeometry args={[1.5, 0]} />
            <meshBasicMaterial
                color="#ffffff"
                wireframe
                transparent
                opacity={0.6}
            />
        </mesh>
    );
};

const ThreeScene = () => {
    return (
        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
                    <GeometricCore />
                    <InnerCore />
                </Float>
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

                {/* Post-Processing Effects */}
                <EffectComposer>
                    <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                    <ChromaticAberration offset={[0.002, 0.002]} />
                </EffectComposer>

                {/* Mouse Parallax (Rig) */}
                <Rig />
            </Canvas>
        </div>
    );
};

// Parallax Camera Rig
const Rig = () => {
    const { camera, mouse } = useThree();
    useFrame(() => {
        // eslint-disable-next-line react-hooks/immutability
        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
        // eslint-disable-next-line react-hooks/immutability
        camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    });
    return null;
};

export default ThreeScene;
