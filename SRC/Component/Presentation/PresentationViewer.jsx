import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, FileDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SlideOverview from './SlideOverview';
import SlidePhase from './SlidePhase';

const slides = [
  { type: 'overview', title: 'Lesson Overview' },
  { type: 'phase', phase: 'engage', title: 'Engage' },
  { type: 'phase', phase: 'explore', title: 'Explore' },
  { type: 'phase', phase: 'explain', title: 'Explain' },
  { type: 'phase', phase: 'elaborate', title: 'Elaborate' },
  { type: 'phase', phase: 'evaluate', title: 'Evaluate' },
  { type: 'phase', phase: 'plenary', title: 'Plenary' },
];

export default function PresentationViewer({ data }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const slideRef = useRef(null);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownloadPPTX = async () => {
    setIsExporting(true);
    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      const response = await fetch(`${apiBase}/api/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        const origin = apiBase || window.location.origin;
        const downloadUrl = (result.downloadUrl && result.downloadUrl.startsWith('http'))
          ? result.downloadUrl
          : `${origin}${result.downloadUrl || ''}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(result.error || 'Failed to generate PowerPoint');
      }
    } catch (err) {
      console.error('PPTX export error:', err);
      alert('Failed to export PPTX. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const renderSlide = () => {
    const slide = slides[currentSlide];
    if (slide.type === 'overview') {
      return <SlideOverview data={data} />;
    } else {
      return <SlidePhase data={data} phase={slide.phase} title={slide.title} />;
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Controls */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="text-white hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-4">
            {slides[currentSlide].title}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPPTX}
            disabled={isExporting}
            className="text-white hover:bg-gray-700"
          >
            <FileDown className="w-4 h-4 mr-1" />
            {isExporting ? 'Exporting...' : 'Download PPT'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="bg-gray-700 px-4 py-2 flex gap-2 overflow-x-auto print:hidden">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
              index === currentSlide
                ? 'bg-[#00b4a0] text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {slide.title}
          </button>
        ))}
      </div>

      {/* Slide Content */}
      <div className={`flex-1 ${isFullscreen ? 'flex items-center justify-center' : ''}`}>
        <div 
          ref={slideRef}
          className={`aspect-video bg-gray-100 overflow-hidden ${
            isFullscreen ? 'w-full h-full max-h-screen' : 'w-full'
          }`}
          style={{ minHeight: isFullscreen ? '100vh' : '500px' }}
        >
          {renderSlide()}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .slide-page {
            page-break-after: always;
            height: 100vh;
            width: 100vw;
          }
        }
      `}</style>
    </div>
  );
}
