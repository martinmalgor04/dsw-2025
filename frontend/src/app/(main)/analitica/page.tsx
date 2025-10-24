"use client";

import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    FileText,
    Calendar,
    Download,
    RefreshCw,
    Filter,
    Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface OverviewData {
    totalApplications: number;
    avgScore: number;
    excellentCandidates: number;
    processingTime: number;
    growthRate: number;
    conversionRate: string;
}

interface SkillTrend {
    skill: string;
    count: number;
    trend: string;
}

interface ScoreTrend {
    date: string;
    avgScore: number;
    applications: number;
}

interface ApplicationVolume {
    date: string;
    applications: number;
    completed: number;
}

interface TopSkill {
    skill: string;
    candidates: number;
    avgScore: number;
    color: string;
}

interface PerformanceMetric {
    metric: string;
    current: number;
    benchmark: number;
}

interface AnalyticsData {
    overview: OverviewData;
    skillTrends: SkillTrend[];
    scoreTrends: ScoreTrend[];
    applicationVolume: ApplicationVolume[];
    topSkills: TopSkill[];
    performanceMetrics: PerformanceMetric[];
}

export default function Analitica() {
    const [dateRange, setDateRange] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        overview: {
            totalApplications: 0,
            avgScore: 0,
            excellentCandidates: 0,
            processingTime: 0,
            growthRate: 0,
            conversionRate: "0"
        },
        skillTrends: [],
        scoreTrends: [],
        applicationVolume: [],
        topSkills: [],
        performanceMetrics: []
    });

    // Estilos glassmorphism
    const glassStyle = {
        backdropFilter: 'blur(16px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
    };

    useEffect(() => {
        loadAnalyticsData();
    }, [dateRange]);

    const loadAnalyticsData = () => {
        try {
            setIsLoading(true);

            // Datos mock para modo frontend-only
            const mockResumes = [
                { id: 1, status: 'completed', analysis: { overallScore: 85 }, createdAt: new Date('2024-01-01') },
                { id: 2, status: 'completed', analysis: { overallScore: 92 }, createdAt: new Date('2024-01-02') },
                { id: 3, status: 'completed', analysis: { overallScore: 78 }, createdAt: new Date('2024-01-03') },
                { id: 4, status: 'processing', createdAt: new Date('2024-01-04') },
                { id: 5, status: 'completed', analysis: { overallScore: 88 }, createdAt: new Date('2024-01-05') },
            ];

            const completedResumes = mockResumes.filter(r => r.status === 'completed' && r.analysis);

            // Generar análisis desde datos mock
            setAnalyticsData({
                overview: generateOverviewData(mockResumes, completedResumes),
                skillTrends: generateSkillTrends(completedResumes),
                scoreTrends: generateScoreTrends(completedResumes),
                applicationVolume: generateApplicationVolume(mockResumes),
                topSkills: generateTopSkills(completedResumes),
                performanceMetrics: generatePerformanceMetrics(completedResumes)
            });
        } catch (error) {
            console.error('Error al cargar análisis:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateOverviewData = (resumes: any[], completedResumes: any[]) => {
        const totalApplications = resumes.length;
        const avgScore = completedResumes.reduce((sum, r) => sum + (r.analysis?.overallScore || 0), 0) / (completedResumes.length || 1);
        const excellentCandidates = completedResumes.filter(r => (r.analysis?.overallScore || 0) >= 80).length;
        const processingTime = 2.5; // Promedio mock

        return {
            totalApplications,
            avgScore: Math.round(avgScore),
            excellentCandidates,
            processingTime,
            growthRate: 15.3,
            conversionRate: (excellentCandidates / totalApplications * 100).toFixed(1)
        };
    };

    const generateSkillTrends = (resumes: any[]) => {
        const skillCounts: { [key: string]: number } = {};
        resumes.forEach(resume => {
            if (resume.analysis?.skills) {
                resume.analysis.skills.forEach((skill: any) => {
                    skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1;
                });
            }
        });

        return Object.entries(skillCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
            .map(([skill, count]) => ({ skill, count, trend: Math.random() > 0.5 ? 'up' : 'down' }));
    };

    const generateScoreTrends = (resumes: any[]) => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                avgScore: 70 + Math.random() * 20,
                applications: Math.floor(Math.random() * 10) + 2
            };
        });
        return last7Days;
    };

    const generateApplicationVolume = (resumes: any[]) => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
                date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                applications: Math.floor(Math.random() * 8) + 1,
                completed: Math.floor(Math.random() * 6) + 1
            };
        });
        return last30Days;
    };

    const generateTopSkills = (resumes: any[]) => {
        const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS'];
        return skills.map((skill, index) => ({
            skill,
            candidates: Math.floor(Math.random() * 20) + 5,
            avgScore: 70 + Math.random() * 25,
            color: ['#8B5CF6', '#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4'][index]
        }));
    };

    const generatePerformanceMetrics = (resumes: any[]) => {
        const metrics = ['Comunicación', 'Habilidades Técnicas', 'Experiencia', 'Educación', 'Ajuste Cultural', 'Liderazgo'];
        return metrics.map(metric => ({
            metric,
            current: 70 + Math.random() * 25,
            benchmark: 75 + Math.random() * 15
        }));
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                        Analítica y Reportes
                    </h1>
                    <p className="text-gray-600 mt-1">Información completa sobre tu proceso de selección.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-white/30 text-gray-700 focus:outline-none"
                        style={glassStyle}
                        tabIndex={-1}
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                        <option value="1y">Último año</option>
                    </select>
                    <button
                        onClick={loadAnalyticsData}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +{analyticsData.overview.growthRate}%
                        </span>
                    </div>
                    <h3 className="text-2xl text-gray-800">{analyticsData.overview.totalApplications}</h3>
                    <p className="text-sm text-gray-600">Total de Aplicaciones</p>
                </div>

                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +2.5%
                        </span>
                    </div>
                    <h3 className="text-2xl text-gray-800">{analyticsData.overview.avgScore}%</h3>
                    <p className="text-sm text-gray-600">Puntuación Promedio</p>
                </div>

                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +18%
                        </span>
                    </div>
                    <h3 className="text-2xl text-gray-800">{analyticsData.overview.excellentCandidates}</h3>
                    <p className="text-sm text-gray-600">Candidatos Excelentes</p>
                </div>

                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm text-red-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 rotate-180" />
                            -0.5h
                        </span>
                    </div>
                    <h3 className="text-2xl text-gray-800">{analyticsData.overview.processingTime}h</h3>
                    <p className="text-sm text-gray-600">Tiempo Promedio de Procesamiento</p>
                </div>
            </div>

            {/* Cuadrícula de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendencias de Puntuación */}
                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <h3 className="text-lg text-gray-800 mb-6">Tendencias de Puntuación</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analyticsData.scoreTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Line
                                type="monotone"
                                dataKey="avgScore"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                dot={{ fill: '#8B5CF6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Habilidades Más Demandadas */}
                <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                    <h3 className="text-lg text-gray-800 mb-6">Habilidades Más Demandadas</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData.topSkills} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis dataKey="skill" type="category" tick={{ fontSize: 12 }} width={80} />
                            <Bar dataKey="candidates" fill="url(#skillsGradient)" radius={4} />
                            <defs>
                                <linearGradient id="skillsGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#14B8A6" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Volumen de Aplicaciones */}
            <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                <h3 className="text-lg text-gray-800 mb-6">Volumen de Aplicaciones</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.applicationVolume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Area
                            type="monotone"
                            dataKey="applications"
                            stackId="1"
                            stroke="#8B5CF6"
                            fill="url(#volumeGradient1)"
                        />
                        <Area
                            type="monotone"
                            dataKey="completed"
                            stackId="1"
                            stroke="#14B8A6"
                            fill="url(#volumeGradient2)"
                        />
                        <defs>
                            <linearGradient id="volumeGradient1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="volumeGradient2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="rounded-2xl p-6 shadow-xl" style={glassStyle}>
                <h3 className="text-lg text-gray-800 mb-6">Métricas de Rendimiento</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={analyticsData.performanceMetrics}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Radar
                            name="Actual"
                            dataKey="current"
                            stroke="#8B5CF6"
                            fill="#8B5CF6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Radar
                            name="Referencia"
                            dataKey="benchmark"
                            stroke="#14B8A6"
                            fill="#14B8A6"
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </RadarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Rendimiento Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-teal-500 border-dashed rounded-full"></div>
                        <span className="text-sm text-gray-600">Referencia del Sector</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
