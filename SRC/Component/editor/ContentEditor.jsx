import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Target, Key, Lightbulb, Link, Globe,
  Play, Search, MessageSquare, Users, ClipboardCheck, HelpCircle
} from 'lucide-react';

export default function ContentEditor({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const Field = ({ label, field, icon: Icon, placeholder, multiline = false, rows = 3 }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-[#00b4a0]" />}
        {label}
      </Label>
      {multiline ? (
        <Textarea
          value={data[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="resize-none"
        />
      ) : (
        <Input
          value={data[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engage">Engage/Explore</TabsTrigger>
          <TabsTrigger value="explain">Explain/Elaborate</TabsTrigger>
          <TabsTrigger value="evaluate">Evaluate/Plenary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              School Logo URL (optional)
            </Label>
            <Input
              value={data.school_logo_url || ''}
              onChange={(e) => onChange({ ...data, school_logo_url: e.target.value })}
              placeholder="Paste logo image URL here"
            />
          </div>
          <Field label="Topic" field="topic" icon={BookOpen} placeholder="e.g., Simple Harmonic Motion" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subject" field="subject" icon={BookOpen} placeholder="e.g., Physics" />
            <Field label="Grade" field="grade" icon={BookOpen} placeholder="e.g., Grade 11" />
          </div>
          <Field label="Learning Objectives" field="objectives" icon={Target} placeholder="What students will learn..." multiline rows={4} />
          <Field label="Success Criteria" field="success_criteria" icon={Target} placeholder="Students will be able to..." multiline rows={3} />
          <Field label="Keywords" field="keywords" icon={Key} placeholder="Key vocabulary words" multiline rows={2} />
          <Field label="Skills" field="skills" icon={Lightbulb} placeholder="Skills to be developed" multiline rows={2} />
          <Field label="Links to Other Subjects" field="links_subjects" icon={Link} placeholder="Cross-curricular connections" multiline rows={2} />
          <Field label="UAE Link" field="uae_link" icon={Globe} placeholder="Real-world UAE context..." multiline rows={3} />
        </TabsContent>

        <TabsContent value="engage" className="space-y-4">
          <div className="bg-[#00b4a0]/10 p-4 rounded-lg">
            <h3 className="font-semibold text-[#00b4a0] flex items-center gap-2 mb-2">
              <Play className="w-5 h-5" />
              Engage - Starter/Prior Knowledge (5 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">Hook students and activate prior knowledge</p>
            <Textarea
              value={data.engage_content || ''}
              onChange={(e) => handleChange('engage_content', e.target.value)}
              placeholder="Starter activities, prior knowledge check..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
              <Search className="w-5 h-5" />
              Explore - World Outside Classroom (5 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">Real-world connections and exploration</p>
            <Textarea
              value={data.explore_content || ''}
              onChange={(e) => handleChange('explore_content', e.target.value)}
              placeholder="World outside classroom connections..."
              rows={6}
              className="resize-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="explain" className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-700 flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" />
              Explain - Teaching Component (5 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">What NEW knowledge/skill will you teach? How?</p>
            <Textarea
              value={data.explain_content || ''}
              onChange={(e) => handleChange('explain_content', e.target.value)}
              placeholder="New knowledge, teaching methods..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-700 flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              Elaborate - Cooperative Task (15 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">Group work activities</p>
            <Textarea
              value={data.elaborate_content || ''}
              onChange={(e) => handleChange('elaborate_content', e.target.value)}
              placeholder="Cooperative tasks, group activities..."
              rows={6}
              className="resize-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="evaluate" className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-5 h-5" />
              Evaluate - Independent Task (15 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">Individual practice activities</p>
            <Textarea
              value={data.evaluate_content || ''}
              onChange={(e) => handleChange('evaluate_content', e.target.value)}
              placeholder="Independent tasks, individual practice..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5" />
              Plenary - Review (5 min)
            </h3>
            <p className="text-sm text-gray-600 mb-3">How will the learning be reviewed?</p>
            <Textarea
              value={data.plenary_content || ''}
              onChange={(e) => handleChange('plenary_content', e.target.value)}
              placeholder="Review questions, exit tickets..."
              rows={6}
              className="resize-none"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}