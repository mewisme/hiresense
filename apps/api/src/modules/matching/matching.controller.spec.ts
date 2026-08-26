import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from '@jest/globals';
import { MatchingController } from './matching.controller';

describe('MatchingController routes', () => {
  it('exposes company-scoped application matching routes', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MatchingController)).toBe('companies/:companyId/applications/:applicationId/matching');
    expect(Reflect.getMetadata(PATH_METADATA, MatchingController.prototype.run)).toBe('runs');
    expect(Reflect.getMetadata(METHOD_METADATA, MatchingController.prototype.run)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, MatchingController.prototype.getCurrent)).toBe('current');
    expect(Reflect.getMetadata(METHOD_METADATA, MatchingController.prototype.getCurrent)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, MatchingController.prototype.getRun)).toBe('runs/:matchRunId');
    expect(Reflect.getMetadata(METHOD_METADATA, MatchingController.prototype.getRun)).toBe(RequestMethod.GET);
  });
});
