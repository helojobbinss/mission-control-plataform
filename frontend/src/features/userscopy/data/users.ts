import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(10)

export const users = Array.from({ length: 10 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    username: faker.internet
      .username({ firstName, lastName })
      .toLocaleLowerCase(),
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement([
      'ativo',
      'inativo',
      'Suspenso',
    ]),
    role: faker.helpers.arrayElement([
      'Gerente',
      'operador',
      'analista_dados',
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})
