import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RolService } from './rol.service';
import { IRolRepository } from '../../domain/interfaces/rol-repository.interface';
import { Rol } from '../../domain/entities/rol.entity';

describe('RolService', () => {
  let service: RolService;
  let repository: jest.Mocked<IRolRepository>;

  const mockRepository: jest.Mocked<IRolRepository> = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findByDenominacionFiltered: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    findByDenominacion: jest.fn(),
    findByIds: jest.fn(),
  } as unknown as jest.Mocked<IRolRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolService,
        {
          provide: 'IRolRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RolService>(RolService);
    repository = module.get('IRolRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debería devolver la entidad si existe', async () => {
      const rolMock = { id: 1, denominacion: 'Admin' };
      repository.findOne.mockResolvedValue(rolMock as any);

      const result = await service.findOne(1);

      expect(result).toEqual(rolMock);
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debería crear el rol si la denominación no está en uso', async () => {
      const dto = { denominacion: 'Vendedor' } as any;
      repository.findByDenominacion.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: 2, ...dto });

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 2, ...dto });
    });

    it('debería lanzar ConflictException si la denominación ya existe', async () => {
      const dto = { denominacion: 'Admin' } as any;
      repository.findByDenominacion.mockResolvedValue({ id: 5, denominacion: 'Admin' } as any);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar la entidad si existe', async () => {
      const rolMock = { id: 1, denominacion: 'Admin' };
      repository.findOne.mockResolvedValue(rolMock as any);
      repository.remove.mockResolvedValue(undefined as unknown as Rol);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByIds', () => {
    it('debería devolver los roles si todos existen', async () => {
      const roles = [{ id: 1 }, { id: 2 }] as any;
      repository.findByIds.mockResolvedValue(roles);

      const result = await service.findByIds([1, 2]);

      expect(result).toEqual(roles);
    });

    it('debería lanzar NotFoundException si falta alguno', async () => {
      repository.findByIds.mockResolvedValue([{ id: 1 }] as any);

      await expect(service.findByIds([1, 2])).rejects.toThrow(NotFoundException);
    });
  });
});