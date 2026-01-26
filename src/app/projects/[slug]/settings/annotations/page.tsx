"use client";

import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";
import { useState, useEffect } from "react";

export default function AnnotationsSettingsPage({ params }: { params: { slug: string } }) {
  const [workflowYaml, setWorkflowYaml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<
    | { valid: true; metadata?: { workflowId: string; version: string; stateCount: number; transitionCount: number } }
    | { valid: false; errors?: Array<{ path: string; message: string; code?: string }> }
    | null
  >(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/projects/${params.slug}/config/annotation_workflow`);
        if (res.ok) {
          const data = await res.json();
          if (data.workflow) {
            setWorkflowYaml(data.workflow);
          }
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [params.slug]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    // Validate before saving
    await handleValidate();
    if (validationResult && !validationResult.valid) {
      setMessage({ type: "error", text: "Cannot save: Workflow YAML is invalid." });
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${params.slug}/config/annotation_workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: workflowYaml }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setMessage({ type: "success", text: "Workflow configuration saved successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save workflow configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(`/api/projects/${params.slug}/config/annotation_workflow/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: workflowYaml }),
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (error) {
      setValidationResult({ valid: false, errors: [{ path: "root", message: "Validation request failed", code: "network_error" }] });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Annotation Workflow Settings</h1>
        <p className="text-gray-600">Define the workflow YAML for manual annotations</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="workflow">Workflow YAML</Label>
        <textarea
          id="workflow"
          className="w-full h-96 p-3 border rounded font-mono text-sm"
          value={workflowYaml}
          onChange={(e) => setWorkflowYaml(e.target.value)}
          placeholder="Enter workflow YAML definition..."
        />
        <p className="text-xs text-gray-500">
          Use <code className="bg-gray-100 px-1 rounded">{"${imageUrl}"}</code> as placeholder for the dynamic image URL
        </p>
      </div>

      {validationResult && (
        <div
          className={`p-4 rounded border ${
            validationResult.valid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {validationResult.valid ? (
            <div className="space-y-1">
              <div className="font-semibold">DSL is valid.</div>
              {validationResult.metadata && (
                <div className="text-sm text-gray-700">
                  States: {validationResult.metadata.stateCount}, transitions: {validationResult.metadata.transitionCount},
                  workflow: {validationResult.metadata.workflowId} v{validationResult.metadata.version}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-semibold">DSL validation failed.</div>
              {validationResult.errors?.length ? (
                <ul className="list-disc list-inside text-sm text-gray-800">
                  {validationResult.errors.map((err, idx) => (
                    <li key={`${err.path}-${idx}`}>
                      <span className="font-mono">{err.path}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm">Unknown validation error.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleValidate} disabled={validating}>
          {validating ? "Validating..." : "Validate DSL"}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      <details className="mt-6 p-4 bg-gray-50 border rounded">
        <summary className="font-semibold cursor-pointer text-gray-900">Workflow DSL Documentation</summary>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            Define annotation workflows using our custom YAML-based DSL. The workflow consists of states and transitions that guide the annotation process.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <strong>States:</strong> Define different annotation tasks, such as labeling, reviewing, or approving annotations.
            </li>
            <li>
              <strong>Transitions:</strong> Specify how to move between states based on conditions or user actions.
            </li>
            <li>
              <strong>Placeholders:</strong> Use <code className="bg-gray-100 px-1 rounded">{"${imageUrl}"}</code> to dynamically insert the image URL into annotation tasks.
            </li>
          </ul>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto display-[initial]">
metadata:
  id: default_workflow
  version: 1.0.0
  name: default workflow
  description: This is a template for a workflow
  author: NII Research Team

dataSources:
  data: 
    type: static
    data: test

workflow:
  entry: default_node

  states:
    # 1. Default start node
    - id: default_node
      type: yes_no
      name: Want to end the workflow?
      question: Want to end the workflow?
      yesTarget: final
      noTarget: default_node

    # 7. End
    - id: final
      type: final
      message: Workflow finished
</pre>
        </div>
      </details>
    </div>
  );
}
