
import React from 'react';
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
    LayoutTemplate,
    DoorOpen,
    AppWindow,
    Info
} from 'lucide-react';

interface UIProps {
    activeTool: PartType | null;
    selectedPartId: string | null;
    onSelectTool: (type: PartType) => void;
    onStopPlacing: () => void;
    onClear: () => void;
    onLoadPreset: () => void;
    onRotate: () => void;
    onDelete: () => void;
    onMaterialChange: (val: string) => void;
    totalPrice: number;
}

export const UI: React.FC<UIProps> = ({
    activeTool,
    selectedPartId,
    onSelectTool,
    onStopPlacing,
    onClear,
    onLoadPreset,
    onRotate,
    onDelete,
    onMaterialChange,
    totalPrice
}) => {
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
                    <button
                        onClick={onLoadPreset}
                        title="Load Preset"
                        style={{
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#f8f9fa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '0.8rem'
                        }}
                    >
                        <LayoutTemplate size={16} /> preset
                    </button>
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

            {/* Price Tag & Status */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                pointerEvents: 'auto',
                background: 'rgba(255,255,255,0.95)',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                    Total Estimate
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2b2b2b' }}>
                    ¥{totalPrice.toLocaleString()}
                </div>

                <div style={{ borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '10px', fontSize: '0.9rem', color: '#444' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={16} color="#007bff" />
                        {activeTool
                            ? <span><strong>Placing {PARTS.find(p => p.type === activeTool)?.label}</strong>. 'R' rotates.</span>
                            : selectedPartId
                                ? <span>Item Selected</span>
                                : "Ready to build"}
                    </p>
                </div>
            </div>

            {/* Help / Instructions (Bottom Center? Let's keep it simple for now, using Status box above) */}
        </div>
    );
};

