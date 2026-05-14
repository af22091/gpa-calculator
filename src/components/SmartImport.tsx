import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { FileUp, Clipboard, Loader2, Info } from 'lucide-react';
import { parseTranscriptText, aggregateResults } from '../utils/parser';

interface SmartImportProps {
  onImport: (data: Record<number, number[]>) => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onImport }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback((text: string) => {
    const results = parseTranscriptText(text);
    if (results.length === 0) {
      setError('文字が見つからないか、評価パターンを認識できませんでした。手入力をお試しください。');
      return;
    }
    const aggregated = aggregateResults(results);
    onImport(aggregated);
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
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
    </div>
  );
};
