import { useState } from 'react';

export function SupervisorOverride({ open, onApprove }:{ open:boolean; onApprove:(reason:string, supervisor:string)=>void; }){
  const [user,setUser] = useState('');
  const [pass,setPass]=useState('');
  const [reason,setReason]=useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl w-[420px] space-y-3 border">
        <div className="font-semibold">Supervisor Override</div>
        <input className="border px-2 py-1 rounded w-full" placeholder="Supervisor username" value={user} onChange={e=>setUser(e.target.value)} />
        <input className="border px-2 py-1 rounded w-full" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} />
        <input className="border px-2 py-1 rounded w-full" placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=> onApprove(reason, user)}>Approve</button>
        </div>
      </div>
    </div>
  );
}



