import { pool } from './db.js';
import { UnitOfWork } from './UnitOfWork.js';

const ADMIN = 1;
const MANAGER = 3;
const FOOTBALL = 1;

const suffix = Date.now() % 100000;

async function main() {
  console.log('\n=== 1. Команда + спортсмени + склад в ОДНІЙ транзакції ===');
  const result = await UnitOfWork.run(pool, MANAGER, async (uow) => {
    const teamId = await uow.teams.create(FOOTBALL, `ФК Демо ${suffix}`, 'Житомир', 'Тренер Демо');
    const athlete1 = await uow.athletes.create('Ілля', 'Демченко', '2001-05-05', null);
    const athlete2 = await uow.athletes.create('Захар', 'Пробний', '2003-09-12', null);
    await uow.teamMembers.add(teamId, athlete1, 1);
    await uow.teamMembers.add(teamId, athlete2, 9);
    return { teamId, athlete2 };
  });
  console.log('COMMIT виконано. Склад нової команди:');

  await UnitOfWork.run(pool, ADMIN, async (uow) => {
    console.table(await uow.teamMembers.getRoster(result.teamId));
  });

  console.log('\n=== 2. Помилка в транзакції -> ROLLBACK усіх змін ===');
  const ghostName = `ФК Привид ${suffix}`;
  try {
    await UnitOfWork.run(pool, MANAGER, async (uow) => {
      const ghostId = await uow.teams.create(FOOTBALL, ghostName, null, null);
      console.log(`Команду "${ghostName}" створено (id=${ghostId}), далі команда з назвою, яка вже існує...`);
      await uow.teams.create(FOOTBALL, 'ФК Дніпрові Вовки', null, null);
    });
  } catch (error) {
    console.log('Помилка з БД:', (error as Error).message);
  }
  await UnitOfWork.run(pool, ADMIN, async (uow) => {
    const exists = (await uow.teams.getAll()).some((t) => t.name === ghostName);
    console.log(`Чи є "${ghostName}" в базі після ROLLBACK? ${exists ? 'так' : 'ні'}`);
  });

  console.log('\n=== 3. Аудит: хто останній змінив команду ===');
  await UnitOfWork.run(pool, ADMIN, (uow) =>
    uow.teams.update(result.teamId, `ФК Демо ${suffix}`, 'Житомир', 'Новий тренер'));
  await UnitOfWork.run(pool, ADMIN, async (uow) => {
    const team = await uow.teams.getById(result.teamId);
    console.log(`Тренер: ${team?.coach_name}; змінив: ${team?.updated_by_name}; коли: ${team?.updated_at.toISOString()}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
