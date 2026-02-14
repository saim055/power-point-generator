import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '../API/base44Client';

export default function FileUploader({ onExtracted, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, extracting, success, error

  const processFile = async (file) => {
    if (!file) return;
    
    // Validate file type - only Word documents supported
    if (!file.type.includes('word') && !file.type.includes('openxml') && !file.name.match(/\.(doc|docx)$/i)) {
      onError('Please upload a Word document (.doc or .docx)');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setStatus('uploading');

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setStatus('extracting');

      // Extract data using AI
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Main topic of the lesson" },
            subject: { type: "string", description: "Subject (Physics, Math, etc.)" },
            grade: { type: "string", description: "Grade level" },
            objectives: { type: "string", description: "Learning objectives - all bullet points" },
            success_criteria: { type: "string", description: "Success criteria - what students will achieve" },
            keywords: { type: "string", description: "Key vocabulary words separated by commas" },
            skills: { type: "string", description: "Skills to be developed" },
            links_subjects: { type: "string", description: "Links to other subjects" },
            uae_link: { type: "string", description: "UAE context, real-world application" },
            engage_content: { type: "string", description: "STARTER/PRIOR KNOWLEDGE section content - activities to hook students and check prior knowledge (5 min)" },
            explore_content: { type: "string", description: "WORLD OUTSIDE CLASSROOM section - real world connections and exploration activities (5 min)" },
            explain_content: { type: "string", description: "TEACHING COMPONENT section - What NEW knowledge and/or skill will be taught? How? (5 min max)" },
            elaborate_content: { type: "string", description: "COOPERATIVE TASK section - group work activities (15 min)" },
            evaluate_content: { type: "string", description: "INDEPENDENT TASK section - individual practice activities (15 min)" },
            plenary_content: { type: "string", description: "PLENARY section - How will the learning be reviewed? Exit questions and wrap-up (5 min)" }
          }
        }
      });

      if (extractionResult.status === 'success' && extractionResult.output) {
        setStatus('success');
        onExtracted({
          ...extractionResult.output,
          source_file_url: file_url
        });
      } else {
        throw new Error(extractionResult.details || 'Failed to extract lesson data');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
      onError(error.message || 'Failed to process the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
        ${isDragging ? 'border-[#00b4a0] bg-[#00b4a0]/10' : 'border-gray-300 hover:border-gray-400'}
        ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        id="file-upload"
        name="file-upload"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />

      {status === 'idle' && (
        <>
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Drop your Lesson Plan here
          </h3>
          <p className="text-gray-500 mb-4">
            or click to browse files
          </p>
          <p className="text-sm text-gray-400">
            Supports Word documents (.doc, .docx)
          </p>
        </>
      )}

      {status === 'uploading' && (
        <div className="py-8">
          <Loader2 className="w-16 h-16 mx-auto text-[#00b4a0] animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Uploading...
          </h3>
          <p className="text-gray-500">{fileName}</p>
        </div>
      )}

      {status === 'extracting' && (
        <div className="py-8">
          <Loader2 className="w-16 h-16 mx-auto text-[#00b4a0] animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            AI is reading your lesson plan...
          </h3>
          <p className="text-gray-500">Extracting objectives, activities, and content</p>
        </div>
      )}

      {status === 'generating_image' && (
        <div className="py-8">
          <Loader2 className="w-16 h-16 mx-auto text-[#f5a623] animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Generating topic image...
          </h3>
          <p className="text-gray-500">Creating a visual for your lesson</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Successfully extracted!
          </h3>
          <p className="text-gray-500">{fileName}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">
            Processing failed
          </h3>
          <Button
            variant="outline"
            onClick={() => setStatus('idle')}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
