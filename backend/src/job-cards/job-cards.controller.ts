import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { QueryJobCardsDto } from './dto/query-job-cards.dto';
import { UpdateJobCardDto } from './dto/update-job-card.dto';
import { JobCardsService } from './job-cards.service';

@UseGuards(JwtAuthGuard)
@Controller('job-cards')
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Post()
  create(
    @Body() createJobCardDto: CreateJobCardDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.jobCardsService.create(createJobCardDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryJobCardsDto) {
    return this.jobCardsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobCardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobCardDto: UpdateJobCardDto) {
    return this.jobCardsService.update(id, updateJobCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobCardsService.remove(id);
  }
}
