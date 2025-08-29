import { Filter, Target, GraduationCap } from "lucide-react";

export default function AntiOverloadBanner() {
  return (
    <div className="anti-overload-banner">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Anti-Overload Methodology</h2>
        <p className="text-lg opacity-90 mb-6">
          Our tool implements built-in safeguards against information overload through curated, 
          focused content delivery that mirrors the core Pivot-and-Launch principles.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <Filter className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Content Filtering</h3>
            <p className="text-sm opacity-80">
              Intelligent curation prevents information overwhelm
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <Target className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Focus Tools</h3>
            <p className="text-sm opacity-80">
              Guided workflows maintain learning clarity
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <GraduationCap className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Deep Learning</h3>
            <p className="text-sm opacity-80">
              Emphasis on understanding core principles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
