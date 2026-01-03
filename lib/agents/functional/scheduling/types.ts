// Scheduling Agent - Extended Types

import type {
  CancellationPrediction,
  ScheduleGap,
  ClientBookingPattern,
  RiskLevel,
} from '../types';

export interface PredictCancellationInput {
  appointmentId: string;
}

export interface PredictionResult {
  appointmentId: string;
  clientId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  recommendations: string[];
}

export interface GapAnalysisResult {
  gaps: ScheduleGap[];
  totalLostRevenue: number;
  utilizationRate: number;
  recommendations: string[];
}

export interface OptimalTimeSlot {
  stylistId: string;
  stylistName: string;
  date: Date;
  startTime: string;
  endTime: string;
  score: number;
  reasons: string[];
}

export interface SchedulingRecommendation {
  type: 'reschedule' | 'reminder' | 'fill_gap' | 'overbooking';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  appointmentId?: string;
  gapId?: string;
  estimatedImpact?: number;
}

export interface ClientPattern {
  clientId: string;
  clientName: string;
  preferredDays: string[];
  preferredTimeSlots: string[];
  avgBookingFrequency: string;
  cancellationRate: number;
  noShowRate: number;
  lifetimeValue: number;
  riskLevel: RiskLevel;
  nextPredictedVisit?: Date;
}

export interface DailyScheduleAnalysis {
  date: Date;
  totalSlots: number;
  bookedSlots: number;
  utilization: number;
  gaps: ScheduleGap[];
  atRiskAppointments: CancellationPrediction[];
  revenue: {
    booked: number;
    atRisk: number;
    potential: number;
  };
}

export interface SchedulingInsight {
  type: 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  recommendation: string;
  data?: Record<string, any>;
}
