import { useState, useMemo } from 'react';
import { SmartImport } from './components/SmartImport';
import { 
  type Pattern, 
  type EvaluationPattern, 
  EVALUATION_LABELS, 
  PATTERN1_POINTS, 
  PATTERN2_POINTS 
} from './constants';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface CreditGroupData {
  id: string;
  credits: number;
  grades: number[];
}

function App() {
  const [pattern, setPattern] = useState<Pattern>('pattern1');
  const [evalPattern, setEvalPattern] = useState<EvaluationPattern>('set2');
  const [groups, setGroups] = useState<CreditGroupData[]>([
    { id: '1', credits: 2, grades: [0, 0, 0, 0, 0] }
  ]);

  const labels = useMemo(() => {
    if (pattern === 'pattern1') {
      return EVALUATION_LABELS[evalPattern];
    }
    return ['9', '8', '7', '6', '5', '4', '3', '2', '1', '0'];
  }, [pattern, evalPattern]);

  const updateGrade = (groupId: string, gradeIndex: number, value: number) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, grades: g.grades.map((v, i) => i === gradeIndex ? value : v) }
        : g
    ));
  };

  const updateCredits = (groupId: string, credits: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, credits } : g));
  };

  const addGroup = () => {
    const defaultGrades = pattern === 'pattern1' ? [0, 0, 0, 0, 0] : Array(10).fill(0);
    setGroups(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), credits: 2, grades: defaultGrades }]);
  };

  const removeGroup = (id: string) => {
    if (groups.length > 1) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleSmartImport = (importedData: Record<number, number[]>) => {
    const newGroups: CreditGroupData[] = Object.entries(importedData).map(([credits, grades]) => ({
      id: Math.random().toString(36).substr(2, 9),
      credits: parseInt(credits, 10),
      grades: pattern === 'pattern1' ? grades : Array(10).fill(0)
    }));
    setGroups(newGroups);
  };

  const resetAll = () => {
    if (window.confirm('すべての入力をリセットして最初からやり直しますか？')) {
      const defaultGrades = pattern === 'pattern1' ? [0, 0, 0, 0, 0] : Array(10).fill(0);
      setGroups([{ id: '1', credits: 2, grades: defaultGrades }]);
    }
  };

  const stats = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;

    groups.forEach(group => {
      group.grades.forEach((count, i) => {
        if (count > 0) {
          const creditsForThis = count * group.credits;
          totalCredits += creditsForThis;
          
          if (pattern === 'pattern1') {
            totalPoints += creditsForThis * PATTERN1_POINTS[i];
          } else {
            const pointValue = 9 - i;
            totalPoints += creditsForThis * (PATTERN2_POINTS[pointValue] || 0);
          }
        }
      });
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    return { gpa, totalCredits };
  }, [groups, pattern]);

  return (
    <div className="container">
      <header>
        <h1>GPA計算シミュレーター</h1>
        <div className="gpa-display glass-card">
          <p className="gpa-label">算定GPA</p>
          <div className="gpa-value">{stats.gpa}</div>
          <p className="gpa-label">総履修単位数: {stats.totalCredits}</p>
          <button 
            className="btn btn-outline" 
            onClick={resetAll} 
            style={{ marginTop: '1.5rem', fontSize: '0.875rem', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
          >
            最初からやり直す（リセット）
          </button>
        </div>
      </header>

      <main className="glass-card">
        <div className="input-group">
          <div className="section-title">計算パターンの選択</div>
          <div className="radio-group">
            <input type="radio" id="p1" name="pattern" checked={pattern === 'pattern1'} onChange={() => {
              setPattern('pattern1');
              setGroups([{ id: '1', credits: 2, grades: [0, 0, 0, 0, 0] }]);
            }} />
            <label htmlFor="p1" className="radio-label">4ポイントスケール</label>
            <input type="radio" id="p2" name="pattern" checked={pattern === 'pattern2'} onChange={() => {
              setPattern('pattern2');
              setGroups([{ id: '1', credits: 2, grades: Array(10).fill(0) }]);
            }} />
            <label htmlFor="p2" className="radio-label">9ポイント → 4ポイント</label>
          </div>
        </div>

        {pattern === 'pattern1' && (
          <div className="input-group">
            <div className="section-title">評価パターンの選択</div>
            <select value={evalPattern} onChange={(e) => setEvalPattern(e.target.value as EvaluationPattern)}>
              <option value="set1">100~90 / 89~80 / ...</option>
              <option value="set2">秀 / 優 / 良 / 可 / 不</option>
              <option value="set3">S / A / B / C / DorE</option>
              <option value="set4">A / B / C / D / EorF</option>
            </select>
          </div>
        )}

        <SmartImport onImport={handleSmartImport} />

        <div className="input-group">
          <div className="section-title"><Calculator size={20} /> 科目数の一括入力</div>
          {groups.map((group) => (
            <div key={group.id} className="credit-group">
                <div className="credit-group-header">
                  <div className="input-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                    <label>単位数:</label>
                    <div className="counter-control small">
                      <button className="count-btn" onClick={() => updateCredits(group.id, group.credits - 1)}>−</button>
                      <input type="number" value={group.credits} onChange={(e) => updateCredits(group.id, parseInt(e.target.value) || 0)} />
                      <button className="count-btn" onClick={() => updateCredits(group.id, group.credits + 1)}>+</button>
                    </div>
                  </div>
                {groups.length > 1 && (
                  <button className="btn btn-outline" onClick={() => removeGroup(group.id)} style={{ padding: '0.5rem', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="grid-inputs">
                {labels.map((label, i) => (
                  <div key={i} className="input-field">
                    <label>{label}</label>
                    <div className="counter-control">
                      <button className="count-btn" onClick={() => updateGrade(group.id, i, (group.grades[i] || 0) - 1)}>−</button>
                      <input type="number" min="0" value={group.grades[i] || 0} onChange={(e) => updateGrade(group.id, i, parseInt(e.target.value) || 0)} />
                      <button className="count-btn" onClick={() => updateGrade(group.id, i, (group.grades[i] || 0) + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-outline" onClick={addGroup} style={{ width: '100%', marginTop: '1rem' }}><Plus size={18} /> 別の単位数を追加</button>
        </div>
      </main>
    </div>
  );
}

export default App;
