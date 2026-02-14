import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PresentationViewer from '@/Component/Presentation/PresentationViewer';

export default function View() {
  const urlParams = new URLSearchParams(window.location.search);
  const presentationId = urlParams.get('id');

  const { data: presentation, isLoading, error } = useQuery({
    queryKey: ['presentation', presentationId],
    queryFn: async () => {
      const presentations = await base44.entities.LessonPresentation.list();
      return presentations.find(p => p.id === presentationId);
    },
    enabled: !!presentationId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00b4a0]" />
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Presentation not found
          </h2>
          <Link to={createPageUrl('MyPresentations')}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Presentations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <PresentationViewer data={presentation} />
    </div>
  );
}
