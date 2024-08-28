"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  ColorMode,
  Controls,
  MiniMap,
  OnConnect,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef, useState } from "react";
// import './style.css';
import TaskNode from "./task-node";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "../../ui/button";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { v4 as uuidv4 } from "uuid";

const initialNodes = [
  // { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  // { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
  {
    id: "node-0",
    type: "taskNode",
    position: { x: -300, y: 10 },
    data: {
      title: "Input",
      inputs: [],
      outputs: [
        {
          type: "flow",
          label: "Start"
        },
        {
          type: "image",
          label: "Image",
        },
      ],
    },
  },
  {
    id: "node-1",
    type: "taskNode",
    position: { x: 10, y: 10 },
    data: {
      title: "Single or Multiple",
      inputs: [
        {
          type: "flow",
        },
        {
          type: "image",
          label: "Image",
        },
      ],
      outputs: [
        {
          type: "flow",
          label: "Single",
        },
        {
          type: "flow",
          label: "Multiple",
        },
        {
          type: "flow",
          label: "I don't know",
        },
        {
          type: "flow",
          label: "Doesn't contains",
        },
      ],
    },
  },
  {
    id: "node-2",
    type: "taskNode",
    position: { x: 300, y: 10 },
    data: {
      title: "Single",
      inputs: [
        {
          type: "flow",
        },
        {
          type: "image",
          label: "Image",
        },
      ],
      outputs: [
        {
          type: "flow",
          label: "Microparticule",
        },
        {
          type: "flow",
          label: "Simple plate",
        },
        {
          type: "flow",
          label: "Fan-like plate",
        },
        {
          type: "flow",
          label: "Dentrite plate",
        },
        {
          type: "flow",
          label: "Fern-like dentrite plate",
        },
        {
          type: "flow",
          label: "Column/Square",
        },
        {
          type: "flow",
          label: "Singular Irregular",
        },
        {
          type: "flow",
          label: "Cloud-particle",
        },
        {
          type: "flow",
          label: "I don't know",
        },
        {
          type: "flow",
          label: "Doesn't contains",
        },
      ],
    },
  },
  {
    id: "node-3",
    type: "taskNode",
    position: { x: 300, y: 380 },
    data: {
      title: "Multiple",
      inputs: [
        {
          type: "flow",
        },
        {
          type: "image",
          label: "Image",
        },
      ],
      outputs: [
        {
          type: "flow",
          label: "Combinations",
        },
        {
          type: "flow",
          label: "Double plate",
        },
        {
          type: "flow",
          label: "Multiple Columns/Squares",
        },
        {
          type: "flow",
          label: "Multiple Irregulars",
        },
        {
          type: "flow",
          label: "I don't know",
        },
        {
          type: "flow",
          label: "Doesn't contains",
        },
      ],
    },
  },
  {
    id: "node-4",
    type: "taskNode",
    position: { x: 600, y: 10 },
    data: {
      title: "Quality",
      inputs: [
        {
          type: "flow",
        },
        {
          type: "image",
          label: "Image",
        },
      ],
      outputs: [
        {
          type: "flow",
        },
        {
          type: "number",
          label: "Quality",
        },
      ],
    },
  },
  {
    id: "node-5",
    type: "taskNode",
    position: { x: 900, y: 10 },
    data: {
      title: "Confidence",
      inputs: [
        {
          type: "flow",
        },
      ],
      outputs: [
        {
          type: "flow",
        },
        {
          type: "number",
          label: "Confidence",
        },
      ],
    },
  },
  {
    id: "node-6",
    type: "taskNode",
    position: { x: -300, y: 10 },
    data: {
      title: "Set variable image",
      inputs: [
        {
          type: "flow",
        },
        {
          type: "image",
          label: "Image",
        },
      ],
      outputs: [
        {
          type: "flow",
        },
      ],
    },
  },
  {
    id: "node-7",
    type: "taskNode",
    position: { x: -300, y: 10 },
    data: {
      title: "image",
      inputs: [],
      outputs: [
        {
          type: "image",
          label: "Image",
        },
      ],
    },
  },
  {
    id: "node-8",
    type: "taskNode",
    position: { x: -300, y: 10 },
    data: {
      title: "image",
      inputs: [],
      outputs: [
        {
          type: "image",
          label: "Image",
        },
      ],
    },
  },
];
// const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const initialEdges = [
  {
    id: "e1",
    source: "node-1",
    sourceHandle: "node-1-output-0",
    target: "node-2",
    targetHandle: "node-2-input-0",
  },
  {
    id: "e2",
    source: "node-1",
    sourceHandle: "node-1-output-1",
    target: "node-3",
    targetHandle: "node-3-input-0",
  },
];

const proOptions = { hideAttribution: true };

// const nodeTypes = { taskNode: TaskNode };

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

export function Flow() {
  const { theme } = useTheme();

  const nodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [open, setOpen] = useState(false);
  const { screenToFlowPosition, zoomIn } = useReactFlow();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const store = useStoreApi();


  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const createNode = (type: string) => {
    const newNode = {
      id: uuidv4(),
      type: "taskNode",
      position: screenToFlowPosition({
        x: coords.x,
        y: coords.y,
      }),
      data: {
        title: "New Node",
        inputs: [],
        outputs: [],
      },
    };

    setNodes((nodes) => nodes.concat(newNode));
  };

  return (
      <Popover open={open}>
        <PopoverAnchor asChild>
          <div
            className="absolute"
            style={{ left: coords.x, top: coords.y }}
          ></div>
        </PopoverAnchor>
        <div
          ref={ref}
          style={{ width: "100%", height: "100%", minHeight: "450px" }}
          className="rounded-md border border-input"
          onContextMenu={(e) => {
            e.preventDefault();
            setCoords({ x: e.clientX, y: e.clientY });
            setOpen(true);
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            proOptions={proOptions}
            nodeTypes={nodeTypes}
            fitView
            colorMode={
              theme && ["light", "dark", "system"].includes(theme)
                ? (theme as ColorMode)
                : "system"
            }
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Search framework..." autoFocus />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setOpen(false);
                      createNode(currentValue);
                    }}
                  >
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
