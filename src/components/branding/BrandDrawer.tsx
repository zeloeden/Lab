import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { patchSample } from '@/services/sampleApi';

const schema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  priceCurrent: z.coerce.number().min(0).optional(),
  status: z.enum(['Accepted', 'Pending', 'Rejected', 'Not branded']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleId?: string;
  initial?: Partial<FormValues>;
  onSuccess?: () => void;
}

export const BrandDrawer: React.FC<Props> = ({ open, onOpenChange, sampleId, initial, onSuccess }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: initial?.brand || '',
      priceCurrent: initial?.priceCurrent,
      status: initial?.status || 'Accepted',
    }
  });

  React.useEffect(() => {
    reset({ brand: initial?.brand || '', priceCurrent: initial?.priceCurrent, status: initial?.status || 'Accepted' });
  }, [initial, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!sampleId) return;
    try {
      await patchSample(sampleId, values);
      toast.success('Branding saved');
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Brand / Edit Sample</DialogTitle>
          <DialogDescription>Update brand, price and status</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Brand</Label>
            <Input {...register('brand')} placeholder="Brand name" aria-invalid={!!errors.brand} />
            {errors.brand && <p className="text-sm text-red-600">{errors.brand.message}</p>}
          </div>
          <div>
            <Label>Current Price</Label>
            <Input type="number" step="0.01" {...register('priceCurrent')} />
          </div>
          <div>
            <Label>Status</Label>
            <Select onValueChange={(v) => setValue('status', v as any)} value={initial?.status || 'Accepted'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Not branded">Not branded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


