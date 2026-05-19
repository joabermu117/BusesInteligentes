import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { IncidentBus } from '../incidents-buses/entities/incident-bus.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
  ) {}

  async getRevenueByPaymentMethod(months: number = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.paymentMethod', 'cpm')
      .leftJoinAndSelect('cpm.paymentMethod', 'pm')
      .where('ticket.issuedDate >= :since', { since })
      .andWhere('ticket.status IN (:...statuses)', {
        statuses: ['issued', 'used'],
      })
      .select([
        "DATE_FORMAT(ticket.issuedDate, '%Y-%m') AS month",
        'pm.name AS paymentName',
        'SUM(ticket.price) AS totalRevenue',
        'COUNT(ticket.id) AS totalTickets',
      ])
      .groupBy('month')
      .addGroupBy('pm.name')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Transformar a formato { month: string, [paymentMethod: string]: number }
    const methods = [...new Set(tickets.map((t) => t.paymentName))];
    const allMonths = this.getMonthRange(months);
    const revenueMap = new Map<string, Record<string, number>>();

    for (const month of allMonths) {
      const row: Record<string, number> = {};
      for (const method of methods) {
        row[method] = 0;
      }
      revenueMap.set(month, row);
    }

    for (const t of tickets) {
      const row = revenueMap.get(t.month);
      if (row) {
        row[t.paymentName] =
          (row[t.paymentName] || 0) + parseFloat(t.totalRevenue);
      }
    }

    const series = methods.map((method: string) => ({
      name: method,
      data: allMonths.map((m) => revenueMap.get(m)?.[method] ?? 0),
    }));

    return {
      months: allMonths,
      series,
      totalsByMethod: methods.map((method: string) => ({
        method,
        total:
          series
            .find((s: { name: string }) => s.name === method)
            ?.data.reduce((a: number, b: number) => a + b, 0) ?? 0,
      })),
    };
  }

  async getPassengerAgeDistribution(routeId?: number, months?: number) {
    // Si se filtra por ruta, consultamos a través de tiquetes (ruta específica)
    if (routeId) {
      return this.getPassengerAgeDistributionByRoute(routeId, months);
    }

    // Consultar ciudadanos directamente desde la tabla citizens
    const citizens = await this.citizenRepository
      .createQueryBuilder('citizen')
      .where('citizen.birthDate IS NOT NULL')
      .getMany();

    const ageRanges = [
      { label: 'Menores (0-17)', min: 0, max: 17 },
      { label: 'Jóvenes (18-25)', min: 18, max: 25 },
      { label: 'Adultos jóvenes (26-40)', min: 26, max: 40 },
      { label: 'Adultos (41-60)', min: 41, max: 60 },
      { label: 'Adultos mayores (60+)', min: 61, max: 200 },
    ];

    const ageCount = new Map<string, Set<string>>();
    for (const range of ageRanges) {
      ageCount.set(range.label, new Set());
    }
    let sinInfo = 0;
    const now = new Date();

    for (const citizen of citizens) {
      if (!citizen.birthDate) {
        sinInfo++;
        continue;
      }
      const age = Math.floor(
        (now.getTime() - new Date(citizen.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      const range = ageRanges.find((r) => age >= r.min && age <= r.max);
      if (range) {
        ageCount.get(range.label)!.add(citizen.person_id);
      }
    }

    const totalUnique = citizens.length;

    const segments = ageRanges.map((range) => {
      const passengers = ageCount.get(range.label)!;
      return {
        rango: range.label,
        pasajeros: passengers.size,
        pasajerosUnicos: passengers.size,
        porcentaje:
          totalUnique > 0
            ? parseFloat(((passengers.size / totalUnique) * 100).toFixed(1))
            : 0,
      };
    });

    // Calcular variación vs mes anterior comparando con ciudadanos que tenían
    // la edad en el mes anterior (envejeciendo un mes a cada ciudadano)
    const segmentsConVariacion = segments.map((s) => ({
      ...s,
      variacion: 0,
    }));

    // Calcular variación real si hay datos
    if (totalUnique > 0 && months && months > 0) {
      const prevDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
      const prevCounts = new Map<string, number>();
      for (const range of ageRanges) {
        prevCounts.set(range.label, 0);
      }
      for (const citizen of citizens) {
        if (!citizen.birthDate) continue;
        const age = Math.floor(
          (prevDate.getTime() - new Date(citizen.birthDate).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        );
        const range = ageRanges.find((r) => age >= r.min && age <= r.max);
        if (range) {
          prevCounts.set(range.label, prevCounts.get(range.label)! + 1);
        }
      }
      for (let i = 0; i < segmentsConVariacion.length; i++) {
        const prev = prevCounts.get(ageRanges[i].label) ?? 0;
        const curr = segmentsConVariacion[i].pasajerosUnicos;
        if (prev > 0) {
          segmentsConVariacion[i].variacion = parseFloat(
            (((curr - prev) / prev) * 100).toFixed(1),
          );
        }
      }
    }

    return {
      totalPasajeros: totalUnique,
      sinInformacion: sinInfo,
      segmentos: segmentsConVariacion,
      segmentoPredominante:
        segmentsConVariacion.length > 0
          ? segmentsConVariacion.reduce((a, b) =>
              a.pasajerosUnicos > b.pasajerosUnicos ? a : b,
            ).rango
          : null,
    };
  }

  private async getPassengerAgeDistributionByRoute(
    routeId: number,
    months?: number,
  ) {
    const since = months
      ? new Date(new Date().setMonth(new Date().getMonth() - months))
      : new Date(0);

    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.citizen', 'citizen')
      .leftJoinAndSelect('ticket.schedule', 'schedule')
      .where('ticket.issuedDate >= :since', { since })
      .andWhere('citizen.birthDate IS NOT NULL')
      .andWhere('schedule.routeId = :routeId', { routeId })
      .getMany();

    const ageRanges = [
      { label: 'Menores (0-17)', min: 0, max: 17 },
      { label: 'Jóvenes (18-25)', min: 18, max: 25 },
      { label: 'Adultos jóvenes (26-40)', min: 26, max: 40 },
      { label: 'Adultos (41-60)', min: 41, max: 60 },
      { label: 'Adultos mayores (60+)', min: 61, max: 200 },
    ];

    const ageCount = new Map<string, Set<string>>();
    for (const range of ageRanges) {
      ageCount.set(range.label, new Set());
    }
    let sinInfo = 0;
    const now = new Date();

    for (const ticket of tickets) {
      if (!ticket.citizen?.birthDate) {
        sinInfo++;
        continue;
      }
      const age = Math.floor(
        (now.getTime() - new Date(ticket.citizen.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      const range = ageRanges.find((r) => age >= r.min && age <= r.max);
      if (range && ticket.citizen.person_id) {
        ageCount.get(range.label)!.add(ticket.citizen.person_id);
      }
    }

    const totalUnique = new Set(
      tickets
        .filter((t) => t.citizen?.person_id && t.citizen?.birthDate)
        .map((t) => t.citizen!.person_id),
    ).size;

    const segments = ageRanges.map((range) => {
      const passengers = ageCount.get(range.label)!;
      return {
        rango: range.label,
        pasajeros: passengers.size,
        pasajerosUnicos: passengers.size,
        porcentaje:
          totalUnique > 0
            ? parseFloat(((passengers.size / totalUnique) * 100).toFixed(1))
            : 0,
      };
    });

    const segmentsConVariacion = segments.map((s) => ({
      ...s,
      variacion: 0,
    }));

    return {
      totalPasajeros: totalUnique,
      sinInformacion: sinInfo,
      segmentos: segmentsConVariacion,
      segmentoPredominante:
        segmentsConVariacion.length > 0
          ? segmentsConVariacion.reduce((a, b) =>
              a.pasajerosUnicos > b.pasajerosUnicos ? a : b,
            ).rango
          : null,
    };
  }

  async getIncidentTrends(months: number = 12, companyId?: number) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const query = this.incidentBusRepository
      .createQueryBuilder('ib')
      .leftJoinAndSelect('ib.incident', 'incident')
      .leftJoinAndSelect('ib.bus', 'bus')
      .leftJoinAndSelect('bus.company', 'company')
      .where('ib.reportedAt >= :since', { since });

    if (companyId) {
      query.andWhere('company.id = :companyId', { companyId });
    }

    const records = await query
      .select([
        "DATE_FORMAT(ib.reportedAt, '%Y-%m') AS month",
        'incident.type AS type',
        'COUNT(ib.id) AS count',
      ])
      .groupBy('month')
      .addGroupBy('incident.type')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Tipos de incidente (se mapean a español para display)
    const typeLabels: Record<string, string> = {
      mechanical: 'Mecánicos',
      accident: 'Accidentes',
      delay: 'Retrasos',
      other: 'Otros',
    };

    const allTypes = [...new Set(records.map((r) => r.type))];
    const allMonths = this.getMonthRange(months);
    const trendMap = new Map<string, Record<string, number>>();

    for (const month of allMonths) {
      const row: Record<string, number> = {};
      for (const t of allTypes) {
        row[t] = 0;
      }
      trendMap.set(month, row);
    }

    for (const r of records) {
      const row = trendMap.get(r.month);
      if (row) {
        row[r.type] = (row[r.type] || 0) + parseInt(r.count, 10);
      }
    }

    const series = allTypes.map((type: string) => ({
      name: typeLabels[type] || type,
      type,
      data: allMonths.map((m) => trendMap.get(m)?.[type] ?? 0),
    }));

    return { months: allMonths, series };
  }

  private getMonthRange(months: number): string[] {
    const result: string[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }
    return result;
  }
}
