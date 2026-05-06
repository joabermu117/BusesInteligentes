import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupPersonDto } from './create-group-person.dto';

export class UpdateGroupPersonDto extends PartialType(CreateGroupPersonDto) {}
