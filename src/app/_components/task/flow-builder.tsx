"use client";

import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo } from 'react';
// import './style.css';
import TaskNode from './task-node';

const initialNodes = [
    // { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    // { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    {
        id: 'node-1',
        type: 'taskNode',
        position: { x: 10, y: 10 },
        data: {
            id: "node-1",
            inputs: [
                {
                    type: "flow"
                },
                {
                    type: "image",
                    label: "Image"
                }
            ],
            outputs: [
                {
                    type: "flow",
                    label: "Single"
                },
                {
                    type: "flow",
                    label: "Multiple"
                },
                {
                    type: "flow",
                    label: "I don't know"
                },
                {
                    type: "flow",
                    label: "Doesn't contains"
                }
            ]
        },
    },
    {
        id: 'node-2',
        type: 'taskNode',
        position: { x: 300, y: 10 },
        data: {
            id: "node-2",
            inputs: [
                {
                    type: "flow"
                },
                {
                    type: "image",
                    label: "Image"
                }
            ],
            outputs: [
                {
                    type: "flow",
                    label: "Microparticule"
                },
                {
                    type: "flow",
                    label: "Simple plate"
                },
                {
                    type: "flow",
                    label: "Fan-like plate"
                },
                {
                    type: "flow",
                    label: "Dentrite plate"
                },
                {
                    type: "flow",
                    label: "Fern-like dentrite plate"
                },
                {
                    type: "flow",
                    label: "Column/Square"
                },
                {
                    type: "flow",
                    label: "Singular Irregular"
                },
                {
                    type: "flow",
                    label: "Cloud-particle"
                },
                {
                    type: "flow",
                    label: "I don't know"
                },
                {
                    type: "flow",
                    label: "Doesn't contains"
                }
            ]
        },
    },
    {
        id: 'node-3',
        type: 'taskNode',
        position: { x: 300, y: 380 },
        data: {
            id: "node-3",
            inputs: [
                {
                    type: "flow"
                },
                {
                    type: "image",
                    label: "Image"
                }
            ],
            outputs: [
                {
                    type: "flow",
                    label: "Combinations"
                },
                {
                    type: "flow",
                    label: "Double plate"
                },
                {
                    type: "flow",
                    label: "Multiple Columns/Squares"
                },
                {
                    type: "flow",
                    label: "Multiple Irregulars"
                },
                {
                    type: "flow",
                    label: "I don't know"
                },
                {
                    type: "flow",
                    label: "Doesn't contains"
                }
            ]
        },
    },
];
// const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const initialEdges = [
    { id: 'e1', source: 'node-1', sourceHandle: 'node-1-output-0', target: 'node-2', targetHandle: "node-2-input-0" },
    { id: 'e2', source: 'node-1', sourceHandle: 'node-1-output-1', target: 'node-3', targetHandle: "node-3-input-0" }
];


const proOptions = { hideAttribution: true };

// const nodeTypes = { taskNode: TaskNode };



export default function FlowBuilder() {
    const nodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );


    return (
        <div style={{ width: '100%', height: '100%', minHeight: '450px' }} className='rounded-md border border-input'>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                proOptions={proOptions}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
    )
}