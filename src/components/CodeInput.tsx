import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { parseGS1, normalize } from '@/lib/codes/gs1';
import { isScanMatch, normalizeScanInput } from '@/lib/scan/normalize';
import { normalizeScan as registryNormalize, tokenMatchesMaterial, persistTokenIfNew } from '@/lib/scan/registry';

type Allowed = 'any'|'qr'|'code128'|'ean'|'datamatrix';
type Parser = 'plain'|'gs1'|'kv';

export function CodeInput(props: {
  requiredCodeValue: string;
  altCodeValues?: string[];
  allowedSymbologies?: Allowed[];
  parser?: Parser;
  material?: any; // The actual sample/raw material object for registry-based validation
  onPass: (decoded: { text:string; format:string }) => void;
  onFail?: (reason: string) => void;
}) {
  const { requiredCodeValue, altCodeValues, allowedSymbologies=['any'], parser='plain', material, onPass, onFail } = props;

  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle'|'ok'|'bad'>('idle');
  const [cam, setCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const readerRef = useRef<BrowserMultiFormatReader|null>(null);

  function symbologyTag(zxingFormat: string): Allowed|'other' {
    const f = zxingFormat.toLowerCase();
    if (f.includes('qr')) return 'qr';
    if (f.includes('code_128') || f.includes('code-128')) return 'code128';
    if (f.includes('ean')) return 'ean';
    if (f.includes('data_matrix')) return 'datamatrix';
    return 'other';
  }

  function allowed(formatTag: Allowed|'other') {
    if (allowedSymbologies.includes('any')) return true;
    if (formatTag === 'other') return false;
    return allowedSymbologies.includes(formatTag);
  }

  function eqAny(payload: string) {
    // If material is provided, use registry-based validation (most robust)
    if (material) {
      console.log('[CodeInput] Using registry validation for material:', material?.id || material?.name);
      console.log('[CodeInput] Checking payload:', payload);
      const result = tokenMatchesMaterial(payload, material);
      console.log('[CodeInput] Registry match result:', result);
      return result;
    }
    
    console.log('[CodeInput] No material provided, falling back to altCodes validation');
    console.log('[CodeInput] altCodeValues:', altCodeValues);
    
    // Try new scan matcher first (handles more formats)
    if (isScanMatch(payload, requiredCodeValue, requiredCodeValue, altCodeValues || [])) {
      return true;
    }
    
    // Fallback to old normalization
    const canon = normalize(payload);
    const targets = [requiredCodeValue, ...(altCodeValues||[])].map(normalize);
    return targets.includes(canon);
  }

  async function verify(decoded: { text:string; format:string }) {
    // Accept-any mode: when no required or alt values provided, pass through
    if (!requiredCodeValue && (!altCodeValues || altCodeValues.length === 0)) {
      setStatus('ok'); 
      if (material) await persistTokenIfNew(material, decoded.text);
      onPass(decoded); 
      return true;
    }
    const tag = symbologyTag(decoded.format);
    if (!allowed(tag)) { onFail?.(`Symbology not allowed: ${decoded.format}`); setStatus('bad'); return false; }

    if (parser === 'gs1') {
      const g = parseGS1(decoded.text);
      if (g.gtin && eqAny(g.gtin)) { 
        setStatus('ok'); 
        if (material) await persistTokenIfNew(material, decoded.text);
        onPass(decoded); 
        return true; 
      }
      setStatus('bad'); onFail?.('GS1 content mismatch'); return false;
    }

    if (parser === 'kv') {
      const kv: Record<string,string> = {};
      decoded.text.split(/[;|]/).forEach(p=>{ const [k,v] = p.split('='); if (k && v) kv[k.trim().toLowerCase()] = v.trim(); });
      if (kv['code'] && eqAny(kv['code'])) { 
        setStatus('ok'); 
        if (material) await persistTokenIfNew(material, decoded.text);
        onPass(decoded); 
        return true; 
      }
      setStatus('bad'); onFail?.('KV content mismatch'); return false;
    }

    if (eqAny(decoded.text)) { 
      setStatus('ok'); 
      // Learn this token for future use
      if (material) await persistTokenIfNew(material, decoded.text);
      onPass(decoded); 
      return true; 
    }
    setStatus('bad'); onFail?.('Content mismatch'); return false;
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Normalize before verification
      const normalized = normalizeScanInput(text);
      verify({ text: normalized, format: 'WEDGE' });
    }
  }

  useEffect(()=>{
    function stopReader(reader: any){
      try {
        if (reader && typeof reader.reset === 'function') reader.reset();
        else if (reader && typeof reader.stopContinuousDecode === 'function') reader.stopContinuousDecode();
      } catch {}
      // Always stop camera tracks
      try {
        const stream = videoRef.current?.srcObject as MediaStream | null | undefined;
        stream?.getTracks?.().forEach(t=>t.stop());
      } catch {}
      try { if (videoRef.current) { videoRef.current.pause(); (videoRef.current as any).srcObject = null; } } catch {}
    }
    if (!cam) { stopReader(readerRef.current); return; }
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let cancel = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        while (!cancel) {
          const res: Result | undefined = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current);
          if (res) verify({ text: res.getText(), format: res.getBarcodeFormat()?.toString?.() || 'UNKNOWN' });
        }
      } catch (err) { onFail?.('Camera error'); setStatus('bad'); }
    })();
    return () => { cancel = true; stopReader(reader); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam]);

  // Auto-select text after successful scan (for overwrite on next scan)
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (status === 'ok' && inputRef.current) {
      inputRef.current.select();
    }
  }, [status]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input 
          ref={inputRef}
          value={text} 
          onChange={e=>setText(e.target.value)} 
          onKeyDown={onKey} 
          placeholder="Scan code (QR/Barcode)…" 
          className="border px-2 py-1 rounded w-64"
          autoFocus
        />
        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={()=> setCam(v=>!v)}>
          {cam ? 'Stop Camera' : 'Use Camera'}
        </button>
        <span className={status==='ok' ? 'text-green-600 font-semibold' : status==='bad' ? 'text-red-600' : 'text-gray-500'}>
          {status==='ok' ? '✓ Material matched' : status==='bad' ? 'Wrong code' : 'Waiting…'}
        </span>
      </div>
      {cam && <video ref={videoRef} className="w-72 rounded border" />}
    </div>
  );
}


