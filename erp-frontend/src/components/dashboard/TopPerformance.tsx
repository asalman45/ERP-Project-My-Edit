import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const TopPerformance: React.FC = () => {
  const performers = [
    { name: "Louis Gutkowski", tasks: 314, avatar: "LG" },
    { name: "Marlene Kuhlman", tasks: 309, avatar: "MK" },
    { name: "Kristi Lueilwitz", tasks: 289, avatar: "KL" },
    { name: "Abel Pollich", tasks: 242, avatar: "AP" }
  ];

  return (
    <div className="space-y-4">
      {performers.map((performer, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/30 transition-all duration-200 group">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
              index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-500" :
              index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
              index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500" :
              "bg-gradient-to-br from-blue-400 to-blue-500"
            )}>
              {index + 1}
            </div>
            <Avatar className="w-10 h-10 border-2 border-white/50">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-orange-400 to-orange-500 text-white">
                {performer.avatar}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
              {performer.name}
            </p>
            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
              {performer.tasks} tasks completed
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((performer.tasks / 350) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((performer.tasks / 350) * 100)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPerformance;
