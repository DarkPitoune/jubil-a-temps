import React from 'react';
import './ActivityGraph.css';
import { eachDayOfInterval, subDays, format } from 'date-fns';

interface ActivityGraphProps {
  data: { [key: string]: number };
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ data }) => {
  const today = new Date();
  const startDate = subDays(today, 364);
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getIntensity = (hours: number): string => {
    if (!hours) return 'level-0';
    if (hours <= 2) return 'level-1';
    if (hours <= 4) return 'level-2';
    if (hours <= 6) return 'level-3';
    return 'level-4';
  };

  return (
    <div className="activity-graph">
      <div className="graph-container">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hours = data[dateStr] || 0;
          return (
            <div
              key={dateStr}
              className={`day-cell ${getIntensity(hours)}`}
              title={`${format(day, 'yyyy-MM-dd')}: ${hours.toFixed(1)}h`}
            />
          );
        })}
      </div>
    </div>
  );
};
