import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(67890)

export const users = Array.from({ length: 10 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    aviso: faker.string.alpha(10),
    firstName,
    lastName,
    username: faker.internet
      .username({ firstName, lastName })
      .toLocaleLowerCase(),
    descricao: faker.string.alpha(10),
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement([
      'info',
      'aviso',
      'critico',
      'reconhecido',
    ]),
role: faker.helpers.arrayElement([
  'naoreconhecido',
  'Fechado',
  'Observacao',
  'Reconhecido',
]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})
