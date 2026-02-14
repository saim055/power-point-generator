import React from 'react';

const SchoolLogo = ({ url }) => {
  const [src, setSrc] = React.useState(url || '/school_logo.png');
  const triedSvgRef = React.useRef(false);
  return (
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
      <img
        src={src}
        alt="School Logo"
        className="w-14 h-14 object-contain"
        onError={(e) => {
          e.target.onerror = null;
          if (!triedSvgRef.current && (src.endsWith('.png') || src.includes('/school_logo.png'))) {
            triedSvgRef.current = true;
            setSrc('/school_logo.svg');
          } else {
            e.target.src = 'https://via.placeholder.com/60?text=S';
          }
        }}
      />
    </div>
  );
};

export default function SlideOverview({ data }) {
  // Helper to safely render content that might be an object/array from AI
  const renderContent = (val) => {
    if (!val) return 'Add here';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n');
    }
    return String(val);
  };

  return (
    <div className="slide-page w-full h-full bg-gray-100 flex flex-col print:break-after-page">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SchoolLogo url={data.school_logo_url} />
          <h1 className="text-3xl font-bold">{data.topic || 'TOPIC'}</h1>
        </div>
        <span className="text-[#00b4a0] text-xl">Lesson Overview</span>
      </div>

      {/* Content Grid */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-4">
        {/* Learning Objectives */}
        <div className="col-span-2 bg-white rounded-lg border-2 border-[#00b4a0] p-4">
          <h3 className="text-[#00b4a0] font-bold text-lg mb-2">Learning Objectives</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.objectives)}</p>
        </div>

        {/* Success Criteria */}
        <div className="bg-white rounded-lg border-2 border-[#f5a623] p-4">
          <h3 className="text-[#f5a623] font-bold text-lg mb-2">Success Criteria</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.success_criteria)}</p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-lg border-2 border-[#00b4a0] p-4">
          <h3 className="text-[#00b4a0] font-bold text-lg mb-2">Keywords</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.keywords)}</p>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg border-2 border-[#f5a623] p-4">
          <h3 className="text-[#f5a623] font-bold text-lg mb-2">Skills</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.skills)}</p>
        </div>

        {/* Links to other subjects */}
        <div className="bg-white rounded-lg border-2 border-[#f5a623] p-4">
          <h3 className="text-[#f5a623] font-bold text-lg mb-2">Links to other subjects</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.links_subjects)}</p>
        </div>

        {/* UAE Link - Full Width */}
        <div className="col-span-3 bg-white rounded-lg border-2 border-[#f5a623] p-4">
          <h3 className="text-[#f5a623] font-bold text-lg mb-2 text-center">UAE Link</h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{renderContent(data.uae_link)}</p>
        </div>
      </div>
    </div>
  );
}
