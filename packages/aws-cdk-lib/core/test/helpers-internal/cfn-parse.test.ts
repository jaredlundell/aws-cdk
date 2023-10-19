import { Aws, CfnCondition, CfnElement, CfnMapping, CfnResource, cfnTagToCloudFormation } from '../../lib';
import { CfnParser, FromCloudFormation } from '../../lib/helpers-internal';

describe('CFN Parsing', () => {
  const parser = new CfnParser({
    finder: {
      findCondition(conditionName: string): CfnCondition | undefined { 
        if (conditionName === 'IncludeTag') {
          return new CfnCondition(this.conditionsScope, conditionName, {});
        }
        return undefined;
      },
      findMapping(mappingName: string): CfnMapping | undefined { return undefined; },
      findRefTarget(elementName: string): CfnElement | undefined { return undefined; },
      findResource(logicalId: string): CfnResource | undefined { return undefined; }
    },
    parameters: {}
  });

  test('parseTags', () => {
    const originalTags = [
      {Key: 'TagKey1', Value: 'TagValue1'},
      {Key: 'TagKey2', Value: 'TagValue2'},
    ];
    const parsed = parser.parseValue({
      Tags : originalTags
    });
    const cdkTags = FromCloudFormation.getArray(FromCloudFormation.getCfnTag)(parsed.Tags).value;
    expect(cdkTags).toEqual({key: 'TagKey1', value: 'TagValue1'}, {key: 'TagKey2', value: 'TagValue2'}]);

    const cfnTags = cdkTags.map((tag) => cfnTagToCloudFormation(tag));
    expect(cfnTags).toEqual(originalTags);
  });

  test('parseConditionalTags', () => {
    const originalTags = [
      {
        'Fn::If' : [
          'IncludeTag', 
          {Key: 'TagKey1', Value: 'TagValue1'},
          {"Ref" :  "AWS::NoValue"},
        ]
      },
      {Key: 'TagKey2', Value: 'TagValue2'},
    ];
    const parsed = parser.parseValue({
      Tags : originalTags
    });
    const cdkTags = FromCloudFormation.getArray(FromCloudFormation.getCfnTag)(parsed.Tags).value;
    expect(cdkTags).toEqual([Fn.confitionIf('IncludeTags', {key: 'TagKey1', value: 'TagValue1'}, Aws.NO_VALUE), {key: 'TagKey2', value: 'TagValue2'}]);

    const cfnTags = cdkTags.map((tag) => cfnTagToCloudFormation(tag));
    expect(cfnTags).toEqual(originalTags);
  });
});