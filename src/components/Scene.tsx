import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, ContactShadows, Environment } from '@react-three/drei';
import { PARTS } from '../store';
import type { SaunaPart, PartType } from '../store';
import * as THREE from 'three';

interface SceneProps {
    parts: SaunaPart[];
    activeTool: PartType | null;
    selectedPartId: string | null;
    ghostRotation?: number; // Optional prop
    onPartClick?: (id: string) => void;
    onPlaneClick?: (point: [number, number, number]) => void;
}

const PartMesh: React.FC<{
    part: SaunaPart;
    isSelected?: boolean;
    onClick?: () => void
}> = ({ part, isSelected, onClick }) => {
    const def = PARTS.find((p) => p.type === part.type);
    if (!def) return null;

    return (
        <mesh
            position={new THREE.Vector3(...part.position)}
            rotation={new THREE.Euler(...part.rotation)}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[...def.dimensions]} />
            <meshStandardMaterial
                color={isSelected ? '#ff4444' : (part.materialColor || def.color)}
                emissive={isSelected ? '#aa0000' : '#000000'}
                roughness={part.type === 'window' ? 0.2 : 0.8}
                transparent={part.type === 'window'}
                opacity={part.type === 'window' ? 0.6 : 1}
                metalness={part.type === 'window' ? 0.8 : 0}
            />
            {part.type === 'door' && (
                <group position={[0.8, -0.5, 0.12]}>
                    <mesh>
                        <sphereGeometry args={[0.08]} />
                        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
                    </mesh>
                </group>
            )}
            {/* Placeholder for future textures:
               If we had textures, we would load them with useTexture and apply map={texture} 
             */}
        </mesh>
    );
};


export const Scene: React.FC<SceneProps> = ({
    parts,
    activeTool,
    selectedPartId,
    ghostRotation = 0,
    onPartClick,
    onPlaneClick
}) => {
    const [ghostPos, setGhostPos] = React.useState<[number, number, number] | null>(null);

    const handlePointerMove = (e: any) => {
        if (!activeTool) return;
        // Snap to grid (1 unit)
        const x = Math.round(e.point.x);
        const z = Math.round(e.point.z);
        setGhostPos([x, 0, z]);
    };

    const handlePointerLeave = () => {
        setGhostPos(null);
    };

    const getGhostY = (type: PartType) => {
        if (type === 'wall') return 1.5;
        if (type === 'bench') return 0.25;
        if (type === 'heater') return 0.4;
        return 0.5;
    };

    return (
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
            <color attach="background" args={['#f0f0f0']} />

            {/* Environment & Lighting */}
            <Sky sunPosition={[10, 10, 10]} turbidity={0.1} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[10, 10, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <Environment preset="city" />

            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} /> {/* Limit camera going under floor */}

            {/* Shadows */}
            <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={40} blur={2.5} far={4} />

            <Grid
                position={[0, 0.01, 0]}
                args={[20, 20]} // Larger grid
                cellSize={1}
                cellThickness={0.5}
                cellColor="#6f6f6f"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#9d4b4b"
                fadeDistance={30}
                infiniteGrid
            />

            {/* Interactive Plane (Ground) */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onClick={(e) => {
                    e.stopPropagation();
                    // Pass the snapped position
                    if (activeTool && ghostPos) {
                        onPlaneClick?.([ghostPos[0], ghostPos[1], ghostPos[2]]);
                    } else {
                        onPlaneClick?.([e.point.x, e.point.y, e.point.z]); // Just for deselect
                    }
                }}
            >
                <planeGeometry args={[100, 100]} />
                {/* Simple Ground Texture/Material */}
                <meshStandardMaterial color="#556644" roughness={1} />
            </mesh>

            {/* Ghost Part */}
            {activeTool && ghostPos && (
                <mesh
                    position={[ghostPos[0], getGhostY(activeTool), ghostPos[2]]}
                    rotation={[0, ghostRotation, 0]}
                >
                    <boxGeometry args={[...PARTS.find(p => p.type === activeTool)!.dimensions]} />
                    <meshStandardMaterial color={PARTS.find(p => p.type === activeTool)!.color} transparent opacity={0.5} />
                </mesh>
            )}

            {parts.map((part) => (
                <PartMesh
                    key={part.id}
                    part={part}
                    isSelected={part.id === selectedPartId}
                    onClick={() => onPartClick?.(part.id)}
                />
            ))}
        </Canvas>
    );
};
