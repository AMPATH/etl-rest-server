const ProgramTypeService = require('../../programs/program-type.service');
const { getProgramTypes } = require('../../dao/program-type/program-type-dao');

const mockGetProgramTypes = getProgramTypes;

jest.mock('../../dao/program-type/program-type-dao', () => ({
  ...jest.requireActual,
  getProgramTypes: jest.fn()
}));

describe('ProgramTypeService: ', () => {
  test('fetches and returns all of the available program types', async () => {
    mockGetProgramTypes.mockResolvedValue({});
    await ProgramTypeService.getAllProgramTypes();
  });
});
