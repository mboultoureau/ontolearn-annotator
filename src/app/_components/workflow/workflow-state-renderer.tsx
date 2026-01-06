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

interface WorkflowStateRendererProps {
  state: any; // Current XState state
  machine: any; // XState machine definition
  onEvent: (eventType: string, data?: any) => void;
}

export function WorkflowStateRenderer({ state, machine, onEvent }: WorkflowStateRendererProps) {
  if (!state || !machine) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  // Helper function to find metadata in nested states
  const findMetadataForState = (stateValue: any, config: any): any => {
    // Handle string state (simple state)
    if (typeof stateValue === 'string') {
      return config.states?.[stateValue]?.meta;
    }

    // Handle object state (compound/nested state like { subsection_loop: "select_subsection_area" })
    if (typeof stateValue === 'object' && stateValue !== null) {
      const parentKey = Object.keys(stateValue)[0];
      const childValue = stateValue[parentKey];

      // Get parent state config
      const parentState = config.states?.[parentKey];
      
      if (parentState) {
        // Recursively search in nested states
        if (typeof childValue === 'string') {
          return parentState.states?.[childValue]?.meta;
        } else if (typeof childValue === 'object') {
          // Further nested states
          return findMetadataForState(childValue, parentState);
        }
      }
    }

    return null;
  };

  // Get current state value and metadata
  const stateValue = state.value;
  const stateMeta = findMetadataForState(stateValue, machine.config);
  
  console.log('🎨 [WorkflowStateRenderer]');
  console.log('  State value:', stateValue);
  console.log('  Machine config states:', Object.keys(machine.config?.states || {}));
  console.log('  State meta:', stateMeta);
  
  if (!stateMeta) {
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

  // Render based on state type
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

// Yes/No Renderer
function YesNoRenderer({ meta, onEvent }: { meta: any; onEvent: (eventType: string, data?: any) => void }) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleSubmit = () => {
    if (selectedValue === 'yes') {
      onEvent('YES', true);
    } else if (selectedValue === 'no') {
      onEvent('NO', false);
    }
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

// Area Select Renderer
function AreaSelectRenderer({ meta, context, onEvent }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void }) {
  const handleAreaSelected = (coordinates: any) => {
    console.log('Area selected:', coordinates);
    
    // Store the area and transition
    if (meta.storeAs) {
      // Create nested object structure based on storeAs path
      const path = meta.storeAs.split('.');
      const data: any = {};
      let current = data;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = coordinates;
      
      onEvent('AREA_SELECTED', data);
    } else {
      onEvent('AREA_SELECTED', { area: coordinates });
    }
  };

  // Resolve imageSource if it references dataSources
  let imageUrl = meta.imageSource;
  if (imageUrl && imageUrl.includes('dataSources')) {
    // Try to resolve from context
    try {
      // Extract path like "dataSources.images[0].url"
      const match = imageUrl.match(/\$\{(.+)\}/);
      if (match) {
        const path = match[1];
        // Simple eval for POC - in production use proper path resolver
        const resolved = eval(`context.${path}`);
        imageUrl = resolved;
      }
    } catch (e) {
      console.error('Failed to resolve imageSource:', e);
    }
  }

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

// Choice Renderer (Dropdown)
function ChoiceRenderer({ meta, context, onEvent }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void }) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Resolve options from dataSources if needed
  let options = meta.options?.values || [];
  
  if (meta.options?.source && context.dataSources) {
    const sourceName = meta.options.source;
    const sourceData = context.dataSources[sourceName];
    
    if (sourceData?.type === 'static' && Array.isArray(sourceData.data)) {
      // Convert array of strings to options format
      options = sourceData.data.map((item: any) => {
        if (typeof item === 'string') {
          return { value: item, label: item };
        }
        return item;
      });
    }
  }
  
  console.log('💡 [ChoiceRenderer] Options:', options);

  const handleSubmit = () => {
    if (selectedValue && meta.storeAs) {
      // Create nested object structure
      const path = meta.storeAs.split('.');
      const data: any = {};
      let current = data;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = selectedValue;
      
      onEvent('NEXT', data);
    } else {
      onEvent('NEXT', { value: selectedValue });
    }
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

// Multi-Choice Renderer (Placeholder)
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
          🚧 Multi-choice component coming soon
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

// Final State Renderer
function FinalRenderer({ meta, onEvent }: { meta: any; onEvent: (eventType: string, data?: any) => void }) {
  const handleSave = () => {
    // Emit a custom SAVE event or just notify parent
    console.log('Workflow completed - ready to save');
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
