import React, { useState, useCallback } from 'react';
import { Attribute, CombinationResult } from './types';
import AttributeItem from './components/AttributeItem';
import VariantDisplay from './components/VariantDisplay';
import PlusIcon from './components/icons/PlusIcon';

const App: React.FC = () => {
  const [productName, setProductName] = useState<string>('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [generatedResult, setGeneratedResult] = useState<CombinationResult | null>(null);

  const handleAddAttribute = useCallback(() => {
    setAttributes(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', values: [] },
    ]);
    setGeneratedResult(null); 
  }, []);

  const handleRemoveAttribute = useCallback((id: string) => {
    setAttributes(prev => prev.filter(attr => attr.id !== id));
    setGeneratedResult(null);
  }, []);

  const handleAttributeNameChange = useCallback((id: string, name: string) => {
    setAttributes(prev =>
      prev.map(attr => (attr.id === id ? { ...attr, name } : attr))
    );
    setGeneratedResult(null);
  }, []);

  const handleAddValueToAttribute = useCallback((attributeId: string) => {
    setAttributes(prev =>
      prev.map(attr =>
        attr.id === attributeId
          ? { ...attr, values: [...attr.values, { id: crypto.randomUUID(), value: '' }] }
          : attr
      )
    );
    setGeneratedResult(null);
  }, []);

  const handleAttributeValueChange = useCallback((attributeId: string, valueId: string, value: string) => {
    setAttributes(prev =>
      prev.map(attr =>
        attr.id === attributeId
          ? {
              ...attr,
              values: attr.values.map(val =>
                val.id === valueId ? { ...val, value } : val
              ),
            }
          : attr
      )
    );
    setGeneratedResult(null);
  }, []);

  const handleRemoveValueFromAttribute = useCallback((attributeId: string, valueId: string) => {
    setAttributes(prev =>
      prev.map(attr =>
        attr.id === attributeId
          ? { ...attr, values: attr.values.filter(val => val.id !== valueId) }
          : attr
      )
    );
    setGeneratedResult(null);
  }, []);

  const generateCombinations = useCallback((currentAttributes: Attribute[], currentProductName: string): CombinationResult => {
    const newHeaders = ["Produktbeskrivelse Del 1 (maks 100 tegn)", "Produktbeskrivelse Del 2 (maks 50 tegn)"];
    const trimmedProductName = currentProductName.trim();

    const validAttributes = currentAttributes
      .map(attr => ({
        id: attr.id,
        name: attr.name.trim(),
        values: attr.values.map(v => v.value.trim()).filter(valStr => valStr !== ''),
      }))
      .filter(attr => attr.name !== '' && attr.values.length > 0);

    if (validAttributes.length === 0) {
      if (!trimmedProductName) {
        return { productName: currentProductName, headers: newHeaders, variants: [] };
      }
      const cell1 = trimmedProductName.substring(0, 100);
      const cell2 = trimmedProductName.length > 100 ? trimmedProductName.substring(100, 150) : "";
      return { 
        productName: currentProductName, 
        headers: newHeaders, 
        variants: [[cell1, cell2]] 
      };
    }

    const attributeValueArrays = validAttributes.map(attr => attr.values);
    const rawAttributeCombinations: string[][] = []; 

    const recurse = (index: number, currentCombination: string[]) => {
      if (index === attributeValueArrays.length) {
        if (currentCombination.length > 0) {
          rawAttributeCombinations.push([...currentCombination]);
        }
        return;
      }
      if (attributeValueArrays[index].length === 0) { // Should be filtered by validAttributes, but for safety
        recurse(index + 1, currentCombination);
        return;
      }
      const attributeName = validAttributes[index].name;
      for (const value of attributeValueArrays[index]) {
        currentCombination.push(`${attributeName}: ${value}`);
        recurse(index + 1, currentCombination);
        currentCombination.pop();
      }
    };

    recurse(0, []);

    if (rawAttributeCombinations.length === 0) {
        if (!trimmedProductName) {
             return { productName: currentProductName, headers: newHeaders, variants: [] };
        }
        const cell1 = trimmedProductName.substring(0, 100);
        const cell2 = trimmedProductName.length > 100 ? trimmedProductName.substring(100, 150) : "";
        return { productName: currentProductName, headers: newHeaders, variants: [[cell1, cell2]] };
    }

    let globalMinAttributesToFitInCell1 = Infinity;

    for (const currentAttributeCombo of rawAttributeCombinations) {
        let tempCell1Construction = trimmedProductName;
        let attributesConsideredForCell1Count = 0;

        if (trimmedProductName.length > 100) {
            attributesConsideredForCell1Count = 0; 
        } else {
            for (const attributeString of currentAttributeCombo) {
                let prospectiveTempCell1 = tempCell1Construction;
                // Add separator: space if after product name, or ", " if after another attribute
                if (prospectiveTempCell1 && attributeString) { 
                    prospectiveTempCell1 += (attributesConsideredForCell1Count > 0 ? ", " : " ");
                } else if (!prospectiveTempCell1 && attributeString && attributesConsideredForCell1Count > 0) {
                     prospectiveTempCell1 += ", "; // Handles no product name, but multiple attributes
                }
                prospectiveTempCell1 += attributeString;

                if (prospectiveTempCell1.length <= 100) {
                    tempCell1Construction = prospectiveTempCell1;
                    attributesConsideredForCell1Count++;
                } else {
                    break; 
                }
            }
        }
        globalMinAttributesToFitInCell1 = Math.min(globalMinAttributesToFitInCell1, attributesConsideredForCell1Count);
    }
    
    if (globalMinAttributesToFitInCell1 === Infinity) globalMinAttributesToFitInCell1 = 0; // Fallback

    const processedVariants: string[][] = [];
    for (const currentAttributeCombo of rawAttributeCombinations) {
        let productNamePartForCell1 = trimmedProductName;
        let productNameOverflowForCell2 = "";

        if (trimmedProductName.length > 100) {
            productNamePartForCell1 = trimmedProductName.substring(0, 100);
            productNameOverflowForCell2 = trimmedProductName.substring(100);
        }
        
        const numAttrsToIncludeInCell1 = (trimmedProductName.length > 100) ? 0 : globalMinAttributesToFitInCell1;
        
        const attributesListForCell1 = currentAttributeCombo.slice(0, numAttrsToIncludeInCell1);
        const attributesListForCell2 = currentAttributeCombo.slice(numAttrsToIncludeInCell1);

        let cell1Final = productNamePartForCell1;
        const attributesStringForCell1 = attributesListForCell1.join(", ");
        if (attributesListForCell1.length > 0) {
            if (cell1Final) { 
                cell1Final += " " + attributesStringForCell1;
            } else { 
                cell1Final = attributesStringForCell1;
            }
        }
        // This final cell1 string should naturally be <= 100 due to globalMinAttributesToFitInCell1 logic.
        // A final truncate is mostly a safeguard for extreme edge cases not caught by globalMin...
        cell1Final = cell1Final.substring(0, 100); 

        let cell2Final = productNameOverflowForCell2;
        const attributesStringForCell2 = attributesListForCell2.join(", ");
        if (attributesListForCell2.length > 0) {
            if (cell2Final) { 
                cell2Final += (cell2Final.endsWith(" ") || cell2Final === "" ? "" : " ") + attributesStringForCell2;
            } else { 
                cell2Final = attributesStringForCell2;
            }
        }
        cell2Final = cell2Final.substring(0, 50);
        
        processedVariants.push([cell1Final, cell2Final]);
    }

    return { productName: currentProductName, headers: newHeaders, variants: processedVariants };
  }, []);
  

  const handleGenerateVariants = useCallback(() => {
    const result = generateCombinations(attributes, productName);
    setGeneratedResult(result);
  }, [attributes, productName, generateCombinations]);

  const canGenerate = attributes.some(attr => attr.name.trim() !== '' && attr.values.some(v => v.value.trim() !== '')) || productName.trim() !== '';


  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-sky-700">Produktvariantgenerator</h1>
          <p className="mt-2 text-lg text-slate-600">
            Definer attributter og generer alle unike produktkombinasjoner.
          </p>
        </header>

        <section className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">Produktinformasjon</h2>
           <label htmlFor="productName" className="block text-sm font-medium text-slate-600 mb-1">Produktnavn</label>
          <input
            id="productName"
            type="text"
            placeholder="F.eks. 'Elegant Kontorstol'"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              setGeneratedResult(null); 
            }}
            className="w-full p-3 rounded-md transition-shadow mb-6 bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Attributter</h2>
          {attributes.length === 0 && (
            <div className="text-center py-4 px-3 bg-slate-50 rounded-md border border-slate-200">
                <p className="text-slate-500">Ingen attributter lagt til ennå. </p>
                <p className="text-slate-500">Klikk på knappen under for å starte.</p>
            </div>
          )}
          <div className="space-y-6 mb-6">
            {attributes.map((attr, index) => (
              <AttributeItem
                key={attr.id}
                attribute={attr}
                index={index}
                onAttributeNameChange={handleAttributeNameChange}
                onAddValue={handleAddValueToAttribute}
                onValueChange={handleAttributeValueChange}
                onRemoveValue={handleRemoveValueFromAttribute}
                onRemoveAttribute={handleRemoveAttribute}
              />
            ))}
          </div>
          <button
            onClick={handleAddAttribute}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Legg til nytt attributt"
          >
            <PlusIcon />
            <span>Legg til attributt</span>
          </button>
        </section>

        <section className="text-center mb-8">
          <button
            onClick={handleGenerateVariants}
            disabled={!canGenerate}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generer Varianter
          </button>
        </section>

        {generatedResult && <VariantDisplay result={generatedResult} />}
        
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Produktvariantgenerator. Bygget med React & Tailwind CSS.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
