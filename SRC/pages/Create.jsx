import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, Eye, Edit3, Save, Loader2, 
  CheckCircle, AlertCircle, Presentation
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '../API/base44Client';
import FileUploader from '@/Component/upload/FileUploader';
import ContentEditor from '@/Component/editor/ContentEditor';
import PresentationViewer from '@/Component/Presentation/PresentationViewer';

export default function Create() {
  const [step, setStep] = useState('upload'); // upload, edit, preview
  const [lessonData, setLessonData] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const handleExtracted = (data) => {
    setLessonData(data);
    setError('');
    setStep('edit');
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleSave = async () => {
    if (!lessonData) return;
    
    setIsSaving(true);
    try {
      // Generate PowerPoint like Base44 did
      const response = await fetch('http://localhost:3001/api/generate-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Trigger download
        const downloadUrl = (result.downloadUrl && result.downloadUrl.startsWith('http'))
          ? result.downloadUrl
          : `http://localhost:3001${result.downloadUrl || ''}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSavedId(result.filename);
        alert('PowerPoint downloaded successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate PowerPoint');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to generate PowerPoint. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startOver = () => {
    setStep('upload');
    setLessonData(null);
    setError('');
    setSavedId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Create Presentation</h1>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-4">
            {['upload', 'edit', 'preview'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-[#00b4a0] text-white' : 
                  ['upload', 'edit', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                  'bg-white/20 text-white/60'
                }`}>
                  {['upload', 'edit', 'preview'].indexOf(step) > i ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className={`w-12 h-0.5 mx-2 ${
                  ['upload', 'edit', 'preview'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
                }`} />}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {step === 'edit' && (
              <Button
                onClick={() => setStep('preview')}
                className="bg-[#00b4a0] hover:bg-[#00a090]"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('edit')}
                  className="border-white text-white hover:bg-white/10"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#00b4a0] hover:bg-[#00a090]"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {savedId && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Presentation saved successfully! You can access it from your saved presentations.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Upload Your Lesson Plan</CardTitle>
                <p className="text-gray-500 mt-2">
                  Upload your Word document and AI will extract all the content automatically
                </p>
              </CardHeader>
              <CardContent>
                <FileUploader 
                  onExtracted={handleExtracted}
                  onError={handleError}
                />
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Tips for best results:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use clear section headers in your lesson plan</li>
                    <li>• Include Learning Objectives, Success Criteria, Keywords</li>
                    <li>• Have sections for Starter, Teaching, Activities, Plenary</li>
                    <li>• UAE Link/Real-world connections are automatically detected</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Step */}
        {step === 'edit' && lessonData && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Your Presentation
                </h2>
                <p className="text-gray-500">
                  Review and edit the extracted content before generating your presentation
                </p>
              </div>
              <Button variant="outline" onClick={startOver}>
                Start Over
              </Button>
            </div>
            
            <ContentEditor 
              data={lessonData}
              onChange={setLessonData}
            />
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && lessonData && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Presentation className="w-6 h-6 text-[#00b4a0]" />
                  {lessonData.topic || 'Your Presentation'}
                </h2>
                <p className="text-gray-500">
                  Use arrow keys to navigate • Press F for fullscreen • Print to save as PDF
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <PresentationViewer data={lessonData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
