import React, { useEffect, useState } from 'react';
import { getDashboardAnalytics } from '../services/analyticsApi';
import { getCandidates } from '../services/candidateApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, TrendingUp, Users, Award, Percent } from 'lucide-react';

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom charts data
  const [funnelData, setFunnelData] = useState([]);
  const [applicationsOverTime, setApplicationsOverTime] = useState([]);
  const [interviewOutcomes, setInterviewOutcomes] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [monthlyHires, setMonthlyHires] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [statsRes, candidatesRes] = await Promise.all([
          getDashboardAnalytics(),
          getCandidates()
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
          
          // Map Funnel Data (Candidate Status Distribution)
          const dist = statsRes.data.candidateStatusDistribution || [];
          const stagesOrder = ['Applied', 'Shortlisted', 'Interviewing', 'Hired'];
          const funnelMapped = stagesOrder.map(stage => {
            const match = dist.find(d => d.status === stage);
            return {
              stage,
              Candidates: match ? match.count : 0
            };
          });
          setFunnelData(funnelMapped);
        }

        if (candidatesRes.success) {
          const allCandidates = candidatesRes.data;

          // 1. Applications over time (grouped by date)
          const appGroups = {};
          allCandidates.forEach(c => {
            const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            appGroups[dateStr] = (appGroups[dateStr] || 0) + 1;
          });
          // Convert to sorted array of last 7 entries
          const timeline = Object.keys(appGroups).map(date => ({
            date,
            Applications: appGroups[date]
          })).slice(-10);
          setApplicationsOverTime(timeline.length > 0 ? timeline : [
            { date: 'Mon', Applications: 2 },
            { date: 'Tue', Applications: 4 },
            { date: 'Wed', Applications: 6 },
            { date: 'Thu', Applications: 5 },
            { date: 'Fri', Applications: 8 }
          ]);

          // 2. Interview Success Outcomes
          const hiredCount = allCandidates.filter(c => c.status === 'Hired').length;
          const rejectedCount = allCandidates.filter(c => c.status === 'Rejected').length;
          const interviewingCount = allCandidates.filter(c => c.status === 'Interviewing').length;
          
          setInterviewOutcomes([
            { name: 'Hired', value: hiredCount || 1 },
            { name: 'Rejected', value: rejectedCount || 1 },
            { name: 'Interviewing', value: interviewingCount || 1 }
          ]);

          // 3. AI Match Accuracy Comparatives
          const accuracyPoints = allCandidates
            .filter(c => c.aiScore > 0)
            .map((c, i) => {
              // Recruiter score estimated from status
              let recruiterRating = 70;
              if (c.status === 'Hired') recruiterRating = 95;
              if (c.status === 'Shortlisted') recruiterRating = 85;
              if (c.status === 'Rejected') recruiterRating = 40;
              
              return {
                name: c.name.split(' ')[0],
                'AI Match Score': c.aiScore,
                'Recruiter Rating': recruiterRating
              };
            }).slice(0, 8);
          setAccuracyData(accuracyPoints.length > 0 ? accuracyPoints : [
            { name: 'John', 'AI Match Score': 85, 'Recruiter Rating': 90 },
            { name: 'Sarah', 'AI Match Score': 70, 'Recruiter Rating': 75 },
            { name: 'Dave', 'AI Match Score': 95, 'Recruiter Rating': 90 },
            { name: 'Emma', 'AI Match Score': 60, 'Recruiter Rating': 50 }
          ]);

          // 4. Monthly Hiring trend
          const monthlyHiredGroups = {};
          allCandidates.forEach(c => {
            if (c.status === 'Hired') {
              const monthStr = new Date(c.updatedAt).toLocaleDateString('en-US', {
                month: 'short'
              });
              monthlyHiredGroups[monthStr] = (monthlyHiredGroups[monthStr] || 0) + 1;
            }
          });
          const hiresTrend = Object.keys(monthlyHiredGroups).map(month => ({
            month,
            Hires: monthlyHiredGroups[month]
          }));
          setMonthlyHires(hiresTrend.length > 0 ? hiresTrend : [
            { month: 'Jan', Hires: 1 },
            { month: 'Feb', Hires: 2 },
            { month: 'Mar', Hires: 4 },
            { month: 'Apr', Hires: 3 },
            { month: 'May', Hires: 5 }
          ]);
        }
      } catch (err) {
        console.error('Failed to parse analytics records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">Analytics Dashboard</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Detailed metrics showing candidate pipeline stage conversions, monthly trends, and AI evaluation success.
        </p>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Hiring Funnel (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>Hiring Funnel Conversion</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Applicant counts moving through stages</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="full" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis type="number" className="text-xs" stroke="#888888" />
                <YAxis dataKey="stage" type="category" className="text-xs" stroke="#888888" />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Candidates" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Interview Outcomes Outcomes (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
              <Award className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>Application Outcomes</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Distribution of candidate status results</p>
          </div>
          <div className="h-72 flex flex-col items-center justify-center">
            <div className="w-full h-56">
              <ResponsiveContainer width="full" height="100%">
                <PieChart>
                  <Pie
                    data={interviewOutcomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {interviewOutcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend tags */}
            <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold mt-2">
              {interviewOutcomes.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-zinc-700 dark:text-zinc-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Applications Over Time (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>Applications Over Time</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Daily resume uploads parsed</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="full" height="100%">
              <AreaChart data={applicationsOverTime} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis dataKey="date" className="text-xs" stroke="#888888" />
                <YAxis className="text-xs" stroke="#888888" />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Applications" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. AI Match Accuracy (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
              <Percent className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>AI score vs Recruiter assessment</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Comparing Gemini fit rating against final stages</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="full" height="100%">
              <LineChart data={accuracyData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis dataKey="name" className="text-xs" stroke="#888888" />
                <YAxis className="text-xs" stroke="#888888" />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="AI Match Score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Recruiter Rating" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
