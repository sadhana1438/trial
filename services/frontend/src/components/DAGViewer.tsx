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
import { Clock, AlertCircle, GitPullRequestDraft, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface DAGViewerProps {
  tasks: TaskItem[];
  dependencies: DependencyItem[];
  users: UserScoreSummary[];
  selectedTaskId: string | null;
  onSelectTask?: (taskId: string) => void;
  height?: string;
}

// Custom Task Node Component
const CustomTaskNode = ({ data }: { data: any }) => {
  const isOverloaded = data.isOverloaded;
  const isSelected = data.isSelected;

  return (
    <div
      onClick={data.onClick}
      className={`relative cursor-pointer rounded-xl p-3.5 w-64 transition-all duration-200 ${
        isOverloaded
          ? 'border-2 border-red-500 bg-red-950/40 shadow-lg shadow-red-500/20'
          : isSelected
          ? 'border-2 border-indigo-500 bg-slate-900 shadow-lg shadow-indigo-500/20'
          : 'border border-slate-700/90 bg-[#0f172a] hover:border-slate-600 shadow-md shadow-slate-950/40'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-none" />

      {/* Task Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-bold text-indigo-400">{data.externalId}</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
            data.status === 'IN_PROGRESS'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {data.status}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 mb-2 leading-snug">
        {data.title}
      </h4>

      {/* Assignee & Remaining Hours */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center space-x-1.5 truncate max-w-[120px]">
          <UserIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="truncate">{data.assigneeName}</span>
        </div>
        <div className="flex items-center space-x-1 font-mono font-semibold text-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{data.hoursRemaining}h</span>
        </div>
      </div>

      {/* Bottleneck Callout */}
      {isOverloaded && (
        <div className="mt-2 pt-1.5 border-t border-red-500/30 flex items-center justify-between text-[10px] text-red-400 font-bold">
          <span className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>Bottleneck Node</span>
          </span>
          <span className="text-indigo-400 underline font-normal">Click to Simulate</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-none" />
    </div>
  );
};

export const DAGViewer: React.FC<DAGViewerProps> = ({
  tasks,
  dependencies,
  users,
  selectedTaskId,
  onSelectTask,
  height = '420px',
}) => {
  const nodeTypes = useMemo(() => ({ taskNode: CustomTaskNode }), []);

  // Generous horizontal spacing so nodes never get clipped
  const nodes: Node[] = useMemo(() => {
    return tasks.map((task, index) => {
      const user = users.find((u) => u.user_id === task.assigned_to || u.name === task.assignee_name);
      const isOverloaded = user?.is_overloaded ?? task.is_bottleneck ?? false;

      return {
        id: task.id,
        type: 'taskNode',
        position: { x: index * 320 + 60, y: index % 2 === 0 ? 80 : 220 },
        data: {
          externalId: task.external_id,
          title: task.title,
          status: task.status,
          hoursRemaining: task.hours_remaining,
          assigneeName: task.assignee_name || user?.name || 'Unassigned',
          isOverloaded,
          isSelected: task.id === selectedTaskId,
          onClick: () => onSelectTask && onSelectTask(task.id),
        },
      };
    });
  }, [tasks, users, selectedTaskId, onSelectTask]);

  // Edges: Explicit (solid indigo) vs Inferred (dashed with label)
  const edges: Edge[] = useMemo(() => {
    return dependencies.map((dep) => {
      const style = getEdgeStyle(dep.confidence);
      const isInferred = dep.confidence === 'inferred';

      return {
        id: dep.id,
        source: dep.blocking_task_id,
        target: dep.dependent_task_id,
        animated: isInferred,
        style: {
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
        },
        label: isInferred ? 'Inferred Dependency (PR/Commit reference)' : 'Explicit Dependency',
        labelStyle: {
          fill: isInferred ? '#94a3b8' : '#818cf8',
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
      };
    });
  }, [dependencies]);

  return (
    <div
      style={{ height }}
      className="w-full rounded-xl bg-[#0b101b] relative overflow-hidden border border-slate-800 shadow-inner"
    >
      {/* Legend Header */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0f172a]/95 border border-slate-800 text-[11px] text-slate-300 shadow-md">
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 bg-indigo-500 rounded" />
          <span>Solid = Explicit Dependency</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 border-b-2 border-dashed border-slate-400" />
          <span className="text-slate-400">Dashed = Inferred Dependency</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-semibold">Red = Bottleneck / Overloaded</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-[#090d16]"
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls className="!bg-[#0f172a] !border-slate-800 !fill-slate-300 !text-slate-300" />
      </ReactFlow>
    </div>
  );
};
