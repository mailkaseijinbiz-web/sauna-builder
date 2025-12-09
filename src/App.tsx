import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import type { SaunaPart, PartType } from './store';
import { v4 as uuidv4 } from 'uuid';
const STORAGE_KEY = 'sauna_builder_parts_v1';

export default function App() {
  const [parts, setParts] = useState<SaunaPart[]>(() => {
    // Initialize from local storage if available
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTool, setActiveTool] = useState<PartType | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [ghostRotation, setGhostRotation] = useState<number>(0);

  const handleToolSelect = (type: PartType) => {
    setActiveTool(type);
    setSelectedPartId(null);
    setGhostRotation(0); // Reset rotation when picking new tool
  };

  // Auto-save whenever parts change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  }, [parts]);

  const handleAutoBuild = (width: number, depth: number) => {
    handleClear();
    const generatedParts: SaunaPart[] = [];

    // Constants
    const MODULE = 0.91; // 910mm
    const WALL_HEIGHT = 2.2;

    // We need to place walls so they don't overlap in a bad way.
    // Strategy: 
    // Back/Front walls span the full width.
    // Side walls sit "inside" or "between" the Back/Front walls? 
    // Or Back/Front sit between Side/Side?
    // Let's do: Side walls are full depth. Front/Back fill the gap.
    // Actually, standard construction often corners overlap.
    // Let's stick to center-line placement for simplicity of grid, but maybe offset slightly?
    // Re-reading user request: "壁は重ならないように" (Walls should not overlap).
    // If we place them on a grid of 0.91, and they are 0.91 wide, they touch edges.
    // But corners?
    // Corner: Wall along X meets Wall along Z. They will intersect.
    // To strictly avoid overlap, we need to shorten one of them or move them.
    // Let's treat "width" and "depth" as INNER dimensions or OUTER dimensions?
    // Let's assume Module grid lines.
    // Corner solution: Place a "Post" (Pillar) at corners? Or just let them butt joint.
    // Simple Butt Joint: Side walls run full Length. Front/Back run Width minus 2*Thickness.
    // But we are using modular parts of fixed 0.91 width. We can't shrink them easily without scaling.
    // If we scale, texture/UVs might look weird (but we have solid color now).

    // Let's try: Place on Grid. 
    // X poses: 0, 0.91, 1.82...
    // Corner intersection is practically unavoidable with fixed blocks unless we have Corner Blocks.
    // "Door and Window are modules of same size".
    // Let's assume overlap at corners is acceptable for this prototype if visual z-fighting is minimal.
    // Or, we shift Side walls to be "outside" the Back/Front lines?

    // Let's stick to the module grid for placement centers.
    // Width = 2 means 2 modules wide (1.82m).

    // Walls
    // Back (at z = -depth * MODULE)
    for (let x = 0; x < width; x++) {
      const xPos = x * MODULE + (MODULE / 2);
      const zPos = -depth * MODULE;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, WALL_HEIGHT / 2, zPos], rotation: [0, 0, 0] });
    }

    // Front (at z = 0)
    const doorIndex = Math.floor(width / 2);
    for (let x = 0; x < width; x++) {
      const xPos = x * MODULE + (MODULE / 2);
      const zPos = 0;
      if (x === doorIndex) {
        generatedParts.push({ id: uuidv4(), type: 'door', position: [xPos, WALL_HEIGHT / 2, zPos], rotation: [0, 0, 0] });
      } else {
        generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, WALL_HEIGHT / 2, zPos], rotation: [0, 0, 0] });
      }
    }

    // Left (at x = 0) - rotated 90 deg. 
    // Center of wall is at X=0, Z=...
    // If Back wall is at Z = -depth*MODULE. 
    // And Left wall is 0.91 long.
    // It should start from Z=0 to Z=-depth*MODULE.
    // If we place at X=0, it intersects the end of Front/Back walls (which extend 0.455 from their center).
    // Center X of Left wall: 0.
    // It extends X: -0.05 to +0.05 (thickness).
    // Front/Back Walls at X=0.455 extend X: 0 to 0.91.
    // So they don't touch? 
    // Left Wall X=0. Front Wall starts at X=0. No overlap! They just touch at corner?
    // Wait. Left Wall (rotated) Width is 0.91 along Z. Thickness 0.1 along X.
    // It occupies X: -0.05 to 0.05.
    // THe first Front Wall (x=0) is at Center X=0.455. Width 0.91. Occupies X: 0.0 to 0.91.
    // So X=0 is the edge. They touch perfectly!
    // But Z?
    // Front wall is at Z=0. Thickness 0.1 (-0.05 to 0.05).
    // Left wall (z=0 module) center Z = -0.455. Extends 0 to -0.91.
    // At Z=0 (actually -0.05 to 0 since it starts there?), it touches Front Wall's back face (-0.05)?
    // This seems like a good "Corner" if we align them right.

    // Side Walls
    for (let z = 0; z < depth; z++) {
      const zPos = -(z * MODULE + (MODULE / 2));
      const xPos = 0;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, WALL_HEIGHT / 2, zPos], rotation: [0, Math.PI / 2, 0] });
    }

    // Right (at x = width * MODULE)
    for (let z = 0; z < depth; z++) {
      const zPos = -(z * MODULE + (MODULE / 2));
      const xPos = width * MODULE;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, WALL_HEIGHT / 2, zPos], rotation: [0, Math.PI / 2, 0] });
    }

    // Bench 
    for (let x = 0; x < width; x++) {
      const xPos = x * MODULE + (MODULE / 2);
      // Bench dims: 0.91 width, 0.45 depth.
      // Place against back wall (-depth*MODULE).
      // Wall inner face is -depth*MODULE + 0.05.
      // Bench center Z = -depth*MODULE + 0.05 + 0.225 (half depth) = + 0.275 approx
      generatedParts.push({ id: uuidv4(), type: 'bench', position: [xPos, 0.25, -depth * MODULE + 0.3], rotation: [0, 0, 0] }); // 0.25 Y is half height?
      // Bench height 0.45 -> Y center 0.225.
    }

    // Heater
    // Corner
    const heaterX = width * MODULE - 0.45; // Half module from right
    const heaterZ = -0.45; // Half module from front

    generatedParts.push({ id: uuidv4(), type: 'heater', position: [heaterX, 0.4, heaterZ], rotation: [0, 0, 0] });

    setParts(generatedParts);
  };

  const handlePlaneClick = (point: [number, number, number]) => {
    if (activeTool) {
      const newPart: SaunaPart = {
        id: uuidv4(),
        type: activeTool,
        position: point,
        rotation: [0, ghostRotation, 0],
      };
      // Adjust y position based on type dimensions
      if (activeTool === 'wall') newPart.position[1] = 1.1; // 2.2/2
      if (activeTool === 'bench') newPart.position[1] = 0.225; // 0.45/2
      if (activeTool === 'heater') newPart.position[1] = 0.4;
      if (activeTool === 'door') newPart.position[1] = 1.1;
      if (activeTool === 'window') newPart.position[1] = 1.5; // Window high up? Or full height? 1.0 height. Center at 1.5 means 1.0 to 2.0. Good.

      setParts([...parts, newPart]);
      // Optional: Keep tool active or clear it? Let's keep it active for placing multiple.
    } else {
      // Deselect if clicking empty space
      setSelectedPartId(null);
    }
  };

  const handleClear = () => {
    setParts([]);
    setActiveTool(null);
    setSelectedPartId(null);
    setGhostRotation(0);
  };

  const handlePartClick = (id: string) => {
    // If placing, do nothing or maybe cancel? 
    // If not placing, select part.
    if (!activeTool) {
      setSelectedPartId(id);
    }
  };


  // Rotation logic extracted for re-use
  const rotateSelected = () => {
    if (selectedPartId) {
      setParts(prevParts => prevParts.map(p => {
        if (p.id === selectedPartId) {
          return {
            ...p,
            rotation: [p.rotation[0], p.rotation[1] + Math.PI / 2, p.rotation[2]]
          };
        }
        return p;
      }));
    }
  };

  const handleMaterialChange = (color: string) => {
    if (selectedPartId) {
      setParts(prevParts => prevParts.map(p => {
        if (p.id === selectedPartId) {
          return {
            ...p,
            materialColor: color
          };
        }
        return p;
      }));
    }
  };

  const handleRotate = () => {
    rotateSelected();
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        if (activeTool) {
          setGhostRotation(prev => prev + Math.PI / 2);
        } else if (selectedPartId) {
          rotateSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, selectedPartId]); // Removed 'parts' from dependency array due to functional update in rotateSelected

  const handleDelete = () => {
    if (selectedPartId) {
      setParts(parts.filter(p => p.id !== selectedPartId));
      setSelectedPartId(null);
    }
  };

  return (
    <>
      <Scene
        parts={parts}
        activeTool={activeTool}
        ghostRotation={ghostRotation}
        onPartClick={handlePartClick}
        onPlaneClick={handlePlaneClick}
        selectedPartId={selectedPartId}
      />
      <UI
        onSelectTool={handleToolSelect}
        activeTool={activeTool}
        onClear={handleClear}
        onAutoBuild={handleAutoBuild}
        selectedPartId={selectedPartId}
        onRotate={handleRotate}
        onDelete={handleDelete}
        onMaterialChange={handleMaterialChange}
        onStopPlacing={() => setActiveTool(null)}
      />
    </>
  );
}
