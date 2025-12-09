import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment } from '@react-three/drei';
import { PARTS } from '../store';
import type { SaunaPart, PartType } from '../store';

interface SceneProps {
    parts: SaunaPart[];
    activeTool: PartType | null;
    selectedPartId: string | null;
    ghostRotation?: number; // Optional prop
    onPartClick?: (id: string) => void;
    onPlaneClick?: (point: [number, number, number]) => void;
}

interface PartMeshProps {
    part: SaunaPart;
    isSelected?: boolean;
    onClick: (id: string) => void;
    onPointerMove?: (e: any) => void;
    onPointerLeave?: (e: any) => void;
}

const PartMesh = ({ part, isSelected, onClick, onPointerMove, onPointerLeave }: PartMeshProps) => {
    const def = PARTS.find(p => p.type === part.type);
    if (!def) return null;

    // Enhanced Material Properties
    const getMaterialProps = (type: string) => {
        switch (type) {
            case 'wall': return { roughness: 0.9, metalness: 0.1 }; // Matte wood
            case 'bench': return { roughness: 0.6, metalness: 0.0 }; // Smooth wood
            case 'heater': return { roughness: 0.4, metalness: 0.8, color: '#222' }; // Metal
            case 'door': return { roughness: 0.2, metalness: 0.1 }; // Glass/Wood
            case 'window': return { roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.3 };
            default: return { roughness: 0.5 };
        }
    };

    const matProps = getMaterialProps(part.type);

    return (
        <mesh
            position={[...part.position]}
            rotation={[...part.rotation]}
            onClick={(e) => { e.stopPropagation(); onClick(part.id); }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[...def.dimensions]} />
            <meshStandardMaterial
                color={isSelected ? '#ff4444' : (part.materialColor || def.color)}
                emissive={isSelected ? '#aa0000' : '#000000'}
                {...matProps}
            />
            {part.type === 'door' && (
                <group position={[0.35, -0.2, 0.06]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.1]} />
                        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.9} />
                    </mesh>
                </group>
            )}
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
        <Canvas shadows camera={{ position: [4, 4, 4], fov: 50 }}>
            {/* Better Lighting Environment */}
            <ambientLight intensity={0.5} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Environment preset="sunset" background blur={0.6} />
            <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />

            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} /> {/* Limit camera going under floor */}

            {/* Shadows */}
            <Grid
                position={[0, 0.01, 0]}
                args={[20, 20]} // Larger grid
                cellSize={0.91}
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
