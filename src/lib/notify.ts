export async function scheduleLocalReminders(title:string, body:string, startAt:number, dueAt:number, offsets:number[]){
  if (typeof Notification !== 'undefined'){
    if (Notification.permission !== 'granted') await Notification.requestPermission();
    const fire = (when:number, msg:string) => setTimeout(()=> new Notification(title, { body: msg }), Math.max(0, when - Date.now()));
    for (const m of offsets) fire(dueAt - m*60*1000, body + ` (in ${m} min)`);
    fire(dueAt, body + ' (due now)');
  }
}


