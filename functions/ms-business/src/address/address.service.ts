import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const citizen = await this.citizenRepository.findOne({
      where: { person_id: createAddressDto.citizenId.toString() },
    });
    if (!citizen) {
      throw new NotFoundException(`Citizen #${createAddressDto.citizenId} not found`);
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      citizen,
    });
    return await this.addressRepository.save(address);
  }

  async findAll(): Promise<Address[]> {
    return await this.addressRepository.find({
      relations: ['citizen'],
    });
  }

  async findOne(id: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['citizen'],
    });
    if (!address) throw new NotFoundException(`Address #${id} not found`);
    return address;
  }

  async findByCitizen(citizenId: number): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { citizen: { person_id: citizenId.toString() } },
      relations: ['citizen'],
    });
  }

  async update(id: number, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(id);
    const updated = Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const address = await this.findOne(id);
    await this.addressRepository.remove(address);
    return { message: `Address #${id} deleted successfully` };
  }
}
