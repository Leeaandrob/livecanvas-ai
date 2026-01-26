/**
 * Core board and block types for LiveCanvas AI
 */

export interface Board {
  id: string;
  blocks: MermaidBlock[];
  createdAt: number;
  updatedAt: number;
}

export interface MermaidBlock {
  id: string;
  code: string;
  position: Position;
  size: Size;
  lastValidCode: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
