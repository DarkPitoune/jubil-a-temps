import React from 'react';
import './ActivityGraph.css';
import { eachDayOfInterval, format } from 'date-fns';

interface ActivityGraphProps {
  data: { [key: string]: number };
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ data }) => {
  const today = new Date();
  const dates = Object.keys(data);
  const startDate = dates.length > 0 
    ? new Date(dates.sort()[0])
    : today;
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getIntensity = (hours: number): string => {
    if (!hours) return 'level-0';
    if (hours <= 6) return 'level-1';
    if (hours <= 6.5) return 'level-2';
    if (hours <= 7) return 'level-3';
    if (hours <= 7.5) return 'level-4';
    if (hours <= 8) return 'level-5';
    if (hours <= 8.5) return 'level-6';
    if (hours <= 9) return 'level-7';
    if (hours <= 9.5) return 'level-8';
    return 'level-9';
  };

  const weeks = days.reduce<Date[][]>((acc, day) => {
    // getDay returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday to be 0, Sunday to be 6
    const dayOfWeek = (day.getDay() + 6) % 7;
    const weekIndex = Math.floor((days.indexOf(day) - dayOfWeek) / 7);
    
    if (!acc[weekIndex]) {
      acc[weekIndex] = [];
    }
    acc[weekIndex].push(day);
    return acc;
  }, []);

  return (
    <div className="activity-graph">
      <div className="graph-container">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="week-column">
            {week.map((day) => {
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
        ))}
      </div>
    </div>
  );
};
