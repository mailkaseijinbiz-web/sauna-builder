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
    const WALL_WIDTH = 2; // meters (from dimensions)

    // Calculate centering offset to keep everything near 0,0
    // But for simplicity, let's build from (0,0) to positive X and negative Z, then maybe shift? 
    // Or just standard coordinates: 
    // X: 0 to width*2
    // Z: 0 to -depth*2

    // Walls
    // Back (at z = -depth * 2) - facing forward (rotation 0)?
    // Wait, rotation 0 means local Z+?
    // Scene boxGeometry is centered.
    // If rot 0: Width in X, thickness in Z.
    for (let x = 0; x < width; x++) {
      const xPos = x * WALL_WIDTH + (WALL_WIDTH / 2); // 1, 3, 5...
      const zPos = -depth * WALL_WIDTH;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, 1.5, zPos], rotation: [0, 0, 0] });
    }

    // Front (at z = 0)
    // If one block is 'door', we skip that wall or replace it. 
    // Let's replace the first block (left-most) or middle? Let's do the first one for 1x1, or random?
    // User asked: "Door is a block of same size". So it replaces a wall.
    const doorIndex = Math.floor(width / 2); // Center-ish

    for (let x = 0; x < width; x++) {
      const xPos = x * WALL_WIDTH + (WALL_WIDTH / 2);
      const zPos = 0;
      if (x === doorIndex) {
        generatedParts.push({ id: uuidv4(), type: 'door', position: [xPos, 1.5, zPos], rotation: [0, 0, 0] });
      } else {
        generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, 1.5, zPos], rotation: [0, 0, 0] });
      }
    }

    // Left (at x = 0) - rotated 90 deg around Y. 
    // If rotated 90, dimension X becomes depth. Wall is 2 wide.
    // So it runs along Z.
    for (let z = 0; z < depth; z++) {
      const zPos = -(z * WALL_WIDTH + (WALL_WIDTH / 2)); // -1, -3...
      const xPos = 0;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, 1.5, zPos], rotation: [0, Math.PI / 2, 0] });
    }

    // Right (at x = width * 2)
    for (let z = 0; z < depth; z++) {
      const zPos = -(z * WALL_WIDTH + (WALL_WIDTH / 2));
      const xPos = width * WALL_WIDTH;
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [xPos, 1.5, zPos], rotation: [0, Math.PI / 2, 0] });
    }

    // Bench (Back wall, full width?)
    // Bench is 2m wide. Place as many as fit width.
    for (let x = 0; x < width; x++) {
      const xPos = x * WALL_WIDTH + (WALL_WIDTH / 2);
      // z position: near back wall. Back wall is at -depth*2. Bench depth 0.6.
      // Center of bench needs to be: -depth*2 + 0.5 (dimension/2 approx)?
      // part Z pos: -depth*2 + 0.3 (to put it inside)
      generatedParts.push({ id: uuidv4(), type: 'bench', position: [xPos, 0.25, -depth * WALL_WIDTH + 0.6], rotation: [0, 0, 0] });
    }

    // Heater
    // Place in corner opposite to door if possible, or just front corner?
    // Door is at width/2 (front). Heater at right-back corner?
    // Position: width*2 - 0.5, -depth*2 + 0.5 ?
    // Let's place it in Front-Right corner if door is Center/Left.
    // Front is Z=0. Right is X=width*2.
    // Heater check:
    // x: width*2 - 0.6 (heater is 1.2 wide, so 0.6 from edge)
    // z: -0.6
    const heaterX = width * WALL_WIDTH - 0.6;
    const heaterZ = -0.6;

    // Only place heater if it doesn't overlap excessively with door (if door is 1x1, it takes x 0..1? No, 0..2).
    // If width=1, door is at X 0..2. Heater at X 1.4? Overlap risk.
    // With width=1 (1x1 room), door takes whole front. Heater must go back?
    if (width === 1 && depth === 1) {
      // Tiny room. Heater in back corner?
      // Bench is at back.
      // Maybe Heater Front-Left? (Door is front, replacing wall).
      // Actually if Door replaces Front Wall, there is no "corner" in front wall that is wall.
      // But heater sits on floor.
      // Let's put heater in back right corner.
      generatedParts.push({ id: uuidv4(), type: 'heater', position: [width * WALL_WIDTH - 0.5, 0.4, -depth * WALL_WIDTH + 0.5], rotation: [0, 0, 0] });
    } else {
      generatedParts.push({ id: uuidv4(), type: 'heater', position: [heaterX, 0.4, heaterZ], rotation: [0, 0, 0] });
    }

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
      if (activeTool === 'wall') newPart.position[1] = 1.5;
      if (activeTool === 'bench') newPart.position[1] = 0.25;
      if (activeTool === 'heater') newPart.position[1] = 0.4;
      if (activeTool === 'door') newPart.position[1] = 1.1;
      if (activeTool === 'window') newPart.position[1] = 1.5;

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
