/**
 * Core board and block types for LiveCanvas AI
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Base interface for all block types
 */
export interface BaseBlock {
  id: string;
  position: Position;
  size: Size;
  createdAt?: number;
  createdBy?: string;
}

/**
 * Mermaid diagram block
 */
export interface MermaidBlock extends BaseBlock {
  type: 'mermaid';
  code: string;
  lastValidCode: string;
}

/**
 * Sticky note colors
 */
export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

/**
 * Sticky note block
 */
export interface StickyNoteBlock extends BaseBlock {
  type: 'sticky';
  content: string;
  color: StickyColor;
}

/**
 * Text block font sizes
 */
export type TextFontSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Plain text block
 */
export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  fontSize: TextFontSize;
  fontWeight: 'normal' | 'bold';
}

/**
 * Union type for all canvas blocks
 */
export type CanvasBlock = MermaidBlock | StickyNoteBlock | TextBlock;

/**
 * Type guard for MermaidBlock
 */
export function isMermaidBlock(block: CanvasBlock): block is MermaidBlock {
  return block.type === 'mermaid';
}

/**
 * Type guard for StickyNoteBlock
 */
export function isStickyNoteBlock(block: CanvasBlock): block is StickyNoteBlock {
  return block.type === 'sticky';
}

/**
 * Type guard for TextBlock
 */
export function isTextBlock(block: CanvasBlock): block is TextBlock {
  return block.type === 'text';
}

/**
 * Board containing all blocks
 */
export interface Board {
  id: string;
  blocks: CanvasBlock[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Default sticky note colors with their CSS values
 */
export const STICKY_COLORS: Record<StickyColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  pink: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  blue: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  green: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  purple: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  orange: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
};

/**
 * Default sizes for different block types
 */
export const DEFAULT_BLOCK_SIZES: Record<CanvasBlock['type'], Size> = {
  mermaid: { width: 400, height: 300 },
  sticky: { width: 200, height: 150 },
  text: { width: 200, height: 50 },
};
