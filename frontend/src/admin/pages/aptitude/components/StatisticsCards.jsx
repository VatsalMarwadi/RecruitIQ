// admin/pages/aptitude/components/StatisticsCards.jsx

import React from 'react';
import { 
  FileText, 
  Award, 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Crown,
  Clock
} from 'lucide-react';

export default function StatisticsCards({ stats }) {
  const cards = [
    {
      title: 'Total Questions',
      value: stats.totalQuestions,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Total Marks',
      value: stats.totalMarks,
      icon: Award,
      color: 'green'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Passed',
      value: stats.passed,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: XCircle,
      color: 'red'
    },
    {
      title: 'Average Score',
      value: stats.averageScore,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Highest Score',
      value: stats.highestScore,
      icon: Crown,
      color: 'amber'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600'
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">{card.title}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`${colorClasses[card.color]} p-2 rounded-full flex-shrink-0 ml-2`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}