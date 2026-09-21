import { uuid } from '../core/utils.js';
import {
  transportersRepo, vehiclesRepo, driversRepo, thirdPartiesRepo, merchandiseTypesRepo, packagingTypesRepo,
} from '../repositories/referentials.repository.js';

export const transporters = {
  list: () => transportersRepo.getAll(),
  add: (data) => transportersRepo.add({ id: uuid(), ...data }),
  update: (id, data) => transportersRepo.update(id, data),
};

export const vehicles = {
  list: () => vehiclesRepo.getAll(),
  listByTransporter: (transporterId) => vehiclesRepo.getAll().filter((v) => v.transporterId === transporterId),
  add: (data) => vehiclesRepo.add({ id: uuid(), ...data }),
  update: (id, data) => vehiclesRepo.update(id, data),
};

export const drivers = {
  list: () => driversRepo.getAll(),
  add: (data) => driversRepo.add({ id: uuid(), ...data }),
  update: (id, data) => driversRepo.update(id, data),
};

export const thirdParties = {
  list: () => thirdPartiesRepo.getAll(),
  add: (data) => thirdPartiesRepo.add({ id: uuid(), ...data }),
  update: (id, data) => thirdPartiesRepo.update(id, data),
};

export const merchandiseTypes = {
  list: () => merchandiseTypesRepo.getAll(),
  add: (data) => merchandiseTypesRepo.add({ id: uuid(), ...data }),
  update: (id, data) => merchandiseTypesRepo.update(id, data),
};

export const packagingTypes = {
  list: () => packagingTypesRepo.getAll(),
  add: (data) => packagingTypesRepo.add({ id: uuid(), ...data }),
  update: (id, data) => packagingTypesRepo.update(id, data),
};
