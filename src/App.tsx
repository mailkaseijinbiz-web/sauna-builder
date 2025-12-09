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

  const handleAutoBuild = () => {
    // Logic to procedurally generate a sauna
    handleClear();
    const generatedParts: SaunaPart[] = [];
    const width = Math.floor(Math.random() * 3) + 2; // 2 to 4
    const depth = Math.floor(Math.random() * 3) + 2; // 2 to 4

    // Walls
    // Back
    for (let x = 0; x < width; x++) {
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [x, 1.5, -depth], rotation: [0, 0, 0] });
    }
    // Left
    for (let z = 0; z < depth; z++) {
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [-1, 1.5, -z], rotation: [0, Math.PI / 2, 0] });
    }
    // Right
    for (let z = 0; z < depth; z++) {
      generatedParts.push({ id: uuidv4(), type: 'wall', position: [width, 1.5, -z], rotation: [0, Math.PI / 2, 0] });
    }

    // Bench
    generatedParts.push({ id: uuidv4(), type: 'bench', position: [0, 0.25, -depth + 1], rotation: [0, 0, 0] });

    // Heater
    generatedParts.push({ id: uuidv4(), type: 'heater', position: [width - 1, 0.4, -0.5], rotation: [0, 0, 0] }); // Near front right

    // Door
    generatedParts.push({ id: uuidv4(), type: 'door', position: [0, 1.1, 0.5], rotation: [0, 0, 0] });

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
