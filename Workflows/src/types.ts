export interface WorkflowState {
  name: string;
  transitions: string[];
  requires_approval?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  states: WorkflowState[];
  created_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  current_state: string;
  history: { from: string; to: string; timestamp: string }[];
  status: 'running' | 'completed' | 'waiting_approval';
}
