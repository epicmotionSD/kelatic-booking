// Scheduling Intelligence Agent - Service
// Handles cancellation prediction, gap detection, and scheduling optimization

import { BaseFunctionalAgent } from '../base';
import type {
  FunctionalAgentTask,
  AgentExecutionResult,
  CancellationPrediction,
  ScheduleGap,
  ClientBookingPattern,
  RiskLevel,
} from '../types';
import type {
  PredictionResult,
  GapAnalysisResult,
  OptimalTimeSlot,
  SchedulingRecommendation,
  DailyScheduleAnalysis,
  SchedulingInsight,
} from './types';
import {
  SCHEDULING_SYSTEM_PROMPT,
  CANCELLATION_PREDICTION_PROMPT,
  GAP_ANALYSIS_PROMPT,
  BOOKING_PATTERN_PROMPT,
  SCHEDULING_INSIGHTS_PROMPT,
} from './prompts';

export class SchedulingAgent extends BaseFunctionalAgent {
  constructor(businessId: string) {
    super(businessId, 'scheduling');
  }

  getSystemPrompt(): string {
    return SCHEDULING_SYSTEM_PROMPT;
  }

  getAvailableActions(): string[] {
    return [
      'predict_cancellation',
      'analyze_gaps',
      'get_optimal_slots',
      'update_client_patterns',
      'get_recommendations',
      'fill_gap',
      'escalate_reminder',
    ];
  }

  async execute(task: FunctionalAgentTask): Promise<AgentExecutionResult> {
    await this.updateTaskStatus(task.id, 'running');

    try {
      let result: any;

      switch (task.taskType) {
        case 'predict_cancellation':
          result = await this.predictCancellation(task.input.appointmentId);
          break;
        case 'predict_all':
          result = await this.predictAllAtRisk();
          break;
        case 'analyze_gaps':
          result = await this.analyzeGaps(
            task.input.startDate ? new Date(task.input.startDate) : undefined,
            task.input.endDate ? new Date(task.input.endDate) : undefined
          );
          break;
        case 'get_optimal_slots':
          result = await this.getOptimalSlots(task.input);
          break;
        case 'update_patterns':
          result = await this.updateClientPatterns(task.input.clientId);
          break;
        case 'get_recommendations':
          result = await this.getRecommendations();
          break;
        case 'fill_gap':
          result = await this.fillGap(task.input.gapId, task.input.clientId);
          break;
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      await this.updateTaskStatus(task.id, 'completed', result);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateTaskStatus(task.id, 'failed', undefined, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // CANCELLATION PREDICTION
  // ============================================

  async predictCancellation(appointmentId: string): Promise<PredictionResult> {
    // Get appointment details
    const { data: appointment, error: aptError } = await this.supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey(
          id, first_name, last_name, email
        ),
        service:services(name, duration, price)
      `)
      .eq('id', appointmentId)
      .eq('business_id', this.businessId)
      .single();

    if (aptError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Get client history
    const { data: clientHistory } = await this.supabase
      .from('appointments')
      .select('id, start_time, status')
      .eq('client_id', appointment.client_id)
      .eq('business_id', this.businessId)
      .order('start_time', { ascending: false })
      .limit(20);

    // Calculate basic risk factors
    const history = clientHistory || [];
    const totalAppointments = history.length;
    const cancellations = history.filter(a => a.status === 'cancelled').length;
    const noShows = history.filter(a => a.status === 'no_show').length;
    const cancellationRate = totalAppointments > 0 ? cancellations / totalAppointments : 0;
    const noShowRate = totalAppointments > 0 ? noShows / totalAppointments : 0;

    // Calculate lead time
    const appointmentDate = new Date(appointment.start_time);
    const now = new Date();
    const leadTimeDays = Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Day of week (0 = Sunday)
    const dayOfWeek = appointmentDate.getDay();

    // Calculate risk score using heuristics + AI
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Historical factors
    if (cancellationRate > 0.3) {
      riskScore += 0.3;
      riskFactors.push(`High cancellation rate (${Math.round(cancellationRate * 100)}%)`);
    } else if (cancellationRate > 0.15) {
      riskScore += 0.15;
      riskFactors.push(`Moderate cancellation rate (${Math.round(cancellationRate * 100)}%)`);
    }

    if (noShowRate > 0.2) {
      riskScore += 0.25;
      riskFactors.push(`High no-show rate (${Math.round(noShowRate * 100)}%)`);
    }

    // Lead time factors
    if (leadTimeDays > 14) {
      riskScore += 0.15;
      riskFactors.push('Booked more than 2 weeks in advance');
    }

    // New client factor
    if (totalAppointments <= 1) {
      riskScore += 0.1;
      riskFactors.push('New client with limited history');
    }

    // Monday/Friday factor (typically higher cancellation)
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      riskScore += 0.05;
      riskFactors.push(`${dayOfWeek === 1 ? 'Monday' : 'Friday'} appointments have higher cancellation rates`);
    }

    // Normalize score
    riskScore = Math.min(riskScore, 1);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 0.7) {
      riskLevel = 'critical';
    } else if (riskScore >= 0.5) {
      riskLevel = 'high';
    } else if (riskScore >= 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Send additional reminder 48 hours before appointment');
      recommendations.push('Consider requiring deposit for this client');
      if (leadTimeDays > 7) {
        recommendations.push('Send confirmation request closer to appointment date');
      }
    } else if (riskLevel === 'medium') {
      recommendations.push('Send friendly reminder 24 hours before');
    }

    // Save prediction
    await this.supabase.from('cancellation_predictions').insert({
      business_id: this.businessId,
      appointment_id: appointmentId,
      client_id: appointment.client_id,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      predicted_at: new Date().toISOString(),
    });

    await this.logActivity('cancellation_predicted', {
      appointmentId,
      riskScore,
      riskLevel,
    });

    return {
      appointmentId,
      clientId: appointment.client_id,
      riskScore,
      riskLevel,
      riskFactors,
      recommendations,
    };
  }

  async predictAllAtRisk(): Promise<PredictionResult[]> {
    // Get upcoming appointments in next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('id')
      .eq('business_id', this.businessId)
      .eq('status', 'scheduled')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    const predictions: PredictionResult[] = [];

    for (const apt of appointments || []) {
      try {
        const prediction = await this.predictCancellation(apt.id);
        if (prediction.riskLevel !== 'low') {
          predictions.push(prediction);
        }
      } catch {
        // Skip failed predictions
      }
    }

    // Sort by risk score descending
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    return predictions;
  }

  async getAtRiskAppointments(): Promise<CancellationPrediction[]> {
    const { data, error } = await this.supabase
      .from('cancellation_predictions')
      .select('*')
      .eq('business_id', this.businessId)
      .in('risk_level', ['high', 'critical'])
      .is('actual_outcome', null)
      .order('risk_score', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapPredictionRow);
  }

  // ============================================
  // GAP DETECTION & FILLING
  // ============================================

  async analyzeGaps(
    startDate?: Date,
    endDate?: Date
  ): Promise<GapAnalysisResult> {
    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Get all stylists
    const { data: stylists } = await this.supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'stylist')
      .eq('is_active', true);

    // Get appointments
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('stylist_id, start_time, end_time, status')
      .eq('business_id', this.businessId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .in('status', ['scheduled', 'confirmed']);

    // Get stylist availability
    const { data: availability } = await this.supabase
      .from('stylist_availability')
      .select('*')
      .in('stylist_id', (stylists || []).map(s => s.id));

    // Detect gaps (simplified algorithm)
    const gaps: ScheduleGap[] = [];
    const avgServicePrice = 75; // Default average
    let totalPotentialRevenue = 0;
    let totalAvailableMinutes = 0;
    let totalBookedMinutes = 0;

    for (const stylist of stylists || []) {
      const stylistAppointments = (appointments || [])
        .filter(a => a.stylist_id === stylist.id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      // Simple gap detection: check for 60+ minute gaps between appointments
      for (let i = 0; i < stylistAppointments.length - 1; i++) {
        const currentEnd = new Date(stylistAppointments[i].end_time);
        const nextStart = new Date(stylistAppointments[i + 1].start_time);
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

        if (gapMinutes >= 60) {
          const potentialRevenue = Math.floor(gapMinutes / 60) * avgServicePrice;
          totalPotentialRevenue += potentialRevenue;

          const gapData = {
            business_id: this.businessId,
            stylist_id: stylist.id,
            gap_start: currentEnd.toISOString(),
            gap_end: nextStart.toISOString(),
            duration_minutes: gapMinutes,
            potential_revenue: potentialRevenue,
            status: 'open',
          };

          // Insert or update gap
          const { data: savedGap } = await this.supabase
            .from('schedule_gaps')
            .upsert(gapData, {
              onConflict: 'business_id,stylist_id,gap_start',
            })
            .select()
            .single();

          if (savedGap) {
            gaps.push(this.mapGapRow(savedGap));
          }
        }

        totalBookedMinutes += (new Date(stylistAppointments[i].end_time).getTime() -
          new Date(stylistAppointments[i].start_time).getTime()) / (1000 * 60);
      }

      // Estimate available minutes (8 hours per stylist per day)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      totalAvailableMinutes += days * 8 * 60;
    }

    const utilizationRate = totalAvailableMinutes > 0
      ? totalBookedMinutes / totalAvailableMinutes
      : 0;

    await this.logActivity('gaps_analyzed', {
      gapsFound: gaps.length,
      totalPotentialRevenue,
      utilizationRate,
    });

    return {
      gaps,
      totalLostRevenue: totalPotentialRevenue,
      utilizationRate,
      recommendations: this.generateGapRecommendations(gaps, utilizationRate),
    };
  }

  async getOpenGaps(): Promise<ScheduleGap[]> {
    const now = new Date();

    const { data, error } = await this.supabase
      .from('schedule_gaps')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('status', 'open')
      .gte('gap_start', now.toISOString())
      .order('gap_start');

    if (error) throw error;
    return (data || []).map(this.mapGapRow);
  }

  async fillGap(gapId: string, clientId: string): Promise<void> {
    const { error } = await this.supabase
      .from('schedule_gaps')
      .update({
        status: 'filled',
        filled_by: clientId,
        filled_at: new Date().toISOString(),
      })
      .eq('id', gapId)
      .eq('business_id', this.businessId);

    if (error) throw error;

    await this.logActivity('gap_filled', { gapId, clientId });
  }

  // ============================================
  // CLIENT PATTERNS
  // ============================================

  async updateClientPatterns(clientId: string): Promise<ClientBookingPattern> {
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('start_time, status, service_id, created_at')
      .eq('client_id', clientId)
      .eq('business_id', this.businessId)
      .order('start_time', { ascending: false })
      .limit(50);

    if (!appointments || appointments.length === 0) {
      throw new Error('No appointment history for client');
    }

    // Analyze patterns
    const dayCount: Record<number, number> = {};
    const hourCount: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};
    let cancellations = 0;
    let noShows = 0;
    let leadTimeDaysSum = 0;
    let frequencyDaysSum = 0;
    let frequencyCount = 0;

    for (let i = 0; i < appointments.length; i++) {
      const apt = appointments[i];
      const date = new Date(apt.start_time);

      // Day of week
      dayCount[date.getDay()] = (dayCount[date.getDay()] || 0) + 1;

      // Time slot
      const hour = date.getHours();
      const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      hourCount[slot] = (hourCount[slot] || 0) + 1;

      // Service preference
      if (apt.service_id) {
        serviceCount[apt.service_id] = (serviceCount[apt.service_id] || 0) + 1;
      }

      // Status
      if (apt.status === 'cancelled') cancellations++;
      if (apt.status === 'no_show') noShows++;

      // Lead time
      const createdAt = new Date(apt.created_at);
      leadTimeDaysSum += (date.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      // Frequency between appointments
      if (i < appointments.length - 1) {
        const nextDate = new Date(appointments[i + 1].start_time);
        frequencyDaysSum += (date.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
        frequencyCount++;
      }
    }

    // Calculate preferred days (top 2)
    const preferredDays = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([day]) => parseInt(day));

    // Calculate preferred time slots
    const preferredTimeSlots = Object.entries(hourCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot);

    // Calculate preferred services
    const preferredServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([serviceId]) => serviceId);

    const pattern: Omit<ClientBookingPattern, 'id'> = {
      businessId: this.businessId,
      clientId,
      preferredDays,
      preferredTimeSlots,
      avgBookingFrequencyDays: frequencyCount > 0 ? Math.round(frequencyDaysSum / frequencyCount) : 0,
      avgLeadTimeDays: Math.round(leadTimeDaysSum / appointments.length),
      cancellationRate: cancellations / appointments.length,
      noShowRate: noShows / appointments.length,
      preferredServices,
      lastUpdated: new Date(),
    };

    // Upsert pattern
    const { data, error } = await this.supabase
      .from('client_booking_patterns')
      .upsert({
        business_id: this.businessId,
        client_id: clientId,
        preferred_days: preferredDays,
        preferred_time_slots: preferredTimeSlots,
        avg_booking_frequency_days: pattern.avgBookingFrequencyDays,
        avg_lead_time_days: pattern.avgLeadTimeDays,
        cancellation_rate: pattern.cancellationRate,
        no_show_rate: pattern.noShowRate,
        preferred_services: preferredServices,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'business_id,client_id',
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapPatternRow(data);
  }

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  async getRecommendations(): Promise<SchedulingRecommendation[]> {
    const recommendations: SchedulingRecommendation[] = [];

    // Get at-risk appointments
    const atRisk = await this.getAtRiskAppointments();
    for (const prediction of atRisk.slice(0, 5)) {
      recommendations.push({
        type: 'reminder',
        priority: prediction.riskLevel === 'critical' ? 'critical' : 'high',
        title: `High-risk appointment requires attention`,
        description: `Appointment ${prediction.appointmentId} has ${Math.round(prediction.riskScore * 100)}% cancellation risk`,
        action: 'Send additional reminder or confirmation request',
        appointmentId: prediction.appointmentId,
        estimatedImpact: 50, // Estimated revenue at risk
      });
    }

    // Get open gaps
    const gaps = await this.getOpenGaps();
    for (const gap of gaps.slice(0, 5)) {
      recommendations.push({
        type: 'fill_gap',
        priority: gap.potentialRevenue > 100 ? 'high' : 'medium',
        title: `${gap.durationMinutes}-minute gap available`,
        description: `Open slot could generate $${gap.potentialRevenue} in revenue`,
        action: 'Send promotional offer to interested clients',
        gapId: gap.id,
        estimatedImpact: gap.potentialRevenue,
      });
    }

    // Sort by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
    });

    return recommendations;
  }

  async getOptimalSlots(input: {
    clientId?: string;
    serviceId?: string;
    preferredDate?: string;
  }): Promise<OptimalTimeSlot[]> {
    // Get client patterns if clientId provided
    let clientPattern: ClientBookingPattern | null = null;
    if (input.clientId) {
      const { data } = await this.supabase
        .from('client_booking_patterns')
        .select('*')
        .eq('business_id', this.businessId)
        .eq('client_id', input.clientId)
        .single();

      if (data) {
        clientPattern = this.mapPatternRow(data);
      }
    }

    // Get available slots from stylists
    // This is a simplified implementation
    const slots: OptimalTimeSlot[] = [];
    const targetDate = input.preferredDate ? new Date(input.preferredDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const { data: stylists } = await this.supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'stylist')
      .eq('is_active', true);

    for (const stylist of stylists || []) {
      // Add sample optimal slots (in production, calculate from actual availability)
      const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

      for (const time of times) {
        let score = 0.5; // Base score
        const reasons: string[] = [];

        // Boost score if matches client preference
        if (clientPattern) {
          const hour = parseInt(time.split(':')[0]);
          const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
          if (clientPattern.preferredTimeSlots.includes(slot)) {
            score += 0.2;
            reasons.push('Matches preferred time slot');
          }

          const dayOfWeek = targetDate.getDay();
          if (clientPattern.preferredDays.includes(dayOfWeek)) {
            score += 0.2;
            reasons.push('Matches preferred day');
          }
        }

        // Random variation for demonstration
        score += Math.random() * 0.1;

        slots.push({
          stylistId: stylist.id,
          stylistName: `${stylist.first_name} ${stylist.last_name}`,
          date: targetDate,
          startTime: time,
          endTime: this.addMinutesToTime(time, 60),
          score: Math.min(score, 1),
          reasons: reasons.length > 0 ? reasons : ['Available slot'],
        });
      }
    }

    // Sort by score descending
    slots.sort((a, b) => b.score - a.score);

    return slots.slice(0, 10);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateGapRecommendations(gaps: ScheduleGap[], utilizationRate: number): string[] {
    const recommendations: string[] = [];

    if (utilizationRate < 0.6) {
      recommendations.push('Consider running a promotional campaign to increase bookings');
    }

    if (gaps.length > 10) {
      recommendations.push('Many gaps detected - review stylist availability settings');
    }

    const morningGaps = gaps.filter(g => new Date(g.gapStart).getHours() < 12).length;
    const afternoonGaps = gaps.filter(g => new Date(g.gapStart).getHours() >= 12).length;

    if (morningGaps > afternoonGaps * 2) {
      recommendations.push('Morning slots underbooked - consider morning special promotions');
    } else if (afternoonGaps > morningGaps * 2) {
      recommendations.push('Afternoon slots underbooked - consider afternoon specials');
    }

    return recommendations;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private mapPredictionRow(row: any): CancellationPrediction {
    return {
      id: row.id,
      businessId: row.business_id,
      appointmentId: row.appointment_id,
      clientId: row.client_id,
      riskScore: parseFloat(row.risk_score) || 0,
      riskLevel: row.risk_level,
      riskFactors: row.risk_factors || [],
      predictedAt: new Date(row.predicted_at),
      actionTaken: row.action_taken,
      actionTakenAt: row.action_taken_at ? new Date(row.action_taken_at) : undefined,
      actualOutcome: row.actual_outcome,
      createdAt: new Date(row.created_at),
    };
  }

  private mapGapRow(row: any): ScheduleGap {
    return {
      id: row.id,
      businessId: row.business_id,
      stylistId: row.stylist_id,
      gapStart: new Date(row.gap_start),
      gapEnd: new Date(row.gap_end),
      durationMinutes: parseInt(row.duration_minutes) || 0,
      potentialRevenue: parseFloat(row.potential_revenue) || 0,
      status: row.status,
      filledBy: row.filled_by,
      filledAt: row.filled_at ? new Date(row.filled_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private mapPatternRow(row: any): ClientBookingPattern {
    return {
      id: row.id,
      businessId: row.business_id,
      clientId: row.client_id,
      preferredDays: row.preferred_days || [],
      preferredTimeSlots: row.preferred_time_slots || [],
      avgBookingFrequencyDays: parseInt(row.avg_booking_frequency_days) || 0,
      avgLeadTimeDays: parseInt(row.avg_lead_time_days) || 0,
      cancellationRate: parseFloat(row.cancellation_rate) || 0,
      noShowRate: parseFloat(row.no_show_rate) || 0,
      preferredStylistId: row.preferred_stylist_id,
      preferredServices: row.preferred_services || [],
      lastUpdated: new Date(row.last_updated),
    };
  }
}

// Factory function
export function createSchedulingAgent(businessId: string): SchedulingAgent {
  return new SchedulingAgent(businessId);
}
