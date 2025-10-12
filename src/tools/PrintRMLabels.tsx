import { QRCodeCanvas } from 'qrcode.react';

export function PrintRMLabels({ raws }:{ raws: Array<{ id:string; name?:string }> }) {
  return (
    <div className="p-4 print:p-0 grid grid-cols-3 gap-4">
      {raws.map(rm=>(
        <div key={rm.id} className="p-3 border rounded text-center">
          <div className="text-xs mb-1">{rm.name ?? rm.id}</div>
          <QRCodeCanvas value={`RM:${rm.id}`} size={128} includeMargin />
          <div className="text-[10px] mt-1">RM:{rm.id}</div>
        </div>
      ))}
      <style>{`@media print { .no-print { display:none } }`}</style>
    </div>
  );
}


