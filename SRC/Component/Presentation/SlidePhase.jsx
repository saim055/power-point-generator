import React from 'react';

const SchoolLogo = ({ url }) => {
  const logoSrc = url || '/school_logo.png';
  return (
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
      <img 
        src={logoSrc} 
        alt="School Logo" 
        className="w-14 h-14 object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/60?text=S';
        }}
      />
    </div>
  );
};

const phaseColors = {
  engage: '#00b4a0',
  explore: '#00b4a0',
  explain: '#00b4a0',
  elaborate: '#00b4a0',
  evaluate: '#00b4a0',
  plenary: '#00b4a0'
};

const phaseTimes = {
  engage: '5 min',
  explore: '5 min',
  explain: '5 min',
  elaborate: '15 min',
  evaluate: '15 min',
  plenary: '5 min'
};

export default function SlidePhase({ data, phase, title }) {
  const contentKey = `${phase}_content`;
  const rawContent = data[contentKey] || 'Insert lesson content, visuals, tasks';

  // Helper to safely render content that might be an object/array from AI
  const renderContent = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n');
    }
    return String(val);
  };

  const content = renderContent(rawContent);
  
  return (
    <div className="slide-page w-full h-full bg-gray-100 flex print:break-after-page">
      {/* Left Sidebar */}
      <div className="w-72 bg-[#1e3a5f] text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <SchoolLogo url={data.school_logo_url} />
        </div>

        {/* Sidebar Items */}
        <div className="flex-1 px-4 py-2 space-y-4 text-sm">
          <div>
            <h4 className="text-[#f5a623] font-semibold">Learning Objectives</h4>
            <p className="text-gray-300 text-xs mt-1 line-clamp-3">{renderContent(data.objectives)}</p>
          </div>
          <div>
            <h4 className="text-[#00b4a0] font-semibold">Success Criteria</h4>
            <p className="text-gray-300 text-xs mt-1 line-clamp-3">{renderContent(data.success_criteria)}</p>
          </div>
          <div>
            <h4 className="text-[#f5a623] font-semibold">Keywords</h4>
            <p className="text-gray-300 text-xs mt-1 line-clamp-2">{renderContent(data.keywords)}</p>
          </div>
          <div>
            <h4 className="text-[#00b4a0] font-semibold">Skills</h4>
            <p className="text-gray-300 text-xs mt-1 line-clamp-2">{renderContent(data.skills)}</p>
          </div>
          <div>
            <h4 className="text-[#f5a623] font-semibold">UAE Link</h4>
            <p className="text-gray-300 text-xs mt-1 line-clamp-3">{renderContent(data.uae_link)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#00b4a0] text-white py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}: {data.topic || 'TOPIC'}</h1>
          <div className="bg-white text-[#1e3a5f] px-4 py-2 rounded-lg font-bold">
            Time: {phaseTimes[phase]}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-3xl border-2 border-gray-200 h-full p-6 overflow-auto shadow-sm flex gap-4">
            <div className="flex-1 text-gray-700 whitespace-pre-line leading-relaxed">
              {content}
            </div>
            {data.topic_image_url && (
              <div className="w-48 flex-shrink-0">
                <img 
                  src={data.topic_image_url} 
                  alt={data.topic} 
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}