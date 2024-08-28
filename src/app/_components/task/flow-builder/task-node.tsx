import { Handle, Position, useEdges } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

const handleStyle = { top: 10 };
const handleStyle2 = { top: 10 };

enum Type {
  Flow = "flow",
  Image = "image",
}

interface Input {
  type: Type;
  label?: string;
}

interface Output {
  type: Type;
  label: string;
}

interface TaskProps {
  name: string;
  title: string;
  inputs: Input[];
  outputs: Output[];
  hidden?: boolean;
}

interface TaskNodeProps {
  id: string;
  type: string;
  data: TaskProps;
}

export default function TaskNode({ id, type, data }: TaskNodeProps) {
  //   const t = useTranslations(`Task.${name}`);
  const edges = useEdges();

  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="task-node bg-card rounded-sm">
      <div className="bg-muted p-2 rounded-t-sm">
        <p className="text-sm">{data.title}</p>
      </div>
      <div className="flex">
        <div>
          {data.inputs.map((input: any, index: any) => {
            return (
              <div className="h-[32px] flex items-center px-1" key={index}>
                {input.type === "flow" && (
                  <svg
                    viewBox="0 0 500 500"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon
                      stroke="currentColor"
                      strokeWidth="20px"
                      fill={
                        edges.find(
                          (edge) =>
                            edge.target === id &&
                            edge.targetHandle === `${id}-input-${index}`
                        )
                          ? "currentColor"
                          : "none"
                      }
                      points="82.459 415.845 333.16 416.455 416.45 249.873 333.16 83.291 83.29 83.291"
                      transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)"
                    />
                  </svg>
                )}
                {input.type === "image" && (
                  <svg
                    viewBox="0 0 500 500"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <ellipse
                      stroke="#e879f9"
                      strokeWidth="60px"
                      // fill="white"
                      cx="249.87"
                      cy="249.871"
                      rx="166.58"
                      ry="166.58"
                      transform="matrix(1, 0, 0, 1, 0, 7.105427357601002e-15)"
                      fill={
                        edges.find(
                          (edge) =>
                            edge.target === id &&
                            edge.targetHandle === `${id}-input-${index}`
                        )
                          ? "#e879f9"
                          : "none"
                      }
                    />
                  </svg>
                )}
                <Handle
                  type="target"
                  position={Position.Left}
                  // isConnectable={true}
                  id={`${id}-input-${index}`}
                  style={{
                    top: 53 + index * 32,
                    left: 10,
                    width: 14,
                    height: 14,
                    opacity: 0,
                  }}
                />
                <p className="text-sm px-1">{input.label}</p>
              </div>
            );
          })}
        </div>
        <div>
          {data.outputs.map((output: any, index: any) => {
            return (
              <div
                className="h-[32px] flex items-center justify-end px-1"
                key={index}
              >
                <Handle
                  id={`${id}-output-${index}`}
                  position={Position.Right}
                  type="source"
                  // isConnectable={isConnectable}
                  style={{
                    top: 53 + index * 32,
                    right: 12,
                    width: 14,
                    height: 14,
                    opacity: 0,
                  }}
                />
                <p className="text-sm px-1">{output.label}</p>
                {output.type === "image" && (
                  <svg
                    viewBox="0 0 500 500"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <ellipse
                      stroke="#e879f9"
                      strokeWidth="60px"
                      // fill="white"
                      cx="249.87"
                      cy="249.871"
                      rx="166.58"
                      ry="166.58"
                      transform="matrix(1, 0, 0, 1, 0, 7.105427357601002e-15)"
                      fill={
                        edges.find(
                          (edge) =>
                            edge.source === id &&
                            edge.sourceHandle === `${id}-output-${index}`
                        )
                          ? "#e879f9"
                          : "none"
                      }
                    />
                  </svg>
                )}
                {output.type === "number" && (
                  <svg
                    viewBox="0 0 500 500"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <ellipse
                      stroke="#3498db"
                      strokeWidth="60px"
                      // fill="white"
                      cx="249.87"
                      cy="249.871"
                      rx="166.58"
                      ry="166.58"
                      transform="matrix(1, 0, 0, 1, 0, 7.105427357601002e-15)"
                      fill={
                        edges.find(
                          (edge) =>
                            edge.source === id &&
                            edge.sourceHandle === `${id}-output-${index}`
                        )
                          ? "#3498db"
                          : "none"
                      }
                    />
                  </svg>
                )}
                {output.type === "flow" && (
                  <svg
                    viewBox="0 0 500 500"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon
                      stroke="currentColor"
                      strokeWidth="20px"
                      fill={
                        edges.find(
                          (edge) =>
                            edge.source === id &&
                            edge.sourceHandle === `${id}-output-${index}`
                        )
                          ? "currentColor"
                          : "none"
                      }
                      points="82.459 415.845 333.16 416.455 416.45 249.873 333.16 83.291 83.29 83.291"
                      transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
