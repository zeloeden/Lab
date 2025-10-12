import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  variables: { key:string; label:string }[];
  onRun: (records: any[]) => void;
};

export const DataMerge: React.FC<Props> = ({ variables, onRun }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [map, setMap] = useState<Record<string,string>>({});

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if (!f) return;
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res:any)=>{ setHeaders(res.meta.fields || []); setRows(res.data || []); }
    });
  }

  function run(){
    const out = rows.map(r=>{
      const obj:any={};
      for (const v of variables){ const h=map[v.key]; if (h) obj[v.key] = r[h]; }
      return obj;
    });
    onRun(out);
  }

  return (
    <div className="space-y-3">
      <Input type="file" accept=".csv" onChange={onFile} />
      {headers.length>0 && (
        <div className="space-y-2">
          {variables.map(v=> (
            <div key={v.key} className="flex items-center gap-2">
              <div className="w-48 text-sm">{v.key}</div>
              <select className="border rounded px-2 py-1 flex-1" value={map[v.key]||''} onChange={e=>setMap({...map,[v.key]:e.target.value})}>
                <option value="">(none)</option>
                {headers.map(h=> <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          <Button onClick={run}>Print with Data</Button>
        </div>
      )}
    </div>
  );
};


