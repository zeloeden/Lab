import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { patchSample } from '@/services/sampleApi';
import { getFieldOptions } from '@/lib/customFieldsUtils';

const schema = z.object({
  brandedAs: z.string().min(1, 'Brand is required'),
  priceCurrent: z.coerce.number().min(0).optional(),
  status: z.enum(['Accepted', 'Pending', 'Rejected', 'Not branded']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleId: string | null;
  initial?: Partial<FormValues>;
  onSuccess?: () => void;
}

export const BrandDrawer: React.FC<Props> = ({ open, onOpenChange, sampleId, initial, onSuccess }) => {
  console.log('BrandDrawer props:', { open, sampleId, initial });
  
  // Get brand options from custom fields
  const brandOptions = getFieldOptions('brand');
  
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandedAs: initial?.brandedAs || '',
      priceCurrent: initial?.priceCurrent,
      status: initial?.status || 'Accepted',
    }
  });

  React.useEffect(() => {
    reset({ brandedAs: initial?.brandedAs || '', priceCurrent: initial?.priceCurrent, status: initial?.status || 'Accepted' });
  }, [initial, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!sampleId) return;
    try {
      await patchSample(sampleId, values);
      toast.success('Branding updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error('Failed to update branding');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Brand / Edit Sample</DialogTitle>
          <DialogDescription>Update branding and price for this sample</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Brand</Label>
            <Select onValueChange={(value) => setValue('brandedAs', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((option) => (
                  <SelectItem key={option.name} value={option.value}>
                    {option.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">+ Add Custom Brand</SelectItem>
              </SelectContent>
            </Select>
            {errors.brandedAs && <p className="text-xs text-red-600 mt-1">{errors.brandedAs.message}</p>}
          </div>

          <div>
            <Label>Current Price</Label>
            <Input type="number" step="0.01" {...register('priceCurrent')} placeholder="e.g., 20" />
            {errors.priceCurrent && <p className="text-xs text-red-600 mt-1">{errors.priceCurrent.message}</p>}
          </div>

          <div>
            <Label>Status</Label>
            <Select onValueChange={(v) => setValue('status', v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Accepted" />
              </SelectTrigger>
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


