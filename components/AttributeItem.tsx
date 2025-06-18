
import React from 'react';
import { Attribute, AttributeValue } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface AttributeItemProps {
  attribute: Attribute;
  onAttributeNameChange: (id: string, name: string) => void;
  onAddValue: (attributeId: string) => void;
  onValueChange: (attributeId: string, valueId: string, value: string) => void;
  onRemoveValue: (attributeId: string, valueId: string) => void;
  onRemoveAttribute: (id: string) => void;
  index: number;
}

const AttributeItem: React.FC<AttributeItemProps> = ({
  attribute,
  onAttributeNameChange,
  onAddValue,
  onValueChange,
  onRemoveValue,
  onRemoveAttribute,
  index,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder={`Attributt ${index + 1} Navn (f.eks. Farge)`}
          value={attribute.name}
          onChange={(e) => onAttributeNameChange(attribute.id, e.target.value)}
          className="text-lg font-semibold p-2 rounded-md w-full transition-shadow bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
        <button
          onClick={() => onRemoveAttribute(attribute.id)}
          className="ml-4 text-red-500 hover:text-red-700 transition-colors p-2 rounded-md hover:bg-red-50"
          aria-label="Fjern attributt"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="space-y-3">
        {attribute.values.map((val, valueIndex) => (
          <div key={val.id} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={`Verdi ${valueIndex + 1}`}
              value={val.value}
              onChange={(e) => onValueChange(attribute.id, val.id, e.target.value)}
              className="flex-grow p-2 rounded-md transition-shadow bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <button
              onClick={() => onRemoveValue(attribute.id, val.id)}
              className="text-red-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
              aria-label="Fjern verdi"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAddValue(attribute.id)}
        className="mt-4 flex items-center space-x-2 text-sm text-sky-600 hover:text-sky-800 font-medium py-2 px-3 rounded-md hover:bg-sky-50 transition-colors border border-sky-500 hover:border-sky-600"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Legg til verdi</span>
      </button>
    </div>
  );
};

export default AttributeItem;
