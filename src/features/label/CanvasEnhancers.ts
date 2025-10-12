import { fabric } from 'fabric';

export type EnhancerOptions = {
  showGrid: boolean;
  snap: boolean;
  gridMM?: number;
};

const DPI = 300;
const mm2px = (mm:number) => Math.round((mm * DPI) / 25.4);

export function attachEnhancers(canvas: fabric.Canvas, opts: EnhancerOptions){
  const grid = opts.gridMM ?? 5;
  let gridLines: fabric.Object[] = [];

  function drawGrid(){
    clearGrid();
    if (!opts.showGrid) return;
    const step = mm2px(grid);
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    for (let x=step; x<w; x+=step){
      const line = new fabric.Line([x,0,x,h], { stroke:'#eef2ff', selectable:false, evented:false });
      gridLines.push(line); canvas.add(line); canvas.sendToBack(line);
    }
    for (let y=step; y<h; y+=step){
      const line = new fabric.Line([0,y,w,y], { stroke:'#eef2ff', selectable:false, evented:false });
      gridLines.push(line); canvas.add(line); canvas.sendToBack(line);
    }
  }
  function clearGrid(){ gridLines.forEach(o=>canvas.remove(o)); gridLines=[]; }

  function snapCoord(n:number){ const step = mm2px(grid); return Math.round(n/step)*step; }

  function onMoving(e:any){ if (!opts.snap) return; const o=e.target; if (!o) return; o.set({ left: snapCoord(o.left||0), top: snapCoord(o.top||0) }); }
  function onScaling(e:any){ if (!opts.snap) return; const o=e.target; if (!o) return; if (o.width) o.set({ width: snapCoord(o.width) }); if (o.height) o.set({ height: snapCoord(o.height) }); }
  function onRotating(_e:any){ /* no-op */ }

  drawGrid();
  canvas.on('object:moving', onMoving);
  canvas.on('object:scaling', onScaling);
  canvas.on('object:rotating', onRotating);

  return {
    update(newOpts: Partial<EnhancerOptions>){ Object.assign(opts, newOpts); drawGrid(); },
    detach(){ clearGrid(); canvas.off('object:moving', onMoving); canvas.off('object:scaling', onScaling); canvas.off('object:rotating', onRotating); }
  };
}


