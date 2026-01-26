/**
 * Canvas-Agent event types for LiveCanvas AI
 */

import type { MermaidBlock } from "./board";

export interface BoardStateUpdate {
  type: "board.state.update";
  boardId: string;
  blocks: MermaidBlock[];
  selection: string[];
  intent?: string;
}

export interface ProposePatch {
  name: "propose_patch";
  arguments: {
    blockId: string;
    mermaid: string;
    reason: string;
    changes: string[];
  };
}

export interface RequestAnalysis {
  type: "request.analysis";
  boardId: string;
  blockId: string;
  mermaid: string;
}

export interface RequestRefactor {
  type: "request.refactor";
  boardId: string;
  blockId: string;
  mermaid: string;
}

export interface RequestGenerate {
  type: "request.generate";
  boardId: string;
  prompt: string;
}

export interface RequestFixSyntax {
  type: "request.fix-syntax";
  boardId: string;
  blockId: string;
  mermaid: string;
}

export type CanvasAgentEvent =
  | BoardStateUpdate
  | RequestAnalysis
  | RequestRefactor
  | RequestGenerate
  | RequestFixSyntax;
