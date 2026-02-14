import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../API/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Presentation, Trash2, Eye, Plus, 
  Loader2, Calendar, BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function MyPresentations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ['presentations'],
    queryFn: () => base44.entities.LessonPresentation.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LessonPresentation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
    }
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this presentation?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (presentation) => {
    navigate(createPageUrl(`View?id=${presentation.id}`));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white py-6 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Presentations</h1>
              <p className="text-gray-300 mt-1">View and manage your saved lesson presentations</p>
            </div>
            <Link to={createPageUrl('Create')}>
              <Button className="bg-[#00b4a0] hover:bg-[#00a090]">
                <Plus className="w-4 h-4 mr-2" />
                New Presentation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00b4a0]" />
          </div>
        ) : presentations.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Presentation className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No presentations yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first presentation by uploading a lesson plan
              </p>
              <Link to={createPageUrl('Create')}>
                <Button className="bg-[#00b4a0] hover:bg-[#00a090]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Presentation
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <Card 
                key={presentation.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleView(presentation)}
              >
                <CardContent className="p-0">
                  {/* Preview Header */}
                  <div className="bg-[#1e3a5f] text-white p-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <Presentation className="w-8 h-8 text-[#00b4a0]" />
                      <span className="text-[#00b4a0] text-sm">5E Model</span>
                    </div>
                    <h3 className="text-lg font-bold mt-2 line-clamp-1">
                      {presentation.topic || 'Untitled Lesson'}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      {presentation.subject && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {presentation.subject}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(presentation.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {presentation.objectives && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {presentation.objectives}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-[#00b4a0] hover:bg-[#00a090]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(presentation);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={(e) => handleDelete(presentation.id, e)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
