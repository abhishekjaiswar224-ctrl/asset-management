import React from 'react';
import { Users, PlusCircle } from 'lucide-react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex justify-center">
      <div className="inline-flex p-0 bg-white/20 backdrop-blur-sm rounded-xl shadow-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-sm transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-md transform scale-105'
                : 'text-white hover:bg-white/10'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
