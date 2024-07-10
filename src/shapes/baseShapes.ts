
import * as THREE from 'three';

export interface IWallSettings {
    width: number;
    height: number;
    depth: number;
    material: THREE.Material;
    position: {
        x?: number;
        y: number;
        z?: number;
    };
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
}