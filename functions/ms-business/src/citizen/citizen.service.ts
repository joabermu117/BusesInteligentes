import { Injectable } from '@nestjs/common';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';

@Injectable()
export class CitizenService {
  create(createCitizenDto: CreateCitizenDto) {
    return 'This action adds a new citizen';
  }

  findAll() {
    return `This action returns all citizen`;
  }

  findOne(id: number) {
    return `This action returns a #${id} citizen`;
  }

  update(id: number, updateCitizenDto: UpdateCitizenDto) {
    return `This action updates a #${id} citizen`;
  }

  remove(id: number) {
    return `This action removes a #${id} citizen`;
  }
}
