import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { BASIC_SAUNA_PRESET } from './store';
import type { SaunaPart, PartType } from './store';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [parts, setParts] = useState<SaunaPart[]>([]);
  const [activeTool, setActiveTool] = useState<PartType | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [ghostRotation, setGhostRotation] = useState<number>(0);

  const handleToolSelect = (type: PartType) => {
    setActiveTool(type);
    setSelectedPartId(null);
    setGhostRotation(0); // Reset rotation when picking new tool
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

  const handleLoadPreset = () => {
    handleClear();
    const newParts = BASIC_SAUNA_PRESET.map(p => ({
      ...p,
      id: uuidv4()
    }));
    setParts(newParts as SaunaPart[]);
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
        onLoadPreset={handleLoadPreset}
        selectedPartId={selectedPartId}
        onRotate={handleRotate}
        onDelete={handleDelete}
        onMaterialChange={handleMaterialChange}
        onStopPlacing={() => setActiveTool(null)}
      />
    </>
  );
}

export default App;
