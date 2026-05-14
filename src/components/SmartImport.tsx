import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { FileUp, Info, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { parseTranscriptText, aggregateResults, type ParseResult } from '../utils/parser';

interface SmartImportProps {
  onImport: (data: Record<number, number[]>) => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onImport }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detectedPairs, setDetectedPairs] = useState<ParseResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const processText = useCallback((text: string) => {
    const results = parseTranscriptText(text);
    setDetectedPairs(results);
    
    if (results.length === 0) {
      setError('有効なデータが見つかりませんでした。テキストを直接貼り付けるか、別の画像を試してください。');
      return;
    }
    
    const aggregated = aggregateResults(results);
    onImport(aggregated);
    setIsSuccess(true);
    setError(null);
    setTimeout(() => setIsSuccess(false), 3000);
  }, [onImport]);

  const processImage = async (file: File | Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setDetectedPairs([]);

    try {
      const worker = await createWorker('jpn+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') setProgress(Math.floor(m.progress * 100));
        }
      });
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      processText(text);
    } catch (err) {
      console.error(err);
      setError('画像の解析に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) processImage(blob);
        return;
      }
    }
    
    const text = e.clipboardData.getData('text');
    if (text) processText(text);
  };

  return (
    <div className="input-group">
      <div className="section-title">
        <Info size={20} />
        スマート入力（解析）
      </div>
      <div 
        className="smart-import-zone"
        onPaste={handlePaste}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          accept="image/*" 
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
            <p>{detectedPairs.length} 個の科目を検出しました</p>
          </div>
        ) : (
          <>
            <FileUp className="import-icon" />
            <h3>ここにコピペ、またはクリックして選択</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              成績表のテキストを貼り付けるか、スクショを貼り付けてください
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
            解析結果の詳細を表示 ({detectedPairs.length}件)
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showDetails && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '1rem', 
              background: '#f8fafc', 
              borderRadius: '0.75rem', 
              fontSize: '0.75rem', 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '4px' }}>検出箇所</th>
                    <th style={{ padding: '4px' }}>単位</th>
                    <th style={{ padding: '4px' }}>評価</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedPairs.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                      <td style={{ padding: '4px', color: 'var(--text-muted)' }}>"{p.raw}"</td>
                      <td style={{ padding: '4px', fontWeight: 'bold' }}>{p.credits}</td>
                      <td style={{ padding: '4px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {['S', 'A', 'B', 'C', 'D'][p.gradeIndex] || '?'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <Info size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          貼り付けや画像アップロードは何度でも行えます。
        </p>
      </div>
    </div>
  );
};
