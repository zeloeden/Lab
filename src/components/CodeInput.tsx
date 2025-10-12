import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { parseGS1, normalize } from '@/lib/codes/gs1';

type Allowed = 'any'|'qr'|'code128'|'ean'|'datamatrix';
type Parser = 'plain'|'gs1'|'kv';

export function CodeInput(props: {
  requiredCodeValue: string;
  altCodeValues?: string[];
  allowedSymbologies?: Allowed[];
  parser?: Parser;
  onPass: (decoded: { text:string; format:string }) => void;
  onFail?: (reason: string) => void;
}) {
  const { requiredCodeValue, altCodeValues, allowedSymbologies=['any'], parser='plain', onPass, onFail } = props;

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
    const canon = normalize(payload);
    const targets = [requiredCodeValue, ...(altCodeValues||[])].map(normalize);
    return targets.includes(canon);
  }

  function verify(decoded: { text:string; format:string }) {
    const tag = symbologyTag(decoded.format);
    if (!allowed(tag)) { onFail?.(`Symbology not allowed: ${decoded.format}`); setStatus('bad'); return false; }

    if (parser === 'gs1') {
      const g = parseGS1(decoded.text);
      if (g.gtin && eqAny(g.gtin)) { setStatus('ok'); onPass(decoded); return true; }
      setStatus('bad'); onFail?.('GS1 content mismatch'); return false;
    }

    if (parser === 'kv') {
      const kv: Record<string,string> = {};
      decoded.text.split(/[;|]/).forEach(p=>{ const [k,v] = p.split('='); if (k && v) kv[k.trim().toLowerCase()] = v.trim(); });
      if (kv['code'] && eqAny(kv['code'])) { setStatus('ok'); onPass(decoded); return true; }
      setStatus('bad'); onFail?.('KV content mismatch'); return false;
    }

    if (eqAny(decoded.text)) { setStatus('ok'); onPass(decoded); return true; }
    setStatus('bad'); onFail?.('Content mismatch'); return false;
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') verify({ text, format: 'WEDGE' });
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={onKey} placeholder="Scan code (QR/Barcode)…" className="border px-2 py-1 rounded w-64" />
        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={()=> setCam(v=>!v)}>
          {cam ? 'Stop Camera' : 'Use Camera'}
        </button>
        <span className={status==='ok' ? 'text-green-600' : status==='bad' ? 'text-red-600' : 'text-gray-500'}>
          {status==='ok' ? 'Code OK' : status==='bad' ? 'Wrong code' : 'Waiting…'}
        </span>
      </div>
      {cam && <video ref={videoRef} className="w-72 rounded border" />}
    </div>
  );
}


