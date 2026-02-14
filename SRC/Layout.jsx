import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Presentation, Plus, FolderOpen, Home } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  // Hide navigation on presentation view pages
  const hideNav = currentPageName === 'View';

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      {currentPageName !== 'Home' && (
        <nav className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <Presentation className="w-6 h-6 text-[#00b4a0]" />
                <span className="font-bold text-[#1e3a5f]">LessonSlides</span>
              </Link>

              <div className="flex items-center gap-4">
                <Link 
                  to={createPageUrl('Home')}
                  className={`flex items-center gap-1 text-sm ${
                    currentPageName === 'Home' ? 'text-[#00b4a0]' : 'text-gray-600 hover:text-[#00b4a0]'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <Link 
                  to={createPageUrl('Create')}
                  className={`flex items-center gap-1 text-sm ${
                    currentPageName === 'Create' ? 'text-[#00b4a0]' : 'text-gray-600 hover:text-[#00b4a0]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Link>
                <Link 
                  to={createPageUrl('MyPresentations')}
                  className={`flex items-center gap-1 text-sm ${
                    currentPageName === 'MyPresentations' ? 'text-[#00b4a0]' : 'text-gray-600 hover:text-[#00b4a0]'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  My Presentations
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {children}
    </div>
  );
}