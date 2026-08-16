export type Provenance = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export interface KGNode {
  id?: number;
  label: string;
  name: string;
  qualified_name?: string;
  properties?: Record<string, any>;
  provenance?: Provenance;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KGEdge {
  id?: number;
  source_id: number;
  target_id: number;
  type: string;
  properties?: Record<string, any>;
  provenance?: Provenance;
  weight?: number;
  created_at?: string;
}

export interface KGNodeWithDegree extends KGNode {
  in_degree?: number;
  out_degree?: number;
  total_degree?: number;
  community_id?: number;
}

export interface CentralityMetrics {
  node_id: number;
  name: string;
  label: string;
  degree: number;
  in_degree: number;
  out_degree: number;
  pagerank: number;
  betweenness: number;
  closeness: number;
}

export interface CommunityDetectionResult {
  algorithm: string;
  modularity: number;
  communities_count: number;
  assignments: {
    node_id: number;
    name: string;
    community_id: number;
  }[];
}

export interface ImpactAnalysisResult {
  target_node: KGNode;
  direct_dependents: KGNode[];
  indirect_dependents: KGNode[];
  total_affected_count: number;
  blast_radius_score: number;
}

export interface WhatIfRemovalResult {
  target_node: KGNode;
  edges_lost: number;
  nodes_isolated: KGNode[];
  affected_paths_count: number;
}

export interface GraphPath {
  nodes: KGNode[];
  edges: KGEdge[];
  total_weight: number;
  length: number;
}
