import React, { useState, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { FileUp, Info, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { parseTranscriptText, aggregateResults, type ParseResult } from '../utils/parser';

export type AppMode = 'general' | 'shibaura';

interface SmartImportProps {
  onImport: (data: Record<number, number[]>) => void;
  mode: AppMode;
  onReset?: () => void;
}

// 各項目に一意のIDを振るためのヘルパー
let nextId = 0;

export const SmartImport: React.FC<SmartImportProps> = ({ onImport, mode }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detectedPairs, setDetectedPairs] = useState<(ParseResult & { id: number })[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateResults = useCallback((newPairs: (ParseResult & { id: number })[]) => {
    setDetectedPairs(newPairs);
    const aggregated = aggregateResults(newPairs);
    onImport(aggregated);
  }, [onImport]);

  const processText = useCallback((text: string) => {
    const results = parseTranscriptText(text, mode);
    
    if (results.length === 0) {
      setError('有効なデータが見つかりませんでした。テキストを直接貼り付けるか、別の画像を試してください。');
      return;
    }

    const resultsWithId = results.map(r => ({ ...r, id: nextId++ }));
    const updatedPairs = [...detectedPairs, ...resultsWithId];
    updateResults(updatedPairs);
    
    setIsSuccess(true);
    setError(null);
    setTimeout(() => setIsSuccess(false), 3000);
  }, [mode, detectedPairs, updateResults]);

  const processImages = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const worker = await createWorker('jpn+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') setProgress(Math.floor(m.progress * 100));
        }
      });
      
      for (let i = 0; i < files.length; i++) {
        const { data: { text } } = await worker.recognize(files[i]);
        processText(text);
      }
      
      await worker.terminate();
    } catch (err) {
      console.error(err);
      setError('画像の解析に失敗しました。');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 再選択できるようにリセット
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processImages(files);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) files.push(blob);
      }
    }

    if (files.length > 0) {
      processImages(files);
      return;
    }
    
    const text = e.clipboardData.getData('text');
    if (text) processText(text);
  };

  const removePair = (id: number) => {
    const updated = detectedPairs.filter(p => p.id !== id);
    updateResults(updated);
  };

  return (
    <div className="input-group">
      <div 
        className="smart-import-zone"
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          multiple
          onChange={handleFileUpload} 
          style={{ display: 'none' }}
        />
        
        {isProcessing ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>画像を解析中... {progress}%</p>
          </div>
        ) : isSuccess ? (
          <div className="loading-overlay" style={{ background: 'rgba(34, 197, 94, 0.9)', color: 'white' }}>
            <CheckCircle2 size={48} />
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>読み込み完了！</div>
            <p>累積 {detectedPairs.length} 個の科目を検出中</p>
          </div>
        ) : (
          <>
            <FileUp className="import-icon" />
            <h3>ここにコピペ、またはクリックして選択</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              【複数選択対応】スクショを1枚ずつ、またはまとめて貼り付け
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {detectedPairs.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}
            onClick={() => setShowDetails(!showDetails)}
          >
            解析結果の履歴を確認・削除 ({detectedPairs.length}件)
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showDetails && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '1rem', 
              background: '#f8fafc', 
              borderRadius: '0.75rem', 
              fontSize: '0.75rem', 
              maxHeight: '250px', 
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '4px' }}>検出元</th>
                    <th style={{ padding: '4px' }}>単位</th>
                    <th style={{ padding: '4px' }}>評価</th>
                    <th style={{ padding: '4px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedPairs.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                      <td style={{ padding: '4px', color: 'var(--text-muted)' }}>"{p.raw}"</td>
                      <td style={{ padding: '4px', fontWeight: 'bold' }}>{p.credits}</td>
                      <td style={{ padding: '4px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {['S', 'A', 'B', 'C', 'D'][p.gradeIndex] || '?'}
                      </td>
                      <td style={{ padding: '4px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removePair(p.id); }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
