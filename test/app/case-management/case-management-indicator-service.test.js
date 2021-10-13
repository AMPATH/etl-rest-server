const {
  getIndicatorDefinitions
} = require('../../../app/case-management/case-management-indicator-service');

describe('CaseManagementIndicatorService: ', () => {
  test('fetches and returns a list of indicator definitions', async () => {
    const expectedIndicators = ['case_manager', 'due_for_vl', 'elevated_vl'];
    await getIndicatorDefinitions().then((definitions) => {
      expect(definitions).toBeDefined();

      expect(definitions).toHaveProperty('indicators');
      expect(definitions.indicators.length).toBeGreaterThan(0);
      expectedIndicators.map((indicatorName) =>
        expect(definitions.indicators).toMatchObject(
          expect.arrayContaining([
            expect.objectContaining({ name: indicatorName })
          ])
        )
      );
    });
  });
});
