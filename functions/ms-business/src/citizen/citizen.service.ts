import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { Citizen } from './entities/citizen.entity';

@Injectable()
export class CitizenService {
  private readonly logger = new Logger(CitizenService.name);

  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<Citizen> {
    const existing = await this.citizenRepository.findOne({
      where: { person_id: createCitizenDto.person_id },
    });
    if (existing) {
      throw new BadRequestException(
        `Citizen with person_id ${createCitizenDto.person_id} already exists`,
      );
    }

    const citizen = this.citizenRepository.create({
      ...createCitizenDto,
      isActive: true,
    });
    return await this.citizenRepository.save(citizen);
  }

  async activate(person_id: string, name?: string, birthDate?: string): Promise<Citizen> {
    let citizen = await this.citizenRepository.findOne({
      where: { person_id },
    });
    if (!citizen) {
      citizen = this.citizenRepository.create({
        person_id,
        name,
        isActive: true,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      });
      return await this.citizenRepository.save(citizen);
    }
    citizen.isActive = true;
    if (name) {
      citizen.name = name;
    }
    if (birthDate) {
      citizen.birthDate = new Date(birthDate);
    }
    return await this.citizenRepository.save(citizen);
  }

  async deactivate(person_id: string): Promise<Citizen> {
    const citizen = await this.findOne(person_id);
    citizen.isActive = false;
    return await this.citizenRepository.save(citizen);
  }

  async findAll(): Promise<Citizen[]> {
    return await this.citizenRepository.find({
      relations: ['addresses', 'tickets', 'paymentMethods'],
    });
  }

  async findOne(person_id: string): Promise<Citizen> {
    const citizen = await this.citizenRepository.findOne({
      where: { person_id },
      relations: ['addresses', 'tickets', 'paymentMethods'],
    });
    if (!citizen)
      throw new NotFoundException(`Citizen #${person_id} not found`);
    return citizen;
  }

  async update(
    person_id: string,
    updateCitizenDto: UpdateCitizenDto,
  ): Promise<Citizen> {
    const citizen = await this.findOne(person_id);
    const updated = Object.assign(citizen, updateCitizenDto);
    return await this.citizenRepository.save(updated);
  }

  async search(q: string, jwtToken: string, excludePersonId?: string): Promise<any[]> {
    if (!q || q.trim().length < 2) return [];

    const trimmedQ = q.trim();
    const lowerQ = trimmedQ.toLowerCase();
    const byPersonId = new Map<string, any>();

    // 1. Buscar en MySQL por nombre o person_id
    const localQb = this.citizenRepository
      .createQueryBuilder('c')
      .where('(c.name LIKE :q OR c.person_id LIKE :q)', { q: `%${trimmedQ}%` })
      .andWhere('c.isActive = true')
      .limit(20);

    if (excludePersonId) {
      localQb.andWhere('c.person_id != :excludePersonId', { excludePersonId });
    }

    const local = await localQb.getMany();
    for (const c of local) byPersonId.set(c.person_id, c);

    // 2. Complementar con sincronización desde ms-security (no reemplaza lo local)
    if (jwtToken) {
      try {
        const msSecurityUrl = process.env.MS_SECURITY || 'http://localhost:8081';
        const { data: users } = await axios.get(
          `${msSecurityUrl}/api/users`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
            timeout: 5000,
          },
        );

        const filtered = (Array.isArray(users) ? users : [])
          .filter((u: any) =>
            (u.name?.toLowerCase().includes(lowerQ) ||
              u.email?.toLowerCase().includes(lowerQ) ||
              u.id?.toLowerCase?.().includes(lowerQ)) &&
            u.id !== excludePersonId,
          )
          .slice(0, 20);

        // Sincronizar los usuarios encontrados como citizens
        for (const user of filtered) {
          if (!user.id) continue;
          const exists = await this.citizenRepository.findOne({
            where: { person_id: user.id },
          });
          if (!exists) {
            const created = await this.citizenRepository.save(
              this.citizenRepository.create({
                person_id: user.id,
                name: user.name,
                isActive: true,
              }),
            );
            byPersonId.set(user.id, created);
          } else if (!byPersonId.has(user.id) && exists.isActive) {
            byPersonId.set(user.id, exists);
          }
        }
      } catch (err) {
        this.logger.warn(`Error al sincronizar desde ms-security: ${(err as Error).message}`);
      }
    }

    return [...byPersonId.values()].slice(0, 20);
  }

  async remove(person_id: string): Promise<{ message: string }> {
    const citizen = await this.findOne(person_id);
    await this.citizenRepository.remove(citizen);
    return { message: `Citizen #${person_id} deleted successfully` };
  }
}
