import { fabric } from 'fabric';
// imagetracerjs has no types
// @ts-ignore
import ImageTracer from 'imagetracerjs';

export type TraceOptions = Partial<{
  // fewer colors = simpler paths
  numberofcolors: number;
  ltres: number; // line threshold
  qtres: number; // curve threshold
  pathomit: number;
}>;

export async function vectorizeActiveImage(c: fabric.Canvas, opts: TraceOptions = {}) {
  const obj = c.getActiveObject();
  if (!obj || obj.type !== 'image') return;

  const img = obj as fabric.Image;
  const dataURL = img.toDataURL({ format: 'png', multiplier: 1 });
  // Trace bitmap → SVG asynchronously
  const svgstr: string = await new Promise((resolve) => {
    ImageTracer.imageToSVG(
      dataURL,
      (svg: string) => resolve(svg),
      {
        numberofcolors: 8,
        ltres: 1,
        qtres: 1,
        pathomit: 8,
        ...opts,
      }
    );
  });

  const { left = 0, top = 0, angle = 0, scaleX = 1, scaleY = 1 } = img;
  // import SVG as editable vectors
  fabric.loadSVGFromString(svgstr, (objects, options) => {
    const group = fabric.util.groupSVGElements(objects, options);
    group.set({
      left, top, angle,
      scaleX, scaleY,
      selectable: true,
    });
    c.add(group);
    c.setActiveObject(group);
    c.requestRenderAll();
    // keep the original image for comparison or remove it:
    c.remove(img);
  });
}
