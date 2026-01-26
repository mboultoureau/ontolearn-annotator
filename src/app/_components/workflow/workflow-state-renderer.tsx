'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/_components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';

// Annotorious/OpenSeadragon rely on browser globals; load client-side only
const ImageSegmentation = dynamic(
  () => import('@/app/_components/data/image-segmentation').then((m) => m.ImageSegmentation),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 border rounded bg-gray-50 text-sm text-gray-600">Loading image…</div>
    ),
  }
);

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
 * Utility: Resolve a dotted/bracket path (e.g., "dataSources.images.data[0].url") from an object
 */
function resolvePath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  // Tokenize: words between dots or indexes in brackets
  const tokens: Array<string | number> = [];
  const regex = /([^.[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) tokens.push(match[1]);
    else if (match[2] !== undefined) tokens.push(Number(match[2]));
  }

  let current: any = obj;
  for (const token of tokens) {
    if (current == null) return undefined;
    current = current[token as any];
  }
  return current;
}

/**
 * Utility: Resolves imageSource from context for both "${...}" and plain paths
 */
function resolveTemplateString(template: string, context: any): string {
  if (typeof template !== 'string' || template.length === 0) return template as any;

  try {
    // Case 1: Template form ${...}
    const m = template.match(/\$\{(.+)\}/);
    if (m) {
      let path = m[1].trim();
      // Allow starting with "context." or not
      if (path.startsWith('context.')) path = path.slice('context.'.length);
      const value = resolvePath(context, path);
      return typeof value === 'string' ? value : template;
    }

    // Case 2: Plain path like "dataSources.images.data[0].url" or "context.dataSources..."
    if (template.startsWith('context.')) {
      const value = resolvePath({ context }, template); // resolve against { context }
      return typeof value === 'string' ? value : template;
    }
    if (template.startsWith('dataSources.') || template.startsWith('metadata.') || template.startsWith('data.')) {
      const value = resolvePath(context, template);
      return typeof value === 'string' ? value : template;
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
  projectId: string;
  dataFileId: string;
  userId: string;
}

export function WorkflowStateRenderer({ state, machine, onEvent, projectId, dataFileId, userId }: WorkflowStateRendererProps) {
  const t = useTranslations("Workflow");
  
  if (!state || !machine) {
    return <div className="p-4 text-gray-500">{t("loading")}</div>;
  }

  const stateValue = state.value;
  const stateMeta = findMetadataForState(stateValue, machine.config);
  
  if (!stateMeta) {
    console.warn('[WorkflowStateRenderer] No metadata found for state:', stateValue);
    
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <p className="text-gray-700">{t("errors.noMetadata")} <code className="font-mono">{JSON.stringify(stateValue)}</code></p>
        <Button onClick={() => onEvent('NEXT')} className="mt-4">
          {t("actions.nextDefault")}
        </Button>
      </div>
    );
  }

  const stateType = stateMeta.type;

  // Render component based on state type
  switch (stateType) {
    case 'task':
      return <TaskRenderer meta={stateMeta} onEvent={onEvent} t={t} />;
    
    case 'branch':
      // Branch states auto-transition based on guards
      // Trigger NEXT event immediately to evaluate guards
      return <BranchRenderer meta={stateMeta} onEvent={onEvent} t={t} />;
    
    case 'yes_no':
    case 'loop_check':
      return <YesNoRenderer meta={stateMeta} onEvent={onEvent} t={t} />;
    
    case 'area_select':
      return <AreaSelectRenderer meta={stateMeta} context={state.context} onEvent={onEvent} />;
    
    case 'choice':
      return <ChoiceRenderer meta={stateMeta} context={state.context} onEvent={onEvent} t={t} />;
    
    case 'multi_choice':
      return <MultiChoiceRenderer meta={stateMeta} context={state.context} onEvent={onEvent} t={t} />;
    
    case 'final':
      return <FinalRenderer meta={stateMeta} onEvent={onEvent} t={t} />;
    
    default:
      console.warn('[WorkflowStateRenderer] Unsupported state type:', stateType);
      
      return (
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-600">{t("errors.unsupportedType")} {stateType}</p>
          <Button onClick={() => onEvent('NEXT')} className="mt-4">
            {t("actions.next")}
          </Button>
        </div>
      );
  }
}

/**
 * Renderer for Branch states
 * Branch states automatically route based on guard conditions
 * This component triggers the NEXT event immediately to evaluate guards
 */
function BranchRenderer({ meta, onEvent, t }: { meta: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
  useEffect(() => {
    // Auto-trigger transition after a brief delay to show the routing message
    const timer = setTimeout(() => {
      onEvent('NEXT');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [onEvent]);

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-blue-50 border-blue-200">
      <div className="text-center">
        <div className="text-4xl mb-4">🔀</div>
        <h2 className="text-xl font-bold">{meta.name || t("branch.routing")}</h2>
        {meta.description && (
          <p className="text-sm text-gray-600 mt-2">{meta.description}</p>
        )}
        <p className="text-sm text-blue-600 mt-2">{t("branch.evaluating")}</p>
      </div>
    </div>
  );
}

/**
 * Renderer for Task states
 * Displays a form with multiple fields for data collection
 */
function TaskRenderer({ meta, onEvent, t }: { meta: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    // Send the form data
    onEvent('NEXT', formData);
  };

  // Check if all required fields are filled
  const isValid = meta.fields?.every((field: any) => {
    if (field.required) {
      const value = formData[field.id];
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  }) ?? false;

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold">{meta.name}</h2>
        {meta.description && (
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
        )}
        {meta.instructions && (
          <p className="text-sm text-blue-600 mt-2">{meta.instructions}</p>
        )}
      </div>

      <div className="space-y-4">
        {meta.fields?.map((field: any) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {(field.type === 'text' || field.type === 'email') && (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.valueAsNumber)}
                required={field.required}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                required={field.required}
                rows={4}
              />
            )}
          </div>
        ))}
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!isValid}
        className="w-full"
      >
        {t("actions.continue")}
      </Button>
    </div>
  );
}

/**
 * Renderer for Yes/No and Loop Check states
 * Displays a question with two radio button options
 */
function YesNoRenderer({ meta, onEvent, t }: { meta: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
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
            {meta.yesLabel || t("actions.yes")}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="cursor-pointer">
            {meta.noLabel || t("actions.no")}
          </Label>
        </div>
      </RadioGroup>

      <Button 
        onClick={handleSubmit} 
        disabled={!selectedValue}
        className="w-full"
      >
        {t("actions.continue")}
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
    // Send ONLY the raw coordinates - the compiler will handle nesting via storeAs
    onEvent('AREA_SELECTED', coordinates);
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
function ChoiceRenderer({ meta, context, onEvent, t }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Resolve options from dataSources or use static values
  let options = meta.options?.values || [];
  
  if (meta.options?.source && context.dataSources) {
    const sourceData = context.dataSources[meta.options.source];
    
    if (sourceData?.type === 'static' && Array.isArray(sourceData.data)) {
      options = sourceData.data.map((item: any) => {
        if (typeof item === 'string') {
          return { value: item, label: item };
        }
        // Handle both {value, label} and {id, label} formats
        return {
          value: item.value || item.id,
          label: item.label || item.value || item.id
        };
      });
    } else if (sourceData?.type === 'fetch') {
      // Fetch type should have been loaded already, but if not, show warning
      console.warn(`Data source '${meta.options.source}' is of type 'fetch' but data was not pre-loaded`);
      options = [];
    }
  }

  const handleSubmit = () => {
    // Send ONLY the raw value - the compiler will handle nesting via storeAs
    onEvent('NEXT', selectedValue);
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
        <Label>{t("choice.selectLabel")}</Label>
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.chooseOption")} />
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
        {t("actions.continue")}
      </Button>
    </div>
  );
}

/**
 * Renderer for Multi-Choice states with ranked selection
 * Allows selecting multiple options and ordering them by rank (1 to n)
 */
function MultiChoiceRenderer({ meta, context, onEvent, t }: { meta: any; context: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
  const [selectedOptions, setSelectedOptions] = useState<Array<{ value: string; label: string; rank: number }>>([]);
  const [availableValue, setAvailableValue] = useState<string>('');

  // Resolve options from dataSources or use static values
  let allOptions = meta.options?.values || [];
  
  if (meta.options?.source && context.dataSources) {
    const sourceData = context.dataSources[meta.options.source];
    
    if (sourceData?.type === 'static' && Array.isArray(sourceData.data)) {
      allOptions = sourceData.data.map((item: any) => {
        if (typeof item === 'string') {
          return { value: item, label: item };
        }
        // Handle both {value, label} and {id, label} formats
        return {
          value: item.value || item.id,
          label: item.label || item.value || item.id
        };
      });
    } else if (sourceData?.type === 'fetch') {
      // Fetch type should have been loaded already, but if not, show warning
      console.warn(`Data source '${meta.options.source}' is of type 'fetch' but data was not pre-loaded`);
      allOptions = [];
    }
  }

  // Filter out already selected options
  const availableOptions = allOptions.filter(
    (option: any) => !selectedOptions.find(s => s.value === option.value)
  );

  const handleAdd = () => {
    if (!availableValue) return;
    
    const option = allOptions.find((opt: any) => opt.value === availableValue);
    if (!option) return;

    const newRank = selectedOptions.length + 1;
    setSelectedOptions([...selectedOptions, { 
      value: option.value, 
      label: option.label, 
      rank: newRank 
    }]);
    setAvailableValue('');
  };

  const handleRemove = (valueToRemove: string) => {
    const updatedOptions = selectedOptions
      .filter(opt => opt.value !== valueToRemove)
      .map((opt, index) => ({ ...opt, rank: index + 1 })); // Recompute ranks
    
    setSelectedOptions(updatedOptions);
  };

  const handleSubmit = () => {
    const rankedValues = selectedOptions.map(opt => opt.value);
    
    // Send ONLY the raw ranked values - the compiler will handle nesting via storeAs
    onEvent('NEXT', rankedValues);
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold">{meta.name}</h2>
        {meta.prompt && (
          <p className="text-sm text-gray-600 mt-1">{meta.prompt}</p>
        )}
        <p className="text-sm text-blue-600 mt-2">
          {t("multiChoice.instructions")}
        </p>
      </div>

      {/* Add new option */}
      <div className="space-y-2">
        <Label>{t("multiChoice.addLabel")}</Label>
        <div className="flex gap-2">
          <Select 
            value={availableValue} 
            onValueChange={setAvailableValue}
            disabled={availableOptions.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={
                availableOptions.length === 0 
                  ? t("placeholders.allSelected")
                  : t("placeholders.chooseOption")
              } />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAdd} 
            disabled={!availableValue}
            type="button"
          >
            {t("actions.add")}
          </Button>
        </div>
      </div>

      {/* Selected options with ranks */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <Label>{t("multiChoice.selectedLabel")}</Label>
          <div className="space-y-2">
            {selectedOptions.map((option) => (
              <div 
                key={option.value}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm">
                    {option.rank}
                  </span>
                  <span className="font-medium text-gray-800">{option.label}</span>
                </div>
                <Button
                  onClick={() => handleRemove(option.value)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {t("actions.remove")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button 
        onClick={handleSubmit} 
        disabled={selectedOptions.length === 0}
        className="w-full"
      >
        {t("actions.continue")}
      </Button>
    </div>
  );
}

/**
 * Renderer for Final states
 * Displays completion message with save button
 */
function FinalRenderer({ meta, onEvent, t }: { meta: any; onEvent: (eventType: string, data?: any) => void; t: any }) {
  const handleSave = () => {
    onEvent('SAVE');
  };

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-green-50 border-green-200">
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800">{t("final.title")}</h2>
        {meta.message ? (
          <p className="text-gray-600 mt-2">{meta.message}</p>
        ) : (
          <p className="text-gray-600 mt-2">{t("final.message")}</p>
        )}
      </div>

      <Button 
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {t("actions.saveAnnotations")}
      </Button>
    </div>
  );
}
