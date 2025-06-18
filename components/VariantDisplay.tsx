
import React, { useState, useCallback } from 'react';
import { CombinationResult } from '../types';
import CopyIcon from './icons/CopyIcon';

interface VariantDisplayProps {
  result: CombinationResult | null;
}

const VariantDisplay: React.FC<VariantDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const formatForClipboard = useCallback(() => {
    if (!result || result.variants.length === 0) return '';
    
    // Hver variant er nå en array med fire strenger [sNummer, variantCode, cell1, cell2]
    return result.variants.map(variantCells => variantCells.join('\t')).join('\n');
  }, [result]);

  const handleCopyToClipboard = useCallback(() => {
    if (!result || result.variants.length === 0) return;

    const textToCopy = formatForClipboard();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy variants:', err);
      alert('Kunne ikke kopiere varianter. Sjekk konsollen for feil.');
    });
  }, [result, formatForClipboard]);

  if (!result || result.variants.length === 0) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200 text-center">
        <p className="text-slate-500">Ingen varianter generert. Legg til S-nummer, produktnavn, variantkode grunnlag og/eller attributter og klikk "Generer Varianter".</p>
      </div>
    );
  }
  
  const hasContentToShow = result.variants.some(variant => variant.some(cell => cell && cell.trim() !== ''));
  if (!hasContentToShow) {
     return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200 text-center">
        <p className="text-slate-500">Ingen varianter å vise basert på input.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-700">
          Genererte Varianter <span className="text-base font-normal text-slate-500">({result.variants.length} totalt)</span>
        </h2>
        <button
          onClick={handleCopyToClipboard}
          disabled={result.variants.length === 0}
          className={`flex items-center space-x-2 py-2 px-4 rounded-md font-medium transition-all duration-150
            ${copied 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50'
            }`}
        >
          <CopyIcon />
          <span>{copied ? 'Kopiert!' : 'Kopier til Excel'}</span>
        </button>
      </div>
      
      <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-md">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              {result.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {result.variants.map((variantCells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {variantCells.map((cellValue, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-pre-wrap break-words text-sm text-slate-700 max-w-xs">
                    {cellValue}
                  </td>
                ))}
              </tr>
            ))}
             {result.variants.length === 0 && ( 
              <tr>
                <td colSpan={result.headers.length || 1} className="px-6 py-4 text-center text-sm text-slate-500">
                  Ingen kombinasjoner funnet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariantDisplay;
