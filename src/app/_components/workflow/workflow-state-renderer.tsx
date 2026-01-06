'use client';

import { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/_components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { ImageSegmentation } from '@/app/_components/data/image-segmentation';

/**
 * Utility: Creates a nested object structure from a dot-notation path
 * Example: createNestedObject("crystal.area", coordinates) => { crystal: { area: coordinates } }
 */
function createNestedObject(path: string, value: any): any {
  const segments = path.split('.');
  const result: any = {};
  let current = result;
  
  for (let i = 0; i < segments.length - 1; i++) {
    current[segments[i]] = {};
    current = current[segments[i]];
  }
  
  current[segments[segments.length - 1]] = value;
  return result;
}

/**
 * Utility: Resolves template strings like "${dataSources.images[0].url}" from context
 */
function resolveTemplateString(template: string, context: any): string {
  if (!template || !template.includes('dataSources')) {
    return template;
  }

  try {
    const match = template.match(/\$\{(.+)\}/);
    if (match) {
      const path = match[1];
      // Simple path resolution - in production, use a proper path resolver
      return eval(`context.${path}`);
    }
  } catch (error) {
    console.error('[resolveTemplateString] Failed to resolve:', template, error);
  }
  
  return template;
}

/**
 * Utility: Recursively searches for metadata in nested state configurations
 */
function findMetadataForState(stateValue: any, config: any): any {
  // Handle simple state (string)
  if (typeof stateValue === 'string') {
    return config.states?.[stateValue]?.meta;
  }

  // Handle compound state (nested object)
  if (typeof stateValue === 'object' && stateValue !== null) {
    const parentKey = Object.keys(stateValue)[0];
    const childValue = stateValue[parentKey];
    const parentState = config.states?.[parentKey];
    
    if (parentState) {
      if (typeof childValue === 'string') {
        return parentState.states?.[childValue]?.meta;
      } else if (typeof childValue === 'object') {
        // Recursively search deeper nested states
        return findMetadataForState(childValue, parentState);
      }
    }
  }

  return null;
}

interface WorkflowStateRendererProps {
  state: any; // Current XState state
  machine: any; // XState machine definition
  onEvent: (eventType: string, data?: any) => void;
}

export function WorkflowStateRenderer({ state, machine, onEvent }: WorkflowStateRendererProps) {
  if (!state || !machine) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  const stateValue = state.value;
  const stateMeta = findMetadataForState(stateValue, machine.config);
  
  if (!stateMeta) {
    console.warn('[WorkflowStateRenderer] No metadata found for state:', stateValue);
    
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <p className="text-gray-700">No metadata found for state: <code className="font-mono">{JSON.stringify(stateValue)}</code></p>
        <Button onClick={() => onEvent('NEXT')} className="mt-4">
          Next (Default)
        </Button>
      </div>
    );
  }

  const stateType = stateMeta.type;

  // Render component based on state type
  switch (stateType) {
    case 'yes_no':
    case 'loop_check':
      return <YesNoRenderer meta={stateMeta} onEvent={onEvent} />;
    
    case 'area_select':
      return <AreaSelectRenderer meta={stateMeta} context={state.context} onEvent={onEvent} />;
    
    case 'choice':
      return <ChoiceRenderer meta={stateMeta} context={state.context} onEvent={onEvent} />;
    
    case 'multi_choice':
      return <MultiChoiceRenderer meta={stateMeta} context={state.context} onEvent={onEvent} />;
    
    case 'final':
      return <FinalRenderer meta={stateMeta} onEvent={onEvent} />;
    
    default:
      console.warn('[WorkflowStateRenderer] Unsupported state type:', stateType);
      
      return (
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">Unsupported state type: {stateType}</p>
          <Button onClick={() => onEvent('NEXT')} className="mt-4">
            Next
          </Button>
        </div>
      );
  }
}

/**
 * Renderer for Yes/No and Loop Check states
 * Displays a question with two radio button options
 */
function YesNoRenderer({ meta, onEvent }: { meta: any; onEvent: (eventType: string, data?: any) => void }) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleSubmit = () => {
    const eventType = selectedValue === 'yes' ? 'YES' : 'NO';
    const eventData = selectedValue === 'yes';
    onEvent(eventType, eventData);
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold">{meta.name || meta.question}</h2>
        {meta.description && (
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
        )}
      </div>

      <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id="yes" />
          <Label htmlFor="yes" className="cursor-pointer">
            {meta.yesLabel || 'Yes'}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="cursor-pointer">
            {meta.noLabel || 'No'}
          </Label>
        </div>
      </RadioGroup>

      <Button 
        onClick={handleSubmit} 
        disabled={!selectedValue}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

/**
 * Renderer for Area Selection states
 * Displays an image with annotation tools (polygon/rectangle)
 */
function AreaSelectRenderer({ meta, context, onEvent }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void }) {
  const handleAreaSelected = (coordinates: any) => {
    const data = meta.storeAs 
      ? createNestedObject(meta.storeAs, coordinates)
      : { area: coordinates };
    
    onEvent('AREA_SELECTED', data);
  };

  const imageUrl = resolveTemplateString(meta.imageSource, context);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{meta.name}</h2>
        {meta.description && (
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
        )}
        {meta.instructions && (
          <p className="text-sm text-blue-600 mt-2">{meta.instructions}</p>
        )}
      </div>

      <ImageSegmentation
        imageUrl={imageUrl}
        toolType={meta.toolType || 'polygon'}
        allowMultiple={meta.allowMultiple || false}
        onAreaSelected={handleAreaSelected}
      />
    </div>
  );
}

/**
 * Renderer for Single Choice states
 * Displays a dropdown with options from static data or data sources
 */
function ChoiceRenderer({ meta, context, onEvent }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void }) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Resolve options from dataSources or use static values
  let options = meta.options?.values || [];
  
  if (meta.options?.source && context.dataSources) {
    const sourceData = context.dataSources[meta.options.source];
    
    if (sourceData?.type === 'static' && Array.isArray(sourceData.data)) {
      options = sourceData.data.map((item: any) => 
        typeof item === 'string' 
          ? { value: item, label: item }
          : item
      );
    }
  }

  const handleSubmit = () => {
    const data = meta.storeAs
      ? createNestedObject(meta.storeAs, selectedValue)
      : { value: selectedValue };
    
    onEvent('NEXT', data);
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold">{meta.name}</h2>
        {meta.prompt && (
          <p className="text-sm text-gray-600 mt-1">{meta.prompt}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Select an option</Label>
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!selectedValue}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

/**
 * Renderer for Multi-Choice states (placeholder implementation)
 * TODO: Implement multi-select component with checkboxes
 */
function MultiChoiceRenderer({ meta, context, onEvent }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void }) {
  return (
    <div className="p-6 border rounded-lg space-y-4 bg-gray-50">
      <div>
        <h2 className="text-xl font-bold">{meta.name}</h2>
        {meta.prompt && (
          <p className="text-sm text-gray-600 mt-1">{meta.prompt}</p>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          Multi-choice component coming soon
        </p>
      </div>

      <Button 
        onClick={() => onEvent('NEXT', { values: [] })}
        variant="outline"
        className="w-full"
      >
        Skip (Placeholder)
      </Button>
    </div>
  );
}

/**
 * Renderer for Final states
 * Displays completion message with save button
 */
function FinalRenderer({ meta, onEvent }: { meta: any; onEvent: (eventType: string, data?: any) => void }) {
  const handleSave = () => {
    onEvent('SAVE');
  };

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-green-50 border-green-200">
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800">Workflow Complete</h2>
        {meta.message && (
          <p className="text-gray-600 mt-2">{meta.message}</p>
        )}
      </div>

      <Button 
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Save Annotations
      </Button>
    </div>
  );
}
