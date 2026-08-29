import { DataSource } from "typeorm";
import { IUnitOfWork } from "../unit-of-work/iunit-of-work.";
import { TypeOrmUnitOfWork } from "../unit-of-work/type-orm-unit-of-works1";

interface TransactionalHost {
  dataSource: DataSource;
  uow: IUnitOfWork | null;
}

export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: TransactionalHost,
      ...args: any[]
    ) {
      if (!this.dataSource) {
        throw new Error('dataSource no definido en el servicio');
      }

      const uow: IUnitOfWork = new TypeOrmUnitOfWork(this.dataSource);
      this.uow = uow; // se inyecta solo

      await uow.start();
      try {
        const result = await originalMethod.apply(this, args);
        await uow.commit();
        return result;
      } catch (error) {
        await uow.rollback();
        throw error;
      } finally {
        await uow.release();
        this.uow = null;
      }
    };

    return descriptor;
  };
}
