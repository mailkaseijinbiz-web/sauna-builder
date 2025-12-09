import React, { useState } from 'react';
import { PARTS, MATERIALS } from '../store';
import type { PartType } from '../store';
import {
    MousePointer2,
    RotateCw,
    Trash2,
    Flame,
    Square,
    Armchair,
    XCircle,
    DoorOpen,
    AppWindow,
    Info,
    Wand2
} from 'lucide-react';

interface UIProps {
    activeTool: PartType | null;
    selectedPartId: string | null;
    onSelectTool: (type: PartType) => void;
    onStopPlacing: () => void;
    onClear: () => void;
    onAutoBuild: (width: number, depth: number) => void;
    onRotate: () => void;
    onDelete: () => void;
    onMaterialChange: (val: string) => void;
}

export const UI: React.FC<UIProps> = ({
    activeTool,
    selectedPartId,
    onSelectTool,
    onStopPlacing,
    onClear,
    onAutoBuild,
    onRotate,
    onDelete,
    onMaterialChange
}) => {
    // Size selection state
    const [selectedSize, setSelectedSize] = useState<string>("1x1");

    const getIconForPart = (type: PartType) => {
        switch (type) {
            case 'wall': return <Square size={20} />;
            case 'heater': return <Flame size={20} />;
            case 'bench': return <Armchair size={20} />;
            case 'door': return <DoorOpen size={20} />;
            case 'window': return <AppWindow size={20} />;
            default: return <Square size={20} />;
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 10,
            pointerEvents: 'none' // Allow click through to canvas unless on button
        }}>
            {/* Sidebar Toolbar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minWidth: '70px',
                alignItems: 'center',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={onStopPlacing}
                        title="Select Mode"
                        style={{
                            padding: '14px',
                            border: activeTool === null && selectedPartId === null ? '2px solid #007bff' : '2px solid transparent',
                            borderRadius: '8px',
                            background: 'white',
                            color: '#333',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <MousePointer2 size={24} />
                    </button>
                    {PARTS.map((part) => (
                        <button
                            key={part.type}
                            onClick={() => activeTool === part.type ? onStopPlacing() : onSelectTool(part.type)}
                            title={part.label}
                            style={{
                                padding: '12px',
                                border: activeTool === part.type ? '2px solid #007bff' : '2px solid transparent',
                                borderRadius: '8px',
                                background: part.color,
                                color: 'white',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                outline: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {getIconForPart(part.type)}
                        </button>
                    ))}
                </div>

                {selectedPartId && (
                    <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <select
                            onChange={(e) => onMaterialChange(e.target.value)}
                            style={{ padding: '5px', borderRadius: '4px', width: '100%' }}
                            title="Change Material"
                        >
                            {MATERIALS.map(m => (
                                <option key={m.label} value={m.value}>{m.label}</option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                                onClick={onRotate}
                                title="Rotate (R)"
                                style={{ flex: 1, padding: '10px', cursor: 'pointer', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', justifyContent: 'center' }}
                            >
                                <RotateCw size={18} />
                            </button>
                            <button
                                onClick={onDelete}
                                title="Delete"
                                style={{ flex: 1, padding: '10px', cursor: 'pointer', background: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '4px', display: 'flex', justifyContent: 'center' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '5px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            value={selectedSize}
                            onChange={(e) => setSelectedSize(e.target.value)}
                            style={{
                                padding: '5px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                flex: 1,
                                fontSize: '0.8rem'
                            }}
                        >
                            <option value="1x1">1x1 (0.5坪/約1x1m)</option>
                            <option value="1x2">1x2 (1坪/約1x2m)</option>
                            <option value="2x1">2x1 (1坪/約2x1m)</option>
                            <option value="2x2">2x2 (2坪/約2x2m)</option>
                            <option value="3x2">3x2 (3坪/約3x2m)</option>
                            <option value="2x3">2x3 (3坪/約2x3m)</option>
                            <option value="3x3">3x3 (4.5坪/約3x3m)</option>
                        </select>
                        <button
                            onClick={() => {
                                const [w, d] = selectedSize.split('x').map(Number);
                                onAutoBuild(w, d);
                            }}
                            title="Auto Build with selected size"
                            style={{
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                                color: '#006064',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                flex: 1
                            }}
                        >
                            <Wand2 size={16} /> Auto
                        </button>
                    </div>
                    <button
                        onClick={onClear}
                        title="Clear All"
                        style={{
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: 'white',
                            color: '#d32f2f',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <XCircle size={20} />
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
                background: 'rgba(255,255,255,0.9)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                backdropFilter: 'blur(5px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={16} color="#007bff" />
                    {activeTool
                        ? <span><strong>Placing {PARTS.find(p => p.type === activeTool)?.label}</strong>. Press 'R' to rotate.</span>
                        : selectedPartId
                            ? <span>Item Selected. 'R' rotates, 'Del' removes.</span>
                            : "Ready to build. Select a tool or click Auto Build."}
                </p>
            </div>
        </div>
    );
};
