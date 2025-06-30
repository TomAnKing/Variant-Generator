
import React, { useState, useCallback } from 'react';
import { Attribute, CombinationResult } from './types';
import AttributeItem from './components/AttributeItem';
import VariantDisplay from './components/VariantDisplay';
import PlusIcon from './components/icons/PlusIcon';

const App: React.FC = () => {
  const [sNumber, setSNumber] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [variantCodeBase, setVariantCodeBase] = useState<string>('');
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

  const generateVariantCode = (baseCode: string, index: number): string => {
    const trimmedBaseCode = baseCode.trim();
    if (!trimmedBaseCode) return '';

    // Regex to find a prefix, a specific separator ([.-]), and a number at the end
    const patternWithSeparator = /^(.*)([.-])(\d+)$/;
    const match = trimmedBaseCode.match(patternWithSeparator);

    let prefix: string;
    let separator: string;
    let startNum: number;
    let currentNum: number;

    if (match) {
      // Base code ends with a known separator and a number
      // e.g., "SI-168-1" -> prefix="SI-168", separator="-", startNum=1
      // e.g., "ABC.3" -> prefix="ABC", separator=".", startNum=3
      prefix = match[1];
      separator = match[2]; // Use the detected separator
      startNum = parseInt(match[3], 10);
      currentNum = startNum + index;
    } else {
      // Base code does not end with a separator and number (e.g., "SI-168", "ABC")
      // Default to using "." as the separator and starting sequence from 1
      prefix = trimmedBaseCode;
      separator = "."; // Default separator is '.'
      startNum = 1;
      currentNum = startNum + index;
    }
    return `${prefix}${separator}${currentNum}`;
  };
  

  const generateCombinations = useCallback((
    currentSNumber: string,
    currentProductName: string,
    currentVariantCodeBase: string,
    currentAttributes: Attribute[]
  ): CombinationResult => {
    const newHeaders = ["S-nummer", "Variantkode", "Produktbeskrivelse Del 1 (maks 100 tegn)", "Produktbeskrivelse Del 2 (maks 50 tegn)"];
    const trimmedSNumber = currentSNumber.trim();
    const trimmedProductName = currentProductName.trim();
    const trimmedVariantCodeBase = currentVariantCodeBase.trim();

    const validAttributes = currentAttributes
      .map(attr => ({
        id: attr.id,
        name: attr.name.trim(),
        values: attr.values.map(v => v.value.trim()).filter(valStr => valStr !== ''),
      }))
      .filter(attr => attr.name !== '' && attr.values.length > 0);

    // If no S-number, no product name, no variant code base and no valid attributes, return empty
    if (!trimmedSNumber && !trimmedProductName && !trimmedVariantCodeBase && validAttributes.length === 0) {
      return { productName: currentProductName, headers: newHeaders, variants: [] };
    }
    
    // Base case: No attributes, or attributes result in no combinations.
    // We generate one line if S-Nummer, Produktnavn or Variantkode Grunnlag is present.
    if (validAttributes.length === 0) {
        const uniqueVariantCode = generateVariantCode(trimmedVariantCodeBase, 0);
        const cell1ProdName = trimmedProductName.substring(0, 100);
        const cell2ProdName = trimmedProductName.length > 100 ? trimmedProductName.substring(100, 150) : "";
        if (trimmedSNumber || trimmedProductName || trimmedVariantCodeBase) {
             return { 
                productName: currentProductName, 
                headers: newHeaders, 
                variants: [[trimmedSNumber, uniqueVariantCode, cell1ProdName, cell2ProdName]] 
            };
        } else { // Should not be reached due to earlier check, but as a safeguard
            return { productName: currentProductName, headers: newHeaders, variants: [] };
        }
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
      const attributeName = validAttributes[index].name;
      for (const value of attributeValueArrays[index]) {
        currentCombination.push(`${attributeName}: ${value}`);
        recurse(index + 1, currentCombination);
        currentCombination.pop();
      }
    };

    recurse(0, []);

    // If attributes were defined but resulted in no actual combinations
    if (rawAttributeCombinations.length === 0) {
        const uniqueVariantCode = generateVariantCode(trimmedVariantCodeBase, 0);
        const cell1ProdName = trimmedProductName.substring(0, 100);
        const cell2ProdName = trimmedProductName.length > 100 ? trimmedProductName.substring(100, 150) : "";
         if (trimmedSNumber || trimmedProductName || trimmedVariantCodeBase) {
            return { 
                productName: currentProductName, 
                headers: newHeaders, 
                variants: [[trimmedSNumber, uniqueVariantCode, cell1ProdName, cell2ProdName]] 
            };
        } else {
             return { productName: currentProductName, headers: newHeaders, variants: [] };
        }
    }
    
    const totalValidAttributes = validAttributes.length;
    let numAttrsToIncludeInCell1: number;
    
    if (trimmedProductName.length > 100) {
      numAttrsToIncludeInCell1 = 0;
    } else if (totalValidAttributes === 3) {
      numAttrsToIncludeInCell1 = 2;
    } else if (totalValidAttributes === 2) {
      numAttrsToIncludeInCell1 = 1;
    } else {
      // General rule for other cases, like 1, 4, 5... attributes
      numAttrsToIncludeInCell1 = Math.ceil(totalValidAttributes / 2);
    }

    const processedVariants: string[][] = [];
    rawAttributeCombinations.forEach((currentAttributeCombo, i) => {
        const uniqueVariantCode = generateVariantCode(trimmedVariantCodeBase, i);
        let productNamePartForCell1 = trimmedProductName;
        let productNameOverflowForCell2 = "";

        if (trimmedProductName.length > 100) {
            productNamePartForCell1 = trimmedProductName.substring(0, 100);
            productNameOverflowForCell2 = trimmedProductName.substring(100);
        }
        
        const attributesListForCell1 = currentAttributeCombo.slice(0, numAttrsToIncludeInCell1);
        const attributesListForCell2 = currentAttributeCombo.slice(numAttrsToIncludeInCell1);

        let cell1Final = productNamePartForCell1;
        const attributesStringForCell1 = attributesListForCell1.join(", ");
        if (attributesListForCell1.length > 0) {
            if (cell1Final.trim() && attributesStringForCell1.trim()) { 
                cell1Final += " " + attributesStringForCell1;
            } else if (attributesStringForCell1.trim()) { 
                cell1Final = attributesStringForCell1;
            }
        }
        cell1Final = cell1Final.substring(0, 100); 

        let cell2Final = productNameOverflowForCell2;
        const attributesStringForCell2 = attributesListForCell2.join(", ");
        if (attributesListForCell2.length > 0) {
            if (cell2Final.trim() && attributesStringForCell2.trim()) { 
                 cell2Final += (productNameOverflowForCell2.trim() ? ", " : "") + attributesStringForCell2;
            } else if (attributesStringForCell2.trim()) { 
                cell2Final = attributesStringForCell2;
            }
        }

        if (productNameOverflowForCell2.trim().length === 0 && cell2Final.startsWith(", ")) {
            cell2Final = cell2Final.substring(2);
        }

        cell2Final = cell2Final.substring(0, 50);
        
        processedVariants.push([trimmedSNumber, uniqueVariantCode, cell1Final, cell2Final]);
    });

    return { productName: currentProductName, headers: newHeaders, variants: processedVariants };
  }, []);
  

  const handleGenerateVariants = useCallback(() => {
    const result = generateCombinations(sNumber, productName, variantCodeBase, attributes);
    setGeneratedResult(result);
  }, [sNumber, attributes, productName, variantCodeBase, generateCombinations]);

  const canGenerate = sNumber.trim() !== '' || 
                      productName.trim() !== '' || 
                      variantCodeBase.trim() !== '' ||
                      attributes.some(attr => attr.name.trim() !== '' && attr.values.some(v => v.value.trim() !== ''));


  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-sky-700">Produktvariantgenerator</h1>
          <p className="mt-2 text-lg text-slate-600">
            Definer produktattributter og generer alle unike kombinasjoner.
          </p>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-md border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Produktinformasjon</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-slate-600 mb-1">
                Produktnavn (valgfritt)
              </label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => { setProductName(e.target.value); setGeneratedResult(null); }}
                placeholder="F.eks. Kontorstol Ergonomisk"
                className="w-full p-2 rounded-md transition-shadow bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="sNumber" className="block text-sm font-medium text-slate-600 mb-1">
                S-nummer (valgfritt)
              </label>
              <input
                type="text"
                id="sNumber"
                value={sNumber}
                onChange={(e) => { setSNumber(e.target.value); setGeneratedResult(null); }}
                placeholder="F.eks. 12345"
                className="w-full p-2 rounded-md transition-shadow bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="variantCodeBase" className="block text-sm font-medium text-slate-600 mb-1">
                Variantkode Grunnlag (valgfritt)
              </label>
              <input
                type="text"
                id="variantCodeBase"
                value={variantCodeBase}
                onChange={(e) => { setVariantCodeBase(e.target.value); setGeneratedResult(null);}}
                placeholder="F.eks. SI-168 eller ABC-XYZ.1 eller MINVare-10"
                className="w-full p-2 rounded-md transition-shadow bg-slate-700 text-slate-50 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Systemet legger til ".1", ".2" osv. hvis ingen nummerering finnes. Hvis basen er "Vare-1", blir det "Vare-1", "Vare-2". Hvis "Vare.5", blir det "Vare.5", "Vare.6".
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">Attributter</h2>
            <button
              onClick={handleAddAttribute}
              className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              <PlusIcon />
              <span>Legg til attributt</span>
            </button>
          </div>
          {attributes.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Ingen attributter lagt til. Klikk på knappen for å legge til den første.</p>
          ) : (
            <div className="space-y-6">
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
          )}
        </section>

        <div className="text-center mb-8">
          <button
            onClick={handleGenerateVariants}
            disabled={!canGenerate}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Generer Varianter
          </button>
        </div>

        {generatedResult && <VariantDisplay result={generatedResult} />}

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Produktvariantgenerator. Alle rettigheter reservert.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
