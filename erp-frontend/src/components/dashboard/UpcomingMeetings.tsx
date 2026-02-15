import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UpcomingMeetings: React.FC = () => {
  const meetings = [
    {
      title: "Project Manager - Job Interview",
      time: "Today 06:00-08:00",
      attendees: ["JD", "SM", "AL", "RK"]
    },
    {
      title: "Project Manager - Job Interview", 
      time: "Today 06:00-08:00",
      attendees: ["JD", "SM", "AL", "RK"]
    },
    {
      title: "Project Manager - Job Interview",
      time: "Today 06:00-08:00", 
      attendees: ["JD", "SM", "AL", "RK"]
    }
  ];

  return (
    <div className="space-y-4">
      {meetings.map((meeting, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-gray-100 transition-colors">
              {meeting.title}
            </p>
            <p className="text-xs text-gray-300 group-hover:text-gray-200 transition-colors mt-1">
              {meeting.time}
            </p>
          </div>
          <div className="flex -space-x-2">
            {meeting.attendees.map((attendee, attendeeIndex) => (
              <Avatar key={attendeeIndex} className="w-8 h-8 border-2 border-gray-600 hover:border-gray-400 transition-all duration-200 hover:scale-110">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback className="text-xs bg-gradient-to-br from-gray-600 to-gray-700 text-white font-semibold">
                  {attendee}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingMeetings;
