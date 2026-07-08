import type { CostMeta, Currency } from '../types';

interface CostFormProps {
  cost: CostMeta;
  onChange: (cost: CostMeta) => void;
}

export function CostForm({ cost, onChange }: CostFormProps) {
  const update = (field: keyof CostMeta, value: number | string) => {
    onChange({ ...cost, [field]: value });
  };

  return (
    <div className="card">
      <h3 className="card-title">💰 Token 与成本</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>输入 Tokens</label>
          <input
            type="number"
            min="0"
            value={cost.inputTokens}
            onChange={e => update('inputTokens', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>输出 Tokens</label>
          <input
            type="number"
            min="0"
            value={cost.outputTokens}
            onChange={e => update('outputTokens', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>缓存命中 Tokens</label>
          <input
            type="number"
            min="0"
            value={cost.cacheHitTokens}
            onChange={e => update('cacheHitTokens', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>总费用</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost.totalCost}
            onChange={e => update('totalCost', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>货币</label>
          <select
            value={cost.currency}
            onChange={e => update('currency', e.target.value as Currency)}
          >
            <option value="USD">USD ($)</option>
            <option value="CNY">CNY (¥)</option>
          </select>
        </div>
        <div className="form-group">
          <label>重试次数</label>
          <input
            type="number"
            min="0"
            value={cost.retries}
            onChange={e => update('retries', Number(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>中断次数</label>
          <input
            type="number"
            min="0"
            value={cost.interruptions}
            onChange={e => update('interruptions', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}
