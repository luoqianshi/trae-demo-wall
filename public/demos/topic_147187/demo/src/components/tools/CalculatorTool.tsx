import { useState } from 'react';
import { Calculator, X } from 'lucide-react';

const buttons = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export const CalculatorTool = ({ onClose }: { onClose: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleButtonClick = (button: string) => {
    if (button === 'C') {
      setDisplay('0');
      setPrevValue(null);
      setOperation(null);
      setShouldResetDisplay(false);
    } else if (button === '±') {
      setDisplay((prev) => {
        if (prev === '0') return prev;
        return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
      });
    } else if (button === '%') {
      setDisplay((prev) => String(parseFloat(prev) / 100));
    } else if (['÷', '×', '-', '+'].includes(button)) {
      if (prevValue !== null && operation && !shouldResetDisplay) {
        calculate();
      }
      setPrevValue(parseFloat(display));
      setOperation(button);
      setShouldResetDisplay(true);
    } else if (button === '=') {
      if (prevValue !== null && operation) {
        calculate();
      }
    } else if (button === '.') {
      setDisplay((prev) => {
        if (shouldResetDisplay) return '0.';
        if (prev.includes('.')) return prev;
        return `${prev}.`;
      });
      setShouldResetDisplay(false);
    } else {
      setDisplay((prev) => {
        if (shouldResetDisplay || prev === '0') return button;
        return `${prev}${button}`;
      });
      setShouldResetDisplay(false);
    }
  };

  const calculate = () => {
    if (prevValue === null || !operation) return;

    const currentValue = parseFloat(display);
    let result: number;

    switch (operation) {
      case '+':
        result = prevValue + currentValue;
        break;
      case '-':
        result = prevValue - currentValue;
        break;
      case '×':
        result = prevValue * currentValue;
        break;
      case '÷':
        result = prevValue / currentValue;
        break;
      default:
        return;
    }

    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setShouldResetDisplay(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white">计算器</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-4">
        <div className="bg-gray-900 dark:bg-black rounded-xl p-4 text-right">
          <p className="text-white text-3xl font-light overflow-x-auto">{display}</p>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((row, rowIndex) =>
            row.map((button) => (
              <button
                key={`${rowIndex}-${button}`}
                onClick={() => handleButtonClick(button)}
                className={`py-3 rounded-xl font-medium text-lg transition-all ${
                  button === 'C'
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70'
                    : ['÷', '×', '-', '+'].includes(button)
                    ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/70'
                    : button === '='
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white col-span-2 hover:from-orange-600 hover:to-orange-700'
                    : button === '0'
                    ? 'col-span-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {button}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};