import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsController', () => {
  let controller: PrescriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrescriptionsController],
      providers: [
        { provide: PrescriptionsService, useValue: { findAllAdmin: jest.fn(), findByPhone: jest.fn(), findOne: jest.fn(), review: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PrescriptionsController>(PrescriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
