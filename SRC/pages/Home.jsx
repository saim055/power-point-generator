import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, Presentation, Sparkles, ArrowRight, 
  FileText, Zap, Download, Users, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm">Made with love for teachers</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <span className="text-[#00b4a0]"> Lesson Plans </span>
            into Beautiful Presentations
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload your Word document lesson plan and let AI create stunning 5E Model presentations in seconds. 
            <span className="text-[#f5a623]"> Free for all teachers!</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Create')}>
              <Button size="lg" className="bg-[#00b4a0] hover:bg-[#00a090] text-white px-8 py-6 text-lg rounded-xl">
                <Upload className="w-5 h-5 mr-2" />
                Create Presentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Preview Image */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <Presentation className="w-24 h-24 mx-auto text-[#00b4a0] mb-4" />
                <p className="text-white text-xl">5E Model Presentation Preview</p>
                <p className="text-gray-400 mt-2">Engage • Explore • Explain • Elaborate • Evaluate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-gray-100 hover:border-[#00b4a0] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#00b4a0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[#00b4a0]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
                <p className="text-gray-600">
                  Drop your Word document lesson plan. We support .docx and .doc files.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:border-[#f5a623] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#f5a623]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. AI Extracts</h3>
                <p className="text-gray-600">
                  AI automatically extracts objectives, activities, and all lesson content.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:border-[#1e3a5f] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#1e3a5f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Presentation className="w-8 h-8 text-[#1e3a5f]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Present</h3>
                <p className="text-gray-600">
                  Get a beautiful 5E Model presentation ready to present or print.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 5E Model Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Professional 5E Model Format
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Your presentations follow the research-backed 5E instructional model
          </p>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Engage', time: '5 min', color: 'bg-[#00b4a0]' },
              { name: 'Explore', time: '10 min', color: 'bg-blue-500' },
              { name: 'Explain', time: '10 min', color: 'bg-purple-500' },
              { name: 'Elaborate', time: '15 min', color: 'bg-orange-500' },
              { name: 'Evaluate', time: '15 min', color: 'bg-green-500' },
              { name: 'Plenary', time: '5 min', color: 'bg-yellow-500' },
            ].map((phase) => (
              <div key={phase.name} className={`${phase.color} text-white px-6 py-3 rounded-full font-semibold`}>
                {phase.name} ({phase.time})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1e3a5f] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Save Hours of Work?
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Join teachers who are creating beautiful presentations in minutes, not hours.
          </p>
          <Link to={createPageUrl('Create')}>
            <Button size="lg" className="bg-[#00b4a0] hover:bg-[#00a090] text-white px-8 py-6 text-lg rounded-xl">
              <Zap className="w-5 h-5 mr-2" />
              Start Creating Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#152a45] py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Made with ❤️ for teachers everywhere • Helping educators focus on what matters most
          </p>
        </div>
      </div>
    </div>
  );
}