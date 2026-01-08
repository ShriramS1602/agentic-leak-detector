import ReactMarkdown from 'react-markdown';
import { ArrowLeft, DollarSign, Activity, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    data: any;
    onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
    const { summary, leaks, ai_insights } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button
                onClick={onReset}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors mb-4 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Upload
            </button>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Spend"
                    value={`$${summary.total_spend.toFixed(2)}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    trend="+12% from last month"
                    color="primary"
                />
                <StatsCard
                    title="Transactions"
                    value={summary.transaction_count}
                    icon={<Activity className="w-5 h-5" />}
                    trend="AVG $45 per txn"
                    color="accent"
                />
                <StatsCard
                    title="Potential Leaks"
                    value={leaks.length}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    trend="Requires attention"
                    color="danger"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Leaks List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-danger" />
                            Detected Leaks
                        </h3>

                        <div className="space-y-4">
                            {leaks.length === 0 ? (
                                <div className="text-slate-500 text-center py-10">No leaks detected! Great job.</div>
                            ) : (
                                leaks.map((leak: any, i: number) => (
                                    <div key={i} className="flex items-start justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-danger/30 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="p-3 bg-danger/10 rounded-lg text-danger">
                                                {leak.type === 'Subscription' ? <Activity className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-200">{leak.description}</h4>
                                                <p className="text-sm text-slate-400 capitalize">{leak.type} • {leak.frequency || 'Irregular'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-200">${leak.amount}</p>
                                            <p className="text-xs text-danger font-medium">{leak.confidence} Confidence</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Raw Data Preview (Simplified Graph Placeholder) */}
                    <div className="bg-surface/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-[300px]">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Spending Trend (Mock)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                                { name: 'W1', value: 400 },
                                { name: 'W2', value: 300 },
                                { name: 'W3', value: 550 },
                                { name: 'W4', value: 450 },
                            ]}>
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Col: AI Insights */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 bg-gradient-to-b from-surface/80 to-surface/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Gemini Insights</h3>
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            <ReactMarkdown>{ai_insights || "No insights available."}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, trend, color }: any) {
    const colorMap: any = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        accent: 'text-accent bg-accent/10 border-accent/20',
        danger: 'text-danger bg-danger/10 border-danger/20',
    };

    return (
        <div className="bg-surface/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", colorMap[color])}>
                    {icon}
                </div>
            </div>
            <p className="text-xs text-slate-500 font-medium bg-slate-800/50 inline-block px-2 py-1 rounded-lg">
                {trend}
            </p>
        </div>
    );
}
