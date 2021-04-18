const ProgramTypeService = require('../../../programs/program-type.service');
const {
  getProgramTypes
} = require('../../../dao/program-type/program-type-dao');

const mockGetProgramTypes = getProgramTypes;

jest.mock('../../../dao/program-type/program-type-dao', () => ({
  getProgramTypes: jest.fn()
}));

describe('ProgramTypeService: ', () => {
  const testProgramTypes = [
    {
      program_id: 1,
      name: 'Test HIV Program 1',
      uuid: 'test-hiv-program-1-uuid'
    },
    {
      program_id: 2,
      name: 'Test Oncology Program 1',
      uuid: 'test-oncology-program-1-uuid'
    },
    {
      program_id: 3,
      name: 'Test HIV Program 2',
      uuid: 'test-hiv-program-2-uuid'
    },
    {
      program_id: 4,
      name: 'Test CDM Program 1',
      uuid: 'test-cdm-program-1-uuid'
    }
  ];

  test('fetches and returns all of the available program types', async () => {
    mockGetProgramTypes.mockResolvedValue(testProgramTypes);

    await ProgramTypeService.getAllProgramTypes()
      .then((programTypes) => {
        expect(programTypes).toBeDefined();
        expect(programTypes).toEqual(testProgramTypes);
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('throws an error if there is a problem getting program types data', async () => {
    const message = 'Error establishing connection to MySQL Server';

    mockGetProgramTypes.mockRejectedValue({ message });

    await ProgramTypeService.getAllProgramTypes()
      .then((programTypes) => {
        expect(programTypes).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/error fetching program types/i);
      });
  });

  test('maps program UUIDs to IDs', () => {
    const programTypeMap = ProgramTypeService.mapProgramUuidToId(
      testProgramTypes
    );
    expect(programTypeMap.size).toEqual(4);
    testProgramTypes.map((program) => {
      expect(programTypeMap.has(program.uuid)).toBeTruthy();
    });
  });

  test('returns the matching program ID from the program type map or -1 given a uuid', () => {
    expect(
      ProgramTypeService.getProgramIdFromUuid('test-hiv-program-1-uuid')
    ).toEqual(1);
    expect(
      ProgramTypeService.getProgramIdFromUuid('test-hiv-program-2-uuid')
    ).toEqual(3);
    expect(
      ProgramTypeService.getProgramIdFromUuid('test-hiv-program-3-uuid')
    ).toEqual(-1, 'no matching program ID; returns -1');
  });

  test('loads and returns a map of program UUIDs to program IDs', async () => {
    const expected = [
      'test-hiv-program-1-uuid',
      1,
      'test-oncology-program-1-uuid',
      2,
      'test-hiv-program-2-uuid',
      3,
      'test-cdm-program-1-uuid',
      4
    ];

    mockGetProgramTypes.mockResolvedValue(testProgramTypes);

    await ProgramTypeService.loadAndMapProgramUuidToId()
      .then((programTypeMap) => {
        expect(programTypeMap.size).toBeGreaterThan(0);
        testProgramTypes.map((program) => {
          expect(programTypeMap.has(program.uuid)).toBeTruthy();
        });
      })
      .catch((err) => {
        expect(err).not.toBeDefined();
      });
  });

  test('loads and returns a map of program UUIDs to program IDs', async () => {
    const error = new Error('Error establishing a database connection');

    mockGetProgramTypes.mockRejectedValue(error);

    await ProgramTypeService.loadAndMapProgramUuidToId()
      .then((programTypeMap) => {
        expect(programTypeMap).not.toBeDefined();
      })
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toMatch(/error loading and mapping program uuids to ids/i);
      });
  });
});
