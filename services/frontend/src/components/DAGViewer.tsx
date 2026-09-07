'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskItem, DependencyItem, UserScoreSummary } from '../lib/types';
import { getEdgeStyle } from '../lib/graphUtils';
import { Clock, AlertCircle, Sparkles, User as UserIcon } from 'lucide-react';

interface DAGViewerProps {
  tasks: TaskItem[];
  dependencies: DependencyItem[];
  users: UserScoreSummary[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

// Custom Task Node Component
const CustomTaskNode = ({ data }: { data: any }) => {
  const isOverloaded = data.isOverloaded;
  const isSelected = data.isSelected;

  return (
    <div
      onClick={data.onClick}
      className={`relative cursor-pointer rounded-xl p-4 w-64 transition-all duration-300 ${
        isOverloaded
          ? 'border-2 border-red-500 bg-red-950/40 shadow-xl shadow-red-500/20 animate-pulse'
          : isSelected
          ? 'border-2 border-indigo-500 bg-slate-900/90 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/30'
          : 'border border-slate-800 bg-slate-900/80 hover:border-slate-700 shadow-md shadow-slate-950/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5" />

      {/* Task Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold text-indigo-400">{data.externalId}</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            data.status === 'IN_PROGRESS'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {data.status}
        </span>
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-semibold text-slate-100 line-clamp-2 mb-3 leading-snug">
        {data.title}
      </h3>

      {/* Assignee & Hours */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-1.5">
          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[100px]">{data.assigneeName}</span>
        </div>
        <div className="flex items-center space-x-1 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{data.hoursRemaining}h</span>
        </div>
      </div>

      {/* Overload Alert Tag */}
      {isOverloaded && (
        <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] text-red-400 font-semibold">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span>Assignee Overloaded (W &gt; 1.0)</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5" />
    </div>
  );
};

export const DAGViewer: React.FC<DAGViewerProps> = ({
  tasks,
  dependencies,
  users,
  selectedTaskId,
  onSelectTask,
}) => {
  const nodeTypes = useMemo(() => ({ taskNode: CustomTaskNode }), []);

  // Map tasks to ReactFlow Nodes
  const nodes: Node[] = useMemo(() => {
    return tasks.map((task, index) => {
      const user = users.find((u) => u.user_id === task.assigned_to || u.name === task.assignee_name);
      const isOverloaded = user?.is_overloaded ?? false;

      return {
        id: task.id,
        type: 'taskNode',
        position: { x: index * 280 + 40, y: index % 2 === 0 ? 60 : 200 },
        data: {
          externalId: task.external_id,
          title: task.title,
          status: task.status,
          hoursRemaining: task.hours_remaining,
          assigneeName: task.assignee_name || user?.name || 'Unassigned',
          isOverloaded,
          isSelected: task.id === selectedTaskId,
          onClick: () => onSelectTask(task.id),
        },
      };
    });
  }, [tasks, users, selectedTaskId, onSelectTask]);

  // Map dependencies to ReactFlow Edges (Inferred = Dashed, Explicit = Solid)
  const edges: Edge[] = useMemo(() => {
    return dependencies.map((dep) => {
      const style = getEdgeStyle(dep.confidence);
      const isInferred = dep.confidence === 'inferred';

      return {
        id: dep.id,
        source: dep.blocking_task_id,
        target: dep.dependent_task_id,
        animated: isInferred, // Flow animation along inferred edge
        style: {
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
        },
        label: isInferred ? 'Inferred Link (Mined)' : 'Explicit',
        labelStyle: {
          fill: isInferred ? '#94a3b8' : '#818cf8',
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
        },
      };
    });
  }, [dependencies]);

  return (
    <div className="w-full h-[380px] rounded-2xl glass-panel relative overflow-hidden border border-slate-800">
      {/* Legend Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-4 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md">
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 bg-indigo-500" />
          <span>Explicit Dependency</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 border-b-2 border-dashed border-slate-400" />
          <span className="text-slate-400">Inferred Edge (Dashed)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400">Bottleneck (W &gt; 1.0)</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#090d16]"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !fill-slate-300" />
      </ReactFlow>
    </div>
  );
};
