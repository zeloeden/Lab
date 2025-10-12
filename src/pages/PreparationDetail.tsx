import React from 'react';
import { useParams } from 'react-router-dom';
import { PreparationDetails } from '@/features/preparations/PreparationDetails';

export const PreparationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div className="p-4">Invalid preparation id</div>;
  return <PreparationDetails id={id} layout="full" />;
};


