import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { FileUp, Info } from 'lucide-react';
import { parseTranscriptText, aggregateResults } from '../utils/parser';

interface SmartImportProps {
  onImport: (data: Record<number, number[]>) => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onImport }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback((text: string) => {
    const results = parseTranscriptText(text);
    if (results.length === 0) {
      setError('有効なデータが見つかりませんでした。テキストを直接貼り付けるか、別の画像を試してください。');
      return;
    }
    const aggregated = aggregateResults(results);
    onImport(aggregated);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  }, [onImport]);

  const processImage = async (file: File | Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const worker = await createWorker('jpn+eng');
      
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
        ) : (
          <>
            <FileUp className="import-icon" />
            <h3>ここにコピペ、またはクリックして選択</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              成績表のテキストを貼り付けるか、スクショを貼り付けてください
            </p>
          </>
        )}
        {isSuccess && !isProcessing && (
          <div className="loading-overlay" style={{ background: 'rgba(34, 197, 94, 0.9)', color: 'white' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>読み込み完了！</div>
            <p>結果が更新されました</p>
          </div>
        )}
      </div>
      
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.5rem' }}>{error}</p>}
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <Info size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          貼り付けや画像アップロードは何度でも行えます。
        </p>
      </div>
    </div>
  );
};
