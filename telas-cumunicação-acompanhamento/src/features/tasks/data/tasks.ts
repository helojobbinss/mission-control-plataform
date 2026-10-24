import { faker } from '@faker-js/faker'

// Setar informações fake
faker.seed(12345)

export const tasks = Array.from({ length: 5 }, () => {
  const statuses = ['Ativa', 'Agendada', 'Concluída', 'Abortada'] as const
  const labels = ['Monitoramento', 'comunicacao', 'AnaliseOrbital'] as const
  const priorities = ['Arthur', 'Sophia', 'Gabriel', 'Isabella'] as const

  return {
    id: `MISSÃO-${faker.number.int({ min: 1000, max: 9999 })}`,
    title: faker.lorem.sentence({ min: 5, max: 15 }),
    status: faker.helpers.arrayElement(statuses),
    label: faker.helpers.arrayElement(labels),
    Operador: faker.helpers.arrayElement(priorities),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    assignee: faker.person.fullName(),
    description: faker.lorem.paragraph({ min: 1, max: 3 }),
    dueDate: faker.date.future(),
  }
})
