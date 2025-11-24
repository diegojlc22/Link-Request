
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RequestStatus } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { requests, units } = useData();
  const { currentUser } = useAuth();

  // Filter requests based on permission
  const myRequests = requests.filter(r => {
    if (currentUser?.role === 'ADMIN') return r.companyId === currentUser.companyId;
    if (currentUser?.role === 'LEADER') return r.unitId === currentUser.unitId;
    return r.creatorId === currentUser?.id;
  });

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter(r => r.status === RequestStatus.SENT || r.status === RequestStatus.VIEWED).length,
    inProgress: myRequests.filter(r => r.status === RequestStatus.IN_PROGRESS || r.status === RequestStatus.WAITING_CLIENT).length,
    resolved: myRequests.filter(r => r.status === RequestStatus.RESOLVED).length
  };

  const dataByStatus = [
    { name: 'Novos', value: stats.pending, color: '#60a5fa' },
    { name: 'Andamento', value: stats.inProgress, color: '#fbbf24' },
    { name: 'Resolvidos', value: stats.resolved, color: '#34d399' },
  ];

  // Group by unit for admin view
  const dataByUnit = units.map(u => ({
    name: u.name.split(' - ')[1] || u.name, // Simplify name
    count: requests.filter(r => r.unitId === u.id).length
  }));

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Requisições" value={stats.total} icon={Send} color="bg-blue-500" />
        <StatCard title="Pendentes" value={stats.pending} icon={AlertCircle} color="bg-orange-500" />
        <StatCard title="Em Andamento" value={stats.inProgress} icon={Clock} color="bg-purple-500" />
        <StatCard title="Resolvidos" value={stats.resolved} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Status das Requisições</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex justify-center gap-4 mt-[-20px] flex-wrap">
               {dataByStatus.map((entry) => (
                 <div key={entry.name} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                   <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                   {entry.name}
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Volume por Unidade</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByUnit}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
